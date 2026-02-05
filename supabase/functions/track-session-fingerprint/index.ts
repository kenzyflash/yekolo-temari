import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { secureJsonResponse, corsPreflightResponse } from '../_shared/securityHeaders.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface FingerprintRequest {
  fingerprint_hash: string;
  user_agent?: string;
  device_info?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  if (req.method !== 'POST') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Get auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return secureJsonResponse({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return secureJsonResponse({ error: 'Unauthorized' }, 401);
    }

    const body: FingerprintRequest = await req.json();
    const { fingerprint_hash, user_agent, device_info } = body;

    if (!fingerprint_hash) {
      return secureJsonResponse({ error: 'Fingerprint hash required' }, 400);
    }

    // Get IP address
    const ip_address = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                       req.headers.get('cf-connecting-ip') || 
                       'unknown';

    // Get session fingerprinting settings
    const { data: settings } = await supabase
      .from('admin_security_settings')
      .select('setting_value')
      .eq('setting_key', 'session_fingerprinting')
      .single();

    const fpSettings = settings?.setting_value as { enabled: boolean; alert_on_change: boolean } | null;

    if (!fpSettings?.enabled) {
      return secureJsonResponse({ success: true, message: 'Fingerprinting disabled' });
    }

    // Generate a session ID from the current auth session
    const sessionId = user.id + '-' + Date.now().toString(36);

    // Check for existing fingerprints for this user
    const { data: existingFingerprints } = await supabase
      .from('session_fingerprints')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_trusted', true);

    const isNewDevice = existingFingerprints && 
      existingFingerprints.length > 0 && 
      !existingFingerprints.some(fp => fp.fingerprint_hash === fingerprint_hash);

    // Insert or update fingerprint
    const { error: upsertError } = await supabase
      .from('session_fingerprints')
      .upsert({
        user_id: user.id,
        session_id: sessionId,
        fingerprint_hash,
        user_agent,
        ip_address,
        device_info: device_info || {},
        last_seen: new Date().toISOString(),
        is_trusted: true
      }, {
        onConflict: 'user_id,session_id'
      });

    if (upsertError) {
      console.error('Error upserting fingerprint:', upsertError);
    }

    // If this is a new device and alerts are enabled
    if (isNewDevice && fpSettings.alert_on_change) {
      // Log security event
      await supabase.from('security_events').insert({
        event_type: 'new_device_login',
        user_id: user.id,
        user_email: user.email,
        ip_address,
        details: {
          fingerprint_hash,
          user_agent,
          device_info
        }
      });

      // Create admin notification
      await supabase.from('admin_notifications').insert({
        type: 'new_device',
        title: 'New Device Login',
        message: `User ${user.email} logged in from a new device`,
        data: {
          user_id: user.id,
          user_email: user.email,
          ip_address,
          device_info
        }
      });

      // Send security alert email
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-security-alert`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            alert_type: 'new_device',
            user_email: user.email,
            severity: 'medium',
            details: {
              ip_address,
              user_agent,
              device_info
            }
          })
        });
      } catch (e) {
        console.error('Failed to send new device alert:', e);
      }

      return secureJsonResponse({ 
        success: true, 
        new_device: true,
        message: 'New device detected and recorded'
      });
    }

    return secureJsonResponse({ success: true, new_device: false });

  } catch (error) {
    console.error('Error in track-session-fingerprint:', error);
    return secureJsonResponse({ error: 'Internal server error' }, 500);
  }
});
