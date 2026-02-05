-- Fix the overly permissive INSERT policies for new tables
-- These should restrict to authenticated users, not allow anonymous inserts

-- Drop and recreate session_fingerprints insert policy
DROP POLICY IF EXISTS "System can insert fingerprints" ON public.session_fingerprints;
CREATE POLICY "Authenticated users can insert their own fingerprints" 
ON public.session_fingerprints 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Drop and recreate user_login_history insert policy  
DROP POLICY IF EXISTS "System can insert login history" ON public.user_login_history;
CREATE POLICY "Authenticated users can insert their own login history" 
ON public.user_login_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add admin insert capability for login history (for tracking failed logins)
CREATE POLICY "Admins can insert login history" 
ON public.user_login_history 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));