
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import MatrixRain from '@/components/MatrixRain';
import Footer from '@/components/Footer';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('Auth useEffect - user:', user, 'rolesLoading:', rolesLoading, 'isAdmin():', isAdmin());
    
    // Only redirect when both user is loaded and roles are loaded
    if (user && !rolesLoading) {
      console.log('User authenticated, checking admin status:', isAdmin());
      // Wait for role data to be fully processed
      const timer = setTimeout(() => {
        const adminStatus = isAdmin();
        console.log('Final admin check:', adminStatus);
        if (adminStatus) {
          console.log('User is admin, redirecting to /admin');
          navigate('/admin', { replace: true });
        } else {
          console.log('User is not admin, redirecting to /dashboard');
          navigate('/dashboard', { replace: true });
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [user, rolesLoading, isAdmin, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Signed in successfully!"
        });
        // Redirect will be handled by useEffect after roles are loaded
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        // Handle specific error cases
        if (error.message?.includes('User already registered')) {
          toast({
            title: "Account Already Exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign Up Failed",
            description: error.message || "Failed to create account",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Account created! Please check your email for verification."
        });
        
        // Clear form
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during registration",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden">
      <MatrixRain />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-md mx-auto">
          <Card className="bg-brand-darker border-brand-green/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <img 
                  src="/lovable-uploads/b0a82a80-d078-4caf-92be-cca56b1efd1e.png" 
                  alt="Yekolo Temari Logo" 
                  className="h-12 w-auto filter brightness-0 invert mx-auto"
                />
              </div>
              <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
              <CardDescription className="text-brand-green">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-brand-dark">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-brand-red">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-brand-red">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4 mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-brand-dark border-brand-green/20 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-brand-dark border-brand-green/20 text-white"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-brand-red hover:bg-brand-accent-red"
                      disabled={loading}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-brand-dark border-brand-green/20 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Password (min. 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-brand-dark border-brand-green/20 text-white"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-brand-red hover:bg-brand-accent-red"
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Auth;
