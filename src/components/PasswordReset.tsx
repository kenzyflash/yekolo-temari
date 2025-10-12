import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft } from 'lucide-react';

interface PasswordResetProps {
  onBack: () => void;
}

const PasswordReset = ({ onBack }: PasswordResetProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    // Check rate limit
    const { authRateLimiters } = await import('@/lib/rateLimiter');
    const rateLimitCheck = authRateLimiters.passwordReset.check();
    if (!rateLimitCheck.allowed) {
      toast({
        title: "Too Many Attempts",
        description: rateLimitCheck.message || "Please try again later",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`
      });

      if (error) {
        authRateLimiters.passwordReset.recordAttempt();
        throw error;
      }

      authRateLimiters.passwordReset.recordSuccess();
      setSent(true);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for password reset instructions"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <Mail className="h-16 w-16 text-brand-green mx-auto" />
        <h3 className="text-xl font-bold text-white">Check Your Email</h3>
        <p className="text-brand-green">
          We've sent password reset instructions to <strong>{email}</strong>
        </p>
        <Button
          onClick={onBack}
          variant="ghost"
          className="text-brand-green hover:text-brand-red"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Reset Password</h3>
        <p className="text-brand-green text-sm">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>
      
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-brand-dark border-brand-green/20 text-white"
          required
        />
        <Button
          type="submit"
          className="w-full bg-brand-red hover:bg-brand-accent-red"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
        <Button
          type="button"
          onClick={onBack}
          variant="ghost"
          className="w-full text-brand-green hover:text-brand-red"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Sign In
        </Button>
      </form>
    </div>
  );
};

export default PasswordReset;