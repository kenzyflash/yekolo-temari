import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number;
  message?: string;
}

/**
 * IP-based rate limiter for edge functions
 * Stores rate limit data in Supabase for persistence across function invocations
 */
export class EdgeRateLimiter {
  private supabaseUrl: string;
  private supabaseKey: string;
  private config: RateLimitConfig;
  private action: string;

  constructor(action: string, config: RateLimitConfig) {
    this.supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    this.supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    this.config = config;
    this.action = action;
  }

  /**
   * Get client IP from request
   */
  private getClientIP(req: Request): string {
    // Try various headers for IP address
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    
    const realIP = req.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    // Fallback to 'unknown' if no IP found
    return 'unknown';
  }

  /**
   * Check if the request is allowed based on rate limits
   */
  async check(req: Request): Promise<RateLimitResult> {
    const ip = this.getClientIP(req);
    const now = Date.now();
    const key = `${this.action}:${ip}`;

    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    try {
      // Get existing rate limit record
      const { data: record, error: fetchError } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching rate limit:', fetchError);
        // Allow request on error (fail open)
        return { allowed: true };
      }

      // No previous attempts
      if (!record) {
        return { allowed: true };
      }

      // Check if locked out
      if (record.locked_until && now < new Date(record.locked_until).getTime()) {
        const retryAfter = Math.ceil((new Date(record.locked_until).getTime() - now) / 1000);
        return {
          allowed: false,
          retryAfter,
          message: `Too many attempts from your IP. Please try again in ${retryAfter} seconds.`
        };
      }

      // Clear lockout if expired
      if (record.locked_until && now >= new Date(record.locked_until).getTime()) {
        await supabase
          .from('rate_limits')
          .delete()
          .eq('key', key);
        return { allowed: true };
      }

      // Check if window has expired
      const firstAttempt = new Date(record.first_attempt).getTime();
      if (now - firstAttempt > this.config.windowMs) {
        await supabase
          .from('rate_limits')
          .delete()
          .eq('key', key);
        return { allowed: true };
      }

      // Check if max attempts exceeded
      if (record.attempt_count >= this.config.maxAttempts) {
        const lockoutMs = this.config.lockoutMs || this.config.windowMs;
        const lockedUntil = new Date(now + lockoutMs).toISOString();
        
        await supabase
          .from('rate_limits')
          .update({ locked_until: lockedUntil })
          .eq('key', key);
        
        const retryAfter = Math.ceil(lockoutMs / 1000);
        return {
          allowed: false,
          retryAfter,
          message: `Too many attempts from your IP. Please try again in ${retryAfter} seconds.`
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open on error
      return { allowed: true };
    }
  }

  /**
   * Record an attempt
   */
  async recordAttempt(req: Request): Promise<void> {
    const ip = this.getClientIP(req);
    const key = `${this.action}:${ip}`;
    const now = new Date().toISOString();

    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    try {
      const { data: record } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('key', key)
        .single();

      if (!record) {
        // Create new record
        await supabase
          .from('rate_limits')
          .insert({
            key,
            attempt_count: 1,
            first_attempt: now,
            last_attempt: now
          });
      } else {
        // Increment count
        await supabase
          .from('rate_limits')
          .update({
            attempt_count: record.attempt_count + 1,
            last_attempt: now
          })
          .eq('key', key);
      }
    } catch (error) {
      console.error('Error recording attempt:', error);
    }
  }

  /**
   * Record a successful attempt and clear rate limit
   */
  async recordSuccess(req: Request): Promise<void> {
    const ip = this.getClientIP(req);
    const key = `${this.action}:${ip}`;

    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    try {
      await supabase
        .from('rate_limits')
        .delete()
        .eq('key', key);
    } catch (error) {
      console.error('Error clearing rate limit:', error);
    }
  }
}
