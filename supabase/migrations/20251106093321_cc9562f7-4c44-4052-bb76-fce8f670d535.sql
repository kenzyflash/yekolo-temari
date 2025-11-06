-- Fix contact_messages RLS: Allow users to view their own messages
CREATE POLICY "Users can view own contact messages"
ON contact_messages FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix event_participants RLS: Restrict participant data visibility
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view event participants" ON event_participants;

-- Create restrictive policy: Only admins and the user themselves can view participant records
CREATE POLICY "Users can view their own participation"
ON event_participants FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);