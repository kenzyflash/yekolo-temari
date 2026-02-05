import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireEmailVerification?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false, requireEmailVerification = true }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const location = useLocation();
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);

  useEffect(() => {
    const checkEmailVerification = async () => {
      if (!user || !requireEmailVerification) {
        setCheckingVerification(false);
        return;
      }

      // Check if email verification is required in settings
      try {
        const { data: settings } = await supabase
          .from('admin_security_settings')
          .select('setting_value')
          .eq('setting_key', 'email_verification')
          .single();

        const emailSettings = settings?.setting_value as { 
          required_for_access: boolean; 
          grace_period_hours: number; 
        } | null;

        if (emailSettings?.required_for_access) {
          // Check if user's email is verified
          const isVerified = user.email_confirmed_at !== null;
          
          if (!isVerified) {
            // Check grace period
            const userCreatedAt = new Date(user.created_at);
            const gracePeriodEnd = new Date(userCreatedAt.getTime() + (emailSettings.grace_period_hours * 60 * 60 * 1000));
            
            if (new Date() > gracePeriodEnd) {
              setEmailVerificationRequired(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking email verification settings:', error);
      } finally {
        setCheckingVerification(false);
      }
    };

    checkEmailVerification();
  }, [user, requireEmailVerification]);

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });
      
      if (error) throw error;
      
      alert('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      alert('Failed to send verification email. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading || rolesLoading || checkingVerification) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-brand-green text-xl">Loading...</div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Show email verification required screen
  if (emailVerificationRequired) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
        <div className="bg-brand-darker border border-brand-green/20 rounded-lg p-8 max-w-md text-center">
          <Mail className="h-16 w-16 text-brand-green mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Email Verification Required</h1>
          <p className="text-brand-green mb-6">
            Please verify your email address to continue using this feature. 
            Check your inbox for a verification link.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={handleResendVerification}
              className="w-full bg-brand-red hover:bg-brand-accent-red"
              disabled={resendingEmail}
            >
              {resendingEmail ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full border-brand-green/20 text-brand-green"
            >
              I've Verified My Email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
        <div className="bg-brand-darker border border-brand-red/20 rounded-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-brand-red mb-4">Access Denied</h1>
          <p className="text-brand-green mb-6">
            You don't have permission to access this page. Admin privileges are required.
          </p>
          <a 
            href="/" 
            className="inline-block bg-brand-red hover:bg-brand-accent-red text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
