-- =============================================
-- 1. ACCOUNT LOCKOUT - Add locked_until to profiles
-- =============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS failed_login_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_failed_login timestamp with time zone DEFAULT NULL;

-- =============================================
-- 2. PASSWORD HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- Only service role can manage password history (for security)
CREATE POLICY "Service role only for password history" 
ON public.password_history 
FOR ALL 
USING (false)
WITH CHECK (false);

-- =============================================
-- 3. SESSION FINGERPRINTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.session_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id text NOT NULL,
  fingerprint_hash text NOT NULL,
  user_agent text,
  ip_address text,
  device_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen timestamp with time zone NOT NULL DEFAULT now(),
  is_trusted boolean DEFAULT true,
  UNIQUE(user_id, session_id)
);

ALTER TABLE public.session_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fingerprints" 
ON public.session_fingerprints 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert fingerprints" 
ON public.session_fingerprints 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all fingerprints" 
ON public.session_fingerprints 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 4. ADMIN IP ALLOWLIST TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.admin_ip_allowlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  description text,
  added_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(ip_address)
);

ALTER TABLE public.admin_ip_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage IP allowlist" 
ON public.admin_ip_allowlist 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 5. CONTENT VERSIONS TABLE (for blogs and projects)
-- =============================================
CREATE TABLE IF NOT EXISTS public.content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('blog', 'project')),
  content_id uuid NOT NULL,
  version_number integer NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  change_summary text,
  UNIQUE(content_type, content_id, version_number)
);

ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage content versions" 
ON public.content_versions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authors can view their content versions" 
ON public.content_versions 
FOR SELECT 
USING (auth.uid() = created_by);

-- =============================================
-- 6. SCHEDULED CONTENT TABLE
-- =============================================
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_publish boolean DEFAULT false;

-- =============================================
-- 7. USER LOGIN HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  login_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  device_info jsonb DEFAULT '{}'::jsonb,
  login_success boolean NOT NULL DEFAULT true,
  failure_reason text
);

ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own login history" 
ON public.user_login_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert login history" 
ON public.user_login_history 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all login history" 
ON public.user_login_history 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- 8. ADMIN SECURITY SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.admin_security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  updated_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security settings" 
ON public.admin_security_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default security settings
INSERT INTO public.admin_security_settings (setting_key, setting_value, description)
VALUES 
  ('account_lockout', '{"max_attempts": 5, "lockout_duration_minutes": 30, "enabled": true}'::jsonb, 'Account lockout configuration'),
  ('ip_allowlist', '{"enabled": false, "enforce_for_all_admins": true}'::jsonb, 'IP allowlist configuration'),
  ('session_fingerprinting', '{"enabled": true, "alert_on_change": true}'::jsonb, 'Session fingerprinting configuration'),
  ('password_policy', '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_number": true, "require_special": true, "password_history_count": 5}'::jsonb, 'Password policy configuration'),
  ('email_verification', '{"required_for_access": true, "grace_period_hours": 24}'::jsonb, 'Email verification requirements'),
  ('security_email_alerts', '{"enabled": true, "alert_emails": []}'::jsonb, 'Security email alert configuration')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================
-- 9. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON public.password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_session_fingerprints_user_id ON public.session_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_content_versions_content ON public.content_versions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_user_id ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_history_login_at ON public.user_login_history(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_scheduled ON public.blogs(scheduled_publish_at) WHERE scheduled_publish_at IS NOT NULL;