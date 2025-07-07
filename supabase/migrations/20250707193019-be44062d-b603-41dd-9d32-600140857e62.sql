-- Remove moderator role and recreate enum with only admin and user
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Recreate user_roles table with new enum
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'user'::app_role;

-- Create event_participants table for tracking event registrations
CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_participants
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_participants
CREATE POLICY "Users can view event participants" 
  ON public.event_participants 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can register for events" 
  ON public.event_participants 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unregister from events" 
  ON public.event_participants 
  FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage event participants" 
  ON public.event_participants 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update blogs RLS policies to hide drafts from admins
DROP POLICY IF EXISTS "Admins can do everything with blogs" ON public.blogs;
CREATE POLICY "Admins can manage published and pending blogs" 
  ON public.blogs 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role) AND status != 'draft');

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for blog images
CREATE POLICY "Anyone can view blog images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can upload blog images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own blog images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own blog images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to create notification when blog status changes
CREATE OR REPLACE FUNCTION public.notify_blog_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on status changes, not on initial creation
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.author_id,
      'Blog Status Updated',
      CASE 
        WHEN NEW.status = 'published' THEN 'Your blog "' || NEW.title || '" has been approved and published!'
        WHEN NEW.status = 'rejected' THEN 'Your blog "' || NEW.title || '" needs revision. Please check and resubmit.'
        WHEN NEW.status = 'pending' THEN 'Your blog "' || NEW.title || '" is under review.'
        ELSE 'Your blog "' || NEW.title || '" status has been updated to ' || NEW.status || '.'
      END,
      CASE 
        WHEN NEW.status = 'published' THEN 'success'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for blog status notifications
CREATE TRIGGER blog_status_notification
  AFTER UPDATE ON public.blogs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_blog_status_change();

-- Update events table to use calculated participant count
CREATE OR REPLACE FUNCTION public.get_event_participant_count(event_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER 
    FROM public.event_participants 
    WHERE event_id = event_uuid
  );
END;
$$ LANGUAGE plpgsql;