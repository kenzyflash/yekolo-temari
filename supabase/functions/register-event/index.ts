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
    return corsPreflightResponse();
  }

  try {
    // Check rate limit
    const rateLimitCheck = await rateLimiter.check(req);
    if (!rateLimitCheck.allowed) {
      console.log('Rate limit exceeded for event registration');
      return secureJsonResponse(
        { error: rateLimitCheck.message || 'Too many requests', retryAfter: rateLimitCheck.retryAfter },
        429
      );
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      await rateLimiter.recordAttempt(req);
      return secureJsonResponse({ error: 'Missing authorization header' }, 401);
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
      return secureJsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { event_id, user_id, action }: RegistrationRequest = await req.json();

    // Validate that user can only register themselves
    if (user.id !== user_id) {
      await rateLimiter.recordAttempt(req);
      return secureJsonResponse({ error: 'Cannot register other users' }, 403);
    }

    // Validate event_id
    if (!event_id || typeof event_id !== 'string') {
      await rateLimiter.recordAttempt(req);
      return secureJsonResponse({ error: 'Invalid event_id' }, 400);
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
        return secureJsonResponse({ error: 'Event not found' }, 404);
      }

      if (!event.registration_open) {
        await rateLimiter.recordAttempt(req);
        return secureJsonResponse({ error: 'Registration is closed for this event' }, 400);
      }

      // Check if already registered
      const { data: existing } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', event_id)
        .eq('user_id', user_id)
        .single();

      if (existing) {
        return secureJsonResponse({ error: 'Already registered for this event' }, 400);
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
        return secureJsonResponse({ error: 'Failed to register for event' }, 500);
      }

      await rateLimiter.recordSuccess(req);
      console.log('User registered for event:', data.id);

      return secureJsonResponse({ success: true, data });

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
        return secureJsonResponse({ error: 'Failed to unregister from event' }, 500);
      }

      await rateLimiter.recordSuccess(req);
      console.log('User unregistered from event');

      return secureJsonResponse({ success: true });

    } else {
      await rateLimiter.recordAttempt(req);
      return secureJsonResponse({ error: 'Invalid action' }, 400);
    }

  } catch (error: any) {
    console.error('Error in register-event function:', error);
    await rateLimiter.recordAttempt(req);
    return secureJsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
};

serve(handler);
