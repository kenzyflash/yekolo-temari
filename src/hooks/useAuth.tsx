import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useIdleTimeout } from './useIdleTimeout';
import { toast } from '@/hooks/use-toast';

// Track failed login attempts
const failedLoginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
const FAILED_LOGIN_THRESHOLD = 5;
const FAILED_LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
  showTimeoutWarning: boolean;
  timeoutRemainingTime: number;
  resetIdleTimer: () => void;
  handleTimeoutLogout: () => void;
}

// Function to log security events
const logSecurityEvent = async (
  eventType: 'failed_login' | 'suspicious_activity' | 'session_timeout',
  userEmail?: string,
  details?: Record<string, unknown>
) => {
  try {
    await supabase.functions.invoke('log-security-event', {
      body: {
        event_type: eventType,
        user_email: userEmail,
        details
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const handleIdleTimeout = useCallback(async () => {
    const currentUser = user;
    await supabase.auth.signOut();
    localStorage.removeItem('lastActivityTime');
    
    // Log security event
    if (currentUser?.email) {
      logSecurityEvent('session_timeout', currentUser.email, {
        reason: 'idle_timeout'
      });
    }
    
    toast({
      title: 'Session Expired',
      description: 'You have been logged out due to inactivity.',
      variant: 'destructive'
    });
  }, [user]);

  const { showWarning, remainingTime, resetTimer, logout } = useIdleTimeout(
    !!user,
    handleIdleTimeout
  );

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: any) => {
    // Import rate limiter dynamically to avoid circular dependencies
    const { authRateLimiters } = await import('@/lib/rateLimiter');
    
    // Check rate limit
    const rateLimitCheck = authRateLimiters.signUp.check();
    if (!rateLimitCheck.allowed) {
      return { 
        error: { 
          message: rateLimitCheck.message || 'Too many signup attempts. Please try again later.'
        } 
      };
    }

    try {
      // Clear any existing auth state before signup
      await supabase.auth.signOut();
      
      const redirectUrl = `${window.location.origin}/auth-redirect`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });
      
      if (error) {
        authRateLimiters.signUp.recordAttempt();
        throw error;
      }
      
      authRateLimiters.signUp.recordSuccess();
      return { error: null, data };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Import rate limiter dynamically to avoid circular dependencies
    const { authRateLimiters } = await import('@/lib/rateLimiter');
    
    // Check rate limit
    const rateLimitCheck = authRateLimiters.signIn.check();
    if (!rateLimitCheck.allowed) {
      return { 
        error: { 
          message: rateLimitCheck.message || 'Too many login attempts. Please try again later.'
        } 
      };
    }

    // Check if account is locked
    try {
      const lockoutResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-account-lockout?action=check`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        }
      );
      
      if (lockoutResponse.ok) {
        const lockoutData = await lockoutResponse.json();
        if (lockoutData.locked) {
          return { 
            error: { 
              message: lockoutData.message || 'Account is locked. Please try again later.'
            } 
          };
        }
      }
    } catch (e) {
      console.error('Error checking account lockout:', e);
      // Continue with login attempt if lockout check fails
    }

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Get device info for tracking
    const userAgent = navigator.userAgent;
    
    if (error) {
      authRateLimiters.signIn.recordAttempt();
      
      // Record failed login attempt
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-account-lockout?action=record`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email, 
              success: false,
              user_agent: userAgent,
              failure_reason: error.message
            })
          }
        );
      } catch (e) {
        console.error('Error recording login attempt:', e);
      }
      
      // Track failed login attempts for security notifications
      const now = Date.now();
      const existing = failedLoginAttempts.get(email) || { count: 0, lastAttempt: 0 };
      
      // Reset if outside window
      if (now - existing.lastAttempt > FAILED_LOGIN_WINDOW) {
        failedLoginAttempts.set(email, { count: 1, lastAttempt: now });
      } else {
        const newCount = existing.count + 1;
        failedLoginAttempts.set(email, { count: newCount, lastAttempt: now });
        
        // Send security notification if threshold reached
        if (newCount === FAILED_LOGIN_THRESHOLD) {
          logSecurityEvent('failed_login', email, {
            attempt_count: newCount,
            window_minutes: FAILED_LOGIN_WINDOW / 60000
          });
        }
      }
    } else {
      authRateLimiters.signIn.recordSuccess();
      // Clear failed attempts on successful login
      failedLoginAttempts.delete(email);
      
      // Record successful login
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-account-lockout?action=record`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email, 
              success: true,
              user_agent: userAgent
            })
          }
        );
      } catch (e) {
        console.error('Error recording login success:', e);
      }

      // Track session fingerprint
      if (data?.session) {
        try {
          const fingerprintHash = await generateFingerprint();
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-session-fingerprint`,
            {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`
              },
              body: JSON.stringify({ 
                fingerprint_hash: fingerprintHash,
                user_agent: userAgent,
                device_info: {
                  platform: navigator.platform,
                  language: navigator.language,
                  screen: `${screen.width}x${screen.height}`
                }
              })
            }
          );
        } catch (e) {
          console.error('Error tracking session fingerprint:', e);
        }
      }
    }
    
    return { error };
  };

  // Simple fingerprint generator based on browser characteristics
  const generateFingerprint = async (): Promise<string> => {
    const components = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0
    ];
    
    const data = components.join('|');
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signUp, 
      signIn, 
      signOut, 
      loading,
      showTimeoutWarning: showWarning,
      timeoutRemainingTime: remainingTime,
      resetIdleTimer: resetTimer,
      handleTimeoutLogout: logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
