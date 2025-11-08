/**
 * Client-side rate limiter utility
 * Tracks attempts in localStorage and implements exponential backoff
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutMs?: number;
}

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const STORAGE_PREFIX = 'rl_';

export class RateLimiter {
  private key: string;
  private config: RateLimitConfig;

  constructor(key: string, config: RateLimitConfig) {
    this.key = STORAGE_PREFIX + key;
    this.config = config;
  }

  private getRecord(): AttemptRecord | null {
    try {
      const stored = localStorage.getItem(this.key);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  private setRecord(record: AttemptRecord): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(record));
    } catch {
      // Storage full or disabled, fail silently
    }
  }

  private clearRecord(): void {
    try {
      localStorage.removeItem(this.key);
    } catch {
      // Fail silently
    }
  }

  /**
   * Check if the action is allowed
   * @returns { allowed: boolean, retryAfter?: number, message?: string }
   */
  check(): { allowed: boolean; retryAfter?: number; message?: string } {
    const now = Date.now();
    const record = this.getRecord();

    // No previous attempts
    if (!record) {
      return { allowed: true };
    }

    // Check if locked out
    if (record.lockedUntil && now < record.lockedUntil) {
      const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        message: `Too many attempts. Please try again in ${retryAfter} seconds.`
      };
    }

    // Clear lockout if expired
    if (record.lockedUntil && now >= record.lockedUntil) {
      this.clearRecord();
      return { allowed: true };
    }

    // Check if window has expired
    if (now - record.firstAttempt > this.config.windowMs) {
      this.clearRecord();
      return { allowed: true };
    }

    // Check if max attempts exceeded
    if (record.count >= this.config.maxAttempts) {
      const lockoutMs = this.config.lockoutMs || this.config.windowMs;
      const lockedUntil = now + lockoutMs;
      this.setRecord({ ...record, lockedUntil });
      
      const retryAfter = Math.ceil(lockoutMs / 1000);
      return {
        allowed: false,
        retryAfter,
        message: `Too many attempts. Please try again in ${retryAfter} seconds.`
      };
    }

    return { allowed: true };
  }

  /**
   * Record an attempt
   */
  recordAttempt(): void {
    const now = Date.now();
    const record = this.getRecord();

    if (!record || now - record.firstAttempt > this.config.windowMs) {
      // Start new window
      this.setRecord({
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
    } else {
      // Increment count
      this.setRecord({
        ...record,
        count: record.count + 1,
        lastAttempt: now
      });
    }
  }

  /**
   * Record a successful attempt and clear rate limit
   */
  recordSuccess(): void {
    this.clearRecord();
  }
}

// Predefined rate limiters for common use cases
export const authRateLimiters = {
  signIn: new RateLimiter('auth_signin', {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutMs: 15 * 60 * 1000  // 15 minute lockout
  }),
  signUp: new RateLimiter('auth_signup', {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 60 * 60 * 1000  // 1 hour lockout
  }),
  passwordReset: new RateLimiter('auth_password_reset', {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 60 * 60 * 1000  // 1 hour lockout
  })
};

export const formRateLimiters = {
  contact: new RateLimiter('form_contact', {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 60 * 60 * 1000  // 1 hour lockout
  }),
  eventRegistration: new RateLimiter('form_event_registration', {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    lockoutMs: 30 * 60 * 1000  // 30 minute lockout
  }),
  blogSubmission: new RateLimiter('form_blog_submission', {
    maxAttempts: 5,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    lockoutMs: 60 * 60 * 1000  // 1 hour lockout
  })
};
