import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';
import { secureJsonResponse, corsPreflightResponse } from '../_shared/securityHeaders.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SecurityAlertRequest {
  alert_type: 'failed_login' | 'account_locked' | 'suspicious_activity' | 'role_change' | 'new_device' | 'password_changed';
  user_email?: string;
  details?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const getAlertSubject = (alertType: string, severity: string): string => {
  const subjects: Record<string, string> = {
    'failed_login': '⚠️ Multiple Failed Login Attempts Detected',
    'account_locked': '🔒 Account Has Been Locked',
    'suspicious_activity': '🚨 Suspicious Activity Detected',
    'role_change': '👤 User Role Changed',
    'new_device': '📱 New Device Login Detected',
    'password_changed': '🔑 Password Changed'
  };
  return `[${severity.toUpperCase()}] ${subjects[alertType] || 'Security Alert'}`;
};

const getAlertHtml = (alertType: string, userEmail: string | undefined, details: Record<string, unknown>): string => {
  const timestamp = new Date().toISOString();
  const detailsHtml = Object.entries(details)
    .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(value))}</li>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a2e; color: #00ff88; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .alert-box { background: #fff; border-left: 4px solid #ff4444; padding: 15px; margin: 15px 0; }
        .details { background: #fff; padding: 15px; border: 1px solid #ddd; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛡️ Security Alert</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <h2>${escapeHtml(alertType.replace(/_/g, ' ').toUpperCase())}</h2>
            <p><strong>User:</strong> ${escapeHtml(userEmail || 'Unknown')}</p>
            <p><strong>Time:</strong> ${timestamp}</p>
          </div>
          <div class="details">
            <h3>Details:</h3>
            <ul>${detailsHtml}</ul>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated security alert from Yekolo Temari.</p>
          <p>If you did not trigger this action, please investigate immediately.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  if (req.method !== 'POST') {
    return secureJsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body: SecurityAlertRequest = await req.json();
    const { alert_type, user_email, details = {}, severity } = body;

    // Validate required fields
    if (!alert_type || !severity) {
      return secureJsonResponse({ error: 'Missing required fields' }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get security email settings
    const { data: settings } = await supabase
      .from('admin_security_settings')
      .select('setting_value')
      .eq('setting_key', 'security_email_alerts')
      .single();

    const emailSettings = settings?.setting_value as { enabled: boolean; alert_emails: string[] } | null;
    
    if (!emailSettings?.enabled) {
      console.log('Security email alerts are disabled');
      return secureJsonResponse({ success: true, message: 'Alerts disabled' });
    }

    // Get admin emails if no specific emails configured
    let recipientEmails = emailSettings.alert_emails || [];
    
    if (recipientEmails.length === 0) {
      // Fetch admin users
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0) {
        const adminIds = adminRoles.map(r => r.user_id);
        const { data: adminUsers } = await supabase.auth.admin.listUsers();
        
        if (adminUsers?.users) {
          recipientEmails = adminUsers.users
            .filter(u => adminIds.includes(u.id) && u.email)
            .map(u => u.email!);
        }
      }
    }

    if (recipientEmails.length === 0) {
      console.log('No recipient emails found');
      return secureJsonResponse({ success: true, message: 'No recipients' });
    }

    // Only send emails for medium+ severity or specific alert types
    const shouldSendEmail = 
      severity === 'critical' || 
      severity === 'high' || 
      (severity === 'medium' && ['account_locked', 'suspicious_activity', 'role_change'].includes(alert_type));

    if (!shouldSendEmail) {
      console.log(`Skipping email for ${severity} severity alert`);
      return secureJsonResponse({ success: true, message: 'Below email threshold' });
    }

    const subject = getAlertSubject(alert_type, severity);
    const html = getAlertHtml(alert_type, user_email, details);

    const emailResponse = await resend.emails.send({
      from: 'Security <noreply@yekolo-temari.com>',
      to: recipientEmails,
      subject,
      html
    });

    console.log('Security alert email sent:', emailResponse);
    return secureJsonResponse({ success: true, emailResponse });

  } catch (error) {
    console.error('Error in send-security-alert:', error);
    return secureJsonResponse({ error: 'Internal server error' }, 500);
  }
});
