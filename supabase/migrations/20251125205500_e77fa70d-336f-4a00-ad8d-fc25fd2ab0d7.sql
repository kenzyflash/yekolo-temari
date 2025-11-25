-- Add RLS policies for rate_limits table
-- This table is used by edge functions for rate limiting
-- No user access should be allowed as it's purely for internal tracking

-- Policy to prevent all user access (only service role can access)
CREATE POLICY "Service role only access to rate_limits"
ON public.rate_limits
FOR ALL
USING (false)
WITH CHECK (false);

-- Note: Service role bypasses RLS, so edge functions can still access this table