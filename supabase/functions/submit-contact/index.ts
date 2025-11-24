import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { EdgeRateLimiter } from '../_shared/rateLimiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiter: 3 attempts per hour
const rateLimiter = new EdgeRateLimiter('contact_form', {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  lockoutMs: 60 * 60 * 1000  // 1 hour lockout
});

interface ContactRequest {
  name: string;
  email: string;
  message?: string;
  interests?: string[];
  user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check rate limit
    const rateLimitCheck = await rateLimiter.check(req);
    if (!rateLimitCheck.allowed) {
      console.log('Rate limit exceeded for contact form');
      return new Response(
        JSON.stringify({ 
          error: rateLimitCheck.message || 'Too many requests',
          retryAfter: rateLimitCheck.retryAfter 
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { name, email, message, interests, user_id }: ContactRequest = await req.json();

    // Validate input
    if (!name || name.trim().length === 0 || name.length > 100) {
      await rateLimiter.recordAttempt(req);
      return new Response(
        JSON.stringify({ error: 'Invalid name' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      await rateLimiter.recordAttempt(req);
      return new Response(
        JSON.stringify({ error: 'Invalid email' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (message && message.length > 1000) {
      await rateLimiter.recordAttempt(req);
      return new Response(
        JSON.stringify({ error: 'Message too long' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert contact message
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message?.trim() || null,
        interests: interests || null,
        user_id: user_id || null,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting contact message:', error);
      await rateLimiter.recordAttempt(req);
      return new Response(
        JSON.stringify({ error: 'Failed to submit contact form' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Clear rate limit on success
    await rateLimiter.recordSuccess(req);

    console.log('Contact form submitted successfully:', data.id);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in submit-contact function:', error);
    await rateLimiter.recordAttempt(req);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
