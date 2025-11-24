-- Create rate_limits table for IP-based rate limiting in edge functions
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  first_attempt TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON public.rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_locked_until ON public.rate_limits(locked_until) WHERE locked_until IS NOT NULL;

-- Auto-cleanup old records (older than 7 days)
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at ON public.rate_limits(created_at);

-- No RLS needed - this table is only accessed by edge functions with service role