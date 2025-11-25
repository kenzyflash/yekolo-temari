-- Create email_logs table
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_ids UUID[] NOT NULL,
  recipient_emails TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  email_type TEXT NOT NULL DEFAULT 'custom',
  status TEXT NOT NULL DEFAULT 'pending',
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email logs
CREATE POLICY "Admins can manage email logs"
ON public.email_logs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_email_logs_sender_id ON public.email_logs(sender_id);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);