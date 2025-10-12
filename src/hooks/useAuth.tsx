import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      authRateLimiters.signIn.recordAttempt();
    } else {
      authRateLimiters.signIn.recordSuccess();
    }
    
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, loading }}>
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
