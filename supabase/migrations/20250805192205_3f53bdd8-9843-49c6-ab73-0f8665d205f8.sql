-- Create audit_logs table for security tracking
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  target_user_id uuid NOT NULL,
  target_user_email text NOT NULL,
  actor_user_id uuid NOT NULL,
  actor_user_email text NOT NULL,
  old_role text,
  new_role text,
  timestamp timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit logs
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better performance
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_target_user ON public.audit_logs(target_user_id);
CREATE INDEX idx_audit_logs_actor_user ON public.audit_logs(actor_user_id);