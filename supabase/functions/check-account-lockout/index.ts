import { createClient } from 'npm:@supabase/supabase-js@2';
import { secureJsonResponse, corsPreflightResponse } from '../_shared/securityHeaders.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface LockoutCheckRequest {
  email: string;
}

interface RecordLoginRequest {
  email: string;
  success: boolean;
  ip_address?: string;
  user_agent?: string;
  device_info?: Record<string, unknown>;
  failure_reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'check';

  try {
    if (action === 'check' && req.method === 'POST') {
      // Check if account is locked
      const body: LockoutCheckRequest = await req.json();
      const { email } = body;

      if (!email) {
        return secureJsonResponse({ error: 'Email required' }, 400);
      }

      // Get lockout settings
      const { data: settings } = await supabase
        .from('admin_security_settings')
        .select('setting_value')
        .eq('setting_key', 'account_lockout')
        .single();

      const lockoutSettings = settings?.setting_value as { 
        max_attempts: number; 
        lockout_duration_minutes: number; 
        enabled: boolean;
      } | null;

      if (!lockoutSettings?.enabled) {
        return secureJsonResponse({ locked: false, message: 'Lockout disabled' });
      }

      // Find user profile by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('locked_until, failed_login_count')
        .eq('email', email)
        .single();

      if (!profile) {
        return secureJsonResponse({ locked: false });
      }

      const now = new Date();
      const lockedUntil = profile.locked_until ? new Date(profile.locked_until) : null;

      if (lockedUntil && lockedUntil > now) {
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
        return secureJsonResponse({ 
          locked: true, 
          locked_until: profile.locked_until,
          remaining_minutes: remainingMinutes,
          message: `Account is locked. Try again in ${remainingMinutes} minutes.`
        });
      }

      // If lock has expired, reset the counter
      if (lockedUntil && lockedUntil <= now) {
        await supabase
          .from('profiles')
          .update({ locked_until: null, failed_login_count: 0 })
          .eq('email', email);
      }

      return secureJsonResponse({ locked: false });

    } else if (action === 'record' && req.method === 'POST') {
      // Record login attempt
      const body: RecordLoginRequest = await req.json();
      const { email, success, ip_address, user_agent, device_info, failure_reason } = body;

      if (!email) {
        return secureJsonResponse({ error: 'Email required' }, 400);
      }

      // Get lockout settings
      const { data: settings } = await supabase
        .from('admin_security_settings')
        .select('setting_value')
        .eq('setting_key', 'account_lockout')
        .single();

      const lockoutSettings = settings?.setting_value as { 
        max_attempts: number; 
        lockout_duration_minutes: number; 
        enabled: boolean;
      } | null;

      // Find user by email
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const user = authUsers?.users?.find(u => u.email === email);

      if (user) {
        // Record in login history
        await supabase.from('user_login_history').insert({
          user_id: user.id,
          ip_address,
          user_agent,
          device_info: device_info || {},
          login_success: success,
          failure_reason: success ? null : failure_reason
        });
      }

      if (success) {
        // Reset failed count on success
        await supabase
          .from('profiles')
          .update({ failed_login_count: 0, locked_until: null })
          .eq('email', email);

        return secureJsonResponse({ success: true });
      }

      // Handle failed login
      if (!lockoutSettings?.enabled) {
        return secureJsonResponse({ success: true, message: 'Lockout disabled' });
      }

      // Get current profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('failed_login_count, user_id')
        .eq('email', email)
        .single();

      if (!profile) {
        return secureJsonResponse({ success: true });
      }

      const newCount = (profile.failed_login_count || 0) + 1;

      if (newCount >= lockoutSettings.max_attempts) {
        // Lock the account
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + lockoutSettings.lockout_duration_minutes);

        await supabase
          .from('profiles')
          .update({ 
            failed_login_count: newCount, 
            locked_until: lockUntil.toISOString(),
            last_failed_login: new Date().toISOString()
          })
          .eq('email', email);

        // Log security event
        await supabase.from('security_events').insert({
          event_type: 'account_locked',
          user_id: profile.user_id,
          user_email: email,
          ip_address,
          details: {
            failed_attempts: newCount,
            lockout_duration_minutes: lockoutSettings.lockout_duration_minutes
          }
        });

        // Create admin notification
        await supabase.from('admin_notifications').insert({
          type: 'account_locked',
          title: 'Account Locked',
          message: `Account ${email} has been locked after ${newCount} failed login attempts`,
          data: {
            user_email: email,
            ip_address,
            failed_attempts: newCount
          }
        });

        // Trigger security email alert
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-security-alert`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              alert_type: 'account_locked',
              user_email: email,
              severity: 'high',
              details: {
                failed_attempts: newCount,
                ip_address,
                lockout_duration: `${lockoutSettings.lockout_duration_minutes} minutes`
              }
            })
          });
        } catch (e) {
          console.error('Failed to send security alert email:', e);
        }

        return secureJsonResponse({ 
          success: true, 
          account_locked: true,
          locked_until: lockUntil.toISOString()
        });
      }

      // Update failed count
      await supabase
        .from('profiles')
        .update({ 
          failed_login_count: newCount,
          last_failed_login: new Date().toISOString()
        })
        .eq('email', email);

      return secureJsonResponse({ 
        success: true, 
        failed_attempts: newCount,
        remaining_attempts: lockoutSettings.max_attempts - newCount
      });

    } else if (action === 'unlock' && req.method === 'POST') {
      // Admin unlock account
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return secureJsonResponse({ error: 'Unauthorized' }, 401);
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (!user) {
        return secureJsonResponse({ error: 'Unauthorized' }, 401);
      }

      // Check if admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        return secureJsonResponse({ error: 'Admin access required' }, 403);
      }

      const body = await req.json();
      const { email } = body;

      await supabase
        .from('profiles')
        .update({ locked_until: null, failed_login_count: 0 })
        .eq('email', email);

      // Log the unlock action
      await supabase.from('audit_logs').insert({
        action: 'account_unlocked',
        actor_user_id: user.id,
        actor_user_email: user.email || '',
        target_user_id: user.id,
        target_user_email: email,
        additional_data: { unlocked_by_admin: true }
      });

      return secureJsonResponse({ success: true, message: 'Account unlocked' });
    }

    return secureJsonResponse({ error: 'Invalid action' }, 400);

  } catch (error) {
    console.error('Error in check-account-lockout:', error);
    return secureJsonResponse({ error: 'Internal server error' }, 500);
  }
});
