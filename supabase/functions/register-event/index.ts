import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { EdgeRateLimiter } from '../_shared/rateLimiter.ts';
import { secureJsonResponse, corsPreflightResponse } from '../_shared/securityHeaders.ts';

// Rate limiter: 10 attempts per hour
const rateLimiter = new EdgeRateLimiter('event_registration', {
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  lockoutMs: 30 * 60 * 1000  // 30 minute lockout
});

interface RegistrationRequest {
  event_id: string;
  user_id: string;
  action: 'register' | 'unregister';
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
      console.log('Rate limit exceeded for event registration');
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

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      await rateLimiter.recordAttempt(req);
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      await rateLimiter.recordAttempt(req);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { event_id, user_id, action }: RegistrationRequest = await req.json();

    // Validate that user can only register themselves
    if (user.id !== user_id) {
      await rateLimiter.recordAttempt(req);
      return new Response(
        JSON.stringify({ error: 'Cannot register other users' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate event_id
    if (!event_id || typeof event_id !== 'string') {
      await rateLimiter.recordAttempt(req);
      return new Response(
        JSON.stringify({ error: 'Invalid event_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (action === 'register') {
      // Check event exists and registration is open
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('registration_open, participants')
        .eq('id', event_id)
        .single();

      if (eventError || !event) {
        await rateLimiter.recordAttempt(req);
        return new Response(
          JSON.stringify({ error: 'Event not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!event.registration_open) {
        await rateLimiter.recordAttempt(req);
        return new Response(
          JSON.stringify({ error: 'Registration is closed for this event' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Check if already registered
      const { data: existing } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', event_id)
        .eq('user_id', user_id)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Already registered for this event' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Register user
      const { data, error } = await supabase
        .from('event_participants')
        .insert({
          event_id,
          user_id,
          registered_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error registering for event:', error);
        await rateLimiter.recordAttempt(req);
        return new Response(
          JSON.stringify({ error: 'Failed to register for event' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      await rateLimiter.recordSuccess(req);
      console.log('User registered for event:', data.id);

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (action === 'unregister') {
      // Unregister user
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', event_id)
        .eq('user_id', user_id);

      if (error) {
        console.error('Error unregistering from event:', error);
        await rateLimiter.recordAttempt(req);
        return new Response(
          JSON.stringify({ error: 'Failed to unregister from event' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      await rateLimiter.recordSuccess(req);
      console.log('User unregistered from event');

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else {
      await rateLimiter.recordAttempt(req);
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error: any) {
    console.error('Error in register-event function:', error);
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
