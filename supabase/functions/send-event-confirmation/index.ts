import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@4.0.0";
import { z } from "npm:zod@3.23.8";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const EmailRequestSchema = z.object({
  participantIds: z.array(z.string().uuid()).optional(),
  eventId: z.string().uuid(),
  emailType: z.enum(['registration', 'unregistration', 'custom']),
  customSubject: z.string().trim().min(1).max(200).optional(),
  customMessage: z.string().trim().min(1).max(5000).optional(),
});

interface EmailRequest {
  participantIds?: string[];
  eventId: string;
  emailType: 'registration' | 'unregistration' | 'custom';
  customSubject?: string;
  customMessage?: string;
}

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin role
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestBody = await req.json();
    
    // Validate input
    const validationResult = EmailRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validationResult.error.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { participantIds, eventId, emailType, customSubject, customMessage }: EmailRequest = validationResult.data;

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      return new Response(
        JSON.stringify({ error: "Event not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get participants
    let query = supabaseClient
      .from("event_participants")
      .select("id, user_id")
      .eq("event_id", eventId);

    if (participantIds && participantIds.length > 0) {
      query = query.in("id", participantIds);
    }

    const { data: participants, error: participantsError } = await query;

    if (participantsError || !participants || participants.length === 0) {
      console.error("Participants fetch error:", participantsError);
      return new Response(
        JSON.stringify({ error: "No participants found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResults = [];

    // Send emails to each participant
    for (const participant of participants) {
      // Get user details from auth.users
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(
        participant.user_id
      );

      if (authError || !authUser.user) {
        console.error(`Error fetching user ${participant.user_id}:`, authError);
        emailResults.push({ participantId: participant.id, success: false, error: "User not found" });
        continue;
      }

      const userEmail = authUser.user.email;
      const userName = authUser.user.user_metadata?.first_name || "Participant";

      let subject: string;
      let htmlContent: string;

      if (emailType === 'custom') {
        subject = customSubject || `Update: ${event.title}`;
        htmlContent = generateCustomEmail(event, userName, customMessage || '');
      } else if (emailType === 'registration') {
        subject = `Registration Confirmed: ${event.title}`;
        htmlContent = generateRegistrationEmail(event, userName);
      } else {
        subject = `Unregistration Confirmed: ${event.title}`;
        htmlContent = generateUnregistrationEmail(event, userName);
      }

      try {
        const emailResponse = await resend.emails.send({
          from: "Events <onboarding@resend.dev>",
          to: [userEmail!],
          subject: subject,
          html: htmlContent,
        });

        console.log(`Email sent to ${userEmail}:`, emailResponse);

        // Update confirmation_sent flag
        await supabaseClient
          .from("event_participants")
          .update({ confirmation_sent: true })
          .eq("id", participant.id);

        emailResults.push({ 
          participantId: participant.id, 
          success: true, 
          email: userEmail 
        });
      } catch (error: any) {
        console.error(`Error sending email to ${userEmail}:`, error);
        emailResults.push({ 
          participantId: participant.id, 
          success: false, 
          error: error.message 
        });
      }
    }

    const successCount = emailResults.filter(r => r.success).length;
    const failCount = emailResults.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successCount} emails successfully, ${failCount} failed`,
        results: emailResults 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-event-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

function generateRegistrationEmail(event: any, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
          .event-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; margin: 10px 0; }
          .detail-label { font-weight: bold; min-width: 100px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Registration Confirmed! 🎉</h1>
          </div>
          <div class="content">
            <h2>Hello ${escapeHtml(userName)}!</h2>
            <p>Thank you for registering for our event. We're excited to have you join us!</p>
            
            <div class="event-details">
              <h3 style="margin-top: 0;">Event Details</h3>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span>${escapeHtml(event.title)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span>${escapeHtml(event.event_time)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span>${escapeHtml(event.location)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span>${escapeHtml(event.event_type)}</span>
              </div>
            </div>

            <p><strong>Description:</strong></p>
            <p>${escapeHtml(event.description)}</p>

            <p>If you need to unregister or have any questions, please contact us.</p>
            
            <p>See you at the event!</p>
          </div>
          <div class="footer">
            <p>This is an automated confirmation email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateUnregistrationEmail(event: any, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
          .event-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Unregistration Confirmed</h1>
          </div>
          <div class="content">
            <h2>Hello ${escapeHtml(userName)},</h2>
            <p>We confirm that you have been successfully unregistered from the following event:</p>
            
            <div class="event-details">
              <h3 style="margin-top: 0;">${escapeHtml(event.title)}</h3>
              <p><strong>Date:</strong> ${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${escapeHtml(event.event_time)}</p>
            </div>

            <p>We're sorry to see you won't be able to make it. If you change your mind, you can register again if spots are still available.</p>
            
            <p>We hope to see you at future events!</p>
          </div>
          <div class="footer">
            <p>This is an automated confirmation email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateCustomEmail(event: any, userName: string, customMessage: string): string {
  // Escape HTML to prevent XSS - preserve line breaks
  const escapedMessage = escapeHtml(customMessage).replace(/\n/g, '<br>');
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
          .event-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .custom-message { margin: 20px 0; line-height: 1.8; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${escapeHtml(event.title)}</h1>
          </div>
          <div class="content">
            <h2>Hello ${escapeHtml(userName)},</h2>
            
            <div class="custom-message">
              ${escapedMessage}
            </div>
            
            <div class="event-details">
              <h3 style="margin-top: 0;">Event Details</h3>
              <p><strong>Date:</strong> ${new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${escapeHtml(event.event_time)}</p>
              <p><strong>Location:</strong> ${escapeHtml(event.location)}</p>
            </div>
          </div>
          <div class="footer">
            <p>This email was sent regarding ${escapeHtml(event.title)}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
