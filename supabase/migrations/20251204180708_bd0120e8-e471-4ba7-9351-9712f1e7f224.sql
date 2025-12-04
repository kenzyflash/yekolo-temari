-- Create security_events table for tracking security-relevant events
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  user_email TEXT,
  ip_address TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events"
ON public.security_events FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert security events (via triggers and edge functions)
CREATE POLICY "System can insert security events"
ON public.security_events FOR INSERT
WITH CHECK (true);

-- Function to notify admins of role changes
CREATE OR REPLACE FUNCTION public.notify_admin_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- For new role assignments
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
      'role_change',
      'User Role Assigned',
      'Role "' || NEW.role::text || '" assigned to user',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'new_role', NEW.role::text,
        'event_type', 'role_assigned'
      )
    );
    
    -- Log to security_events
    INSERT INTO public.security_events (event_type, user_id, details)
    VALUES (
      'role_change',
      NEW.user_id,
      jsonb_build_object('action', 'assigned', 'role', NEW.role::text)
    );
  END IF;
  
  -- For role updates
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
      'role_change',
      'User Role Changed',
      'Role changed from "' || OLD.role::text || '" to "' || NEW.role::text || '"',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'old_role', OLD.role::text,
        'new_role', NEW.role::text,
        'event_type', 'role_changed'
      )
    );
    
    INSERT INTO public.security_events (event_type, user_id, details)
    VALUES (
      'role_change',
      NEW.user_id,
      jsonb_build_object('action', 'changed', 'old_role', OLD.role::text, 'new_role', NEW.role::text)
    );
  END IF;
  
  -- For role removals
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
      'role_change',
      'User Role Removed',
      'Role "' || OLD.role::text || '" removed from user',
      jsonb_build_object(
        'user_id', OLD.user_id,
        'old_role', OLD.role::text,
        'event_type', 'role_removed'
      )
    );
    
    INSERT INTO public.security_events (event_type, user_id, details)
    VALUES (
      'role_change',
      OLD.user_id,
      jsonb_build_object('action', 'removed', 'role', OLD.role::text)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for role changes
CREATE TRIGGER on_role_change
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_role_change();