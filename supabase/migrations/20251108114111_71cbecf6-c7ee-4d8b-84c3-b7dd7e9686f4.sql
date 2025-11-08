-- Fix contact messages RLS policy
-- Remove the policy that allows users to view their own messages
-- Only admins should be able to view contact messages

DROP POLICY IF EXISTS "Users can view own contact messages" ON public.contact_messages;

-- Create a new policy that only allows admins to view contact messages
CREATE POLICY "Only admins can view contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Update the insert policy to be more restrictive (rate limiting via app layer)
-- Keep the existing "Anyone can insert contact messages" policy as-is for now
-- since contact forms need to work for unauthenticated users

-- Fix blog author_id exposure
-- Create a view that hides author_id from public
CREATE OR REPLACE VIEW public.blogs_public AS
SELECT 
  id,
  title,
  excerpt,
  content,
  author_name,
  category,
  tags,
  read_time,
  created_at,
  updated_at,
  status,
  published
FROM public.blogs
WHERE status = 'published' AND published = true;

-- Grant access to the view
GRANT SELECT ON public.blogs_public TO anon, authenticated;

COMMENT ON VIEW public.blogs_public IS 'Public view of blogs that hides sensitive author_id field';