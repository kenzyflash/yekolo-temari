import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { secureJsonResponse, corsPreflightResponse } from '../_shared/securityHeaders.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SecurityEventRequest {
  event_type: 'failed_login' | 'suspicious_activity' | 'session_timeout';
  user_email?: string;
  details?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  if (req.method !== 'POST') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body: SecurityEventRequest = await req.json();
    const { event_type, user_email, details } = body;

    // Validate event type
    const validEventTypes = ['failed_login', 'suspicious_activity', 'session_timeout'];
    if (!event_type || !validEventTypes.includes(event_type)) {
      return secureJsonResponse({ error: 'Invalid event type' }, 400);
    }

    // Get IP from headers
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('cf-connecting-ip') || 
                      'unknown';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log the security event
    const { error: eventError } = await supabase
      .from('security_events')
      .insert({
        event_type,
        user_email,
        ip_address: ipAddress,
        details: details || {}
      });

    if (eventError) {
      console.error('Error logging security event:', eventError);
      return secureJsonResponse({ error: 'Failed to log security event' }, 500);
    }

    // Create admin notification for high-severity events
    if (event_type === 'failed_login' || event_type === 'suspicious_activity') {
      const notificationTitle = event_type === 'failed_login' 
        ? 'Multiple Failed Login Attempts' 
        : 'Suspicious Activity Detected';
      
      const notificationMessage = event_type === 'failed_login'
        ? `Multiple failed login attempts detected for ${user_email || 'unknown user'} from IP ${ipAddress}`
        : `Suspicious activity detected for ${user_email || 'unknown user'} from IP ${ipAddress}`;

      const { error: notifError } = await supabase
        .from('admin_notifications')
        .insert({
          type: event_type,
          title: notificationTitle,
          message: notificationMessage,
          data: {
            user_email,
            ip_address: ipAddress,
            ...details
          }
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    console.log(`Security event logged: ${event_type} for ${user_email || 'unknown'} from ${ipAddress}`);
    return secureJsonResponse({ success: true });

  } catch (error) {
    console.error('Error in log-security-event:', error);
    return secureJsonResponse({ error: 'Internal server error' }, 500);
  }
});
