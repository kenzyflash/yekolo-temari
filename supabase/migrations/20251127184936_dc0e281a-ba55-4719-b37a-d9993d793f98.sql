-- Create notifications table for admin alerts
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'new_user', 'new_message', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Admins can view notifications"
ON public.admin_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.admin_notifications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.admin_notifications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to insert (for triggers)
CREATE POLICY "System can insert notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Create function to notify on new user signup
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, data)
  VALUES (
    'new_user',
    'New User Signup',
    'A new user has registered: ' || COALESCE(NEW.email, 'Unknown'),
    jsonb_build_object(
      'user_id', NEW.user_id,
      'email', NEW.email,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user notifications
CREATE TRIGGER on_new_user_notify_admin
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_user();

-- Create function to notify on new contact message
CREATE OR REPLACE FUNCTION public.notify_admin_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, data)
  VALUES (
    'new_message',
    'New Contact Message',
    'New message from: ' || NEW.name || ' (' || NEW.email || ')',
    jsonb_build_object(
      'message_id', NEW.id,
      'name', NEW.name,
      'email', NEW.email,
      'interests', NEW.interests
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new contact message notifications
CREATE TRIGGER on_new_message_notify_admin
AFTER INSERT ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_message();