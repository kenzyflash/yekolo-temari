-- Fix: Restrict profile visibility to owner only
-- Drop the overly permissive policy that allows anyone to view all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Note: Admins can still view all profiles through the existing "Admins can manage all profiles" policy