-- Enable RLS on rate_limits table (best practice even though only service role accesses it)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies needed - only service role (edge functions) should access this table
-- Regular users should never directly access rate limiting data