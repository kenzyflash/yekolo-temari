import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";
import { EdgeRateLimiter } from "../_shared/rateLimiter.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiter: 100 emails per hour per admin
const emailRateLimiter = new EdgeRateLimiter("admin-email", {
  maxAttempts: 100,
  windowMs: 60 * 60 * 1000,
  lockoutDurationMs: 30 * 60 * 1000,
});

interface EmailRequest {
  recipient_type: 'individual' | 'selected' | 'all' | 'by_role';
  recipient_ids?: string[];
  role?: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get JWT from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // Verify user and admin status
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify admin role
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError || !userRoles?.some(r => r.role === 'admin')) {
      throw new Error("Admin access required");
    }

    // Check rate limit
    const rateLimitResult = await emailRateLimiter.check(req);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: rateLimitResult.message }),
        {
          status: 429,
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": rateLimitResult.retryAfter?.toString() || "3600",
            ...corsHeaders 
          },
        }
      );
    }

    // Parse request body
    const { recipient_type, recipient_ids, role, subject, message }: EmailRequest = await req.json();

    if (!subject?.trim() || !message?.trim()) {
      throw new Error("Subject and message are required");
    }

    console.log(`Admin ${user.email} sending emails - Type: ${recipient_type}`);

    // Fetch recipient emails based on type
    let recipients: { user_id: string; email: string }[] = [];

    if (recipient_type === 'individual' || recipient_type === 'selected') {
      if (!recipient_ids || recipient_ids.length === 0) {
        throw new Error("Recipient IDs required for this type");
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', recipient_ids)
        .not('email', 'is', null);

      if (profilesError) throw profilesError;
      recipients = profiles || [];

    } else if (recipient_type === 'all') {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .not('email', 'is', null);

      if (profilesError) throw profilesError;
      recipients = profiles || [];

    } else if (recipient_type === 'by_role') {
      if (!role) {
        throw new Error("Role required for role-based filtering");
      }

      const { data: roleUsers, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', role);

      if (roleError) throw roleError;
      
      const userIds = roleUsers?.map(r => r.user_id) || [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', userIds)
          .not('email', 'is', null);

        if (profilesError) throw profilesError;
        recipients = profiles || [];
      }
    }

    if (recipients.length === 0) {
      throw new Error("No recipients found");
    }

    console.log(`Sending to ${recipients.length} recipients`);

    // Send emails in batches
    const batchSize = 10;
    let successCount = 0;
    let failureCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(recipient =>
          resend.emails.send({
            from: "OSCA <onboarding@resend.dev>",
            to: [recipient.email],
            subject: subject,
            html: `
              <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #000; color: #00ff41; padding: 20px; border: 2px solid #00ff41;">
                  <h1 style="color: #ff0000; margin: 0 0 20px 0;">OSCA Admin Message</h1>
                  <div style="background: #000; padding: 20px; white-space: pre-wrap;">
                    ${message.replace(/\n/g, '<br>')}
                  </div>
                  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #00ff41; font-size: 12px; color: #00ff41;">
                    <p>This message was sent by an OSCA administrator.</p>
                  </div>
                </div>
              </div>
            `,
          })
        )
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          failureCount++;
          errors.push({
            email: batch[index].email,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log email send attempt
    const logStatus = failureCount === 0 ? 'sent' : 
                      successCount === 0 ? 'failed' : 'partial';

    await supabase.from('email_logs').insert({
      sender_id: user.id,
      recipient_ids: recipients.map(r => r.user_id),
      recipient_emails: recipients.map(r => r.email),
      subject,
      message,
      email_type: recipient_type,
      status: logStatus,
      success_count: successCount,
      failure_count: failureCount,
      error_details: errors.length > 0 ? errors : null,
      sent_at: new Date().toISOString(),
    });

    await emailRateLimiter.recordSuccess(req);

    console.log(`Email send complete: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Emails sent: ${successCount} succeeded, ${failureCount} failed`,
        success_count: successCount,
        failure_count: failureCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-admin-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: error.message === "Unauthorized" || error.message === "Admin access required" ? 403 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);