
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { authSchema, type AuthFormData } from '@/lib/validation-schemas';
import Navigation from '@/components/Navigation';
import MatrixRain from '@/components/MatrixRain';
import Footer from '@/components/Footer';
import PasswordReset from '@/components/PasswordReset';

const Auth = () => {
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AuthFormData, string>>>({});
  const { user, signIn, signUp } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !rolesLoading) {
      const timer = setTimeout(() => {
        const adminStatus = isAdmin();
        if (adminStatus) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [user, rolesLoading, isAdmin, navigate]);

  const validateSignIn = () => {
    try {
      // Manual validation for sign in (just email and password)
      const errors: Partial<Record<keyof AuthFormData, string>> = {};
      
      if (!formData.email || !formData.email.trim()) {
        errors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = "Invalid email address";
      }
      
      if (!formData.password) {
        errors.password = "Password is required";
      } else if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }
      
      if (Object.keys(errors).length > 0) {
        setErrors(errors);
        return false;
      }
      
      setErrors({});
      return true;
    } catch (error: any) {
      return false;
    }
  };

  const validateSignUp = () => {
    try {
      authSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: Partial<Record<keyof AuthFormData, string>> = {};
      error.errors.forEach((err: any) => {
        fieldErrors[err.path[0] as keyof AuthFormData] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSignIn()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(formData.email, formData.password);
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
    
    if (!validateSignUp()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const userData = {
        first_name: formData.firstName,
        last_name: formData.lastName
      };
      const { error } = await signUp(formData.email, formData.password, userData);
      if (error) {
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
        
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: ''
        });
      }
    } catch (error: any) {
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
              {showPasswordReset ? (
                <PasswordReset onBack={() => setShowPasswordReset(false)} />
              ) : (
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
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="bg-brand-dark border-brand-green/20 text-white"
                          required
                        />
                        {errors.email && (
                          <p className="text-destructive text-sm mt-1">{errors.email}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="password"
                          placeholder="Password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="bg-brand-dark border-brand-green/20 text-white"
                          required
                        />
                        {errors.password && (
                          <p className="text-destructive text-sm mt-1">{errors.password}</p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-brand-red hover:bg-brand-accent-red"
                        disabled={loading}
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </Button>
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowPasswordReset(true)}
                          className="text-brand-green hover:text-brand-red text-sm transition-colors"
                        >
                          Forgot your password?
                        </button>
                      </div>
                    </form>
                  </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          type="text"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="bg-brand-dark border-brand-green/20 text-white"
                          required
                        />
                        {errors.firstName && (
                          <p className="text-destructive text-sm mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <Input
                          type="text"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="bg-brand-dark border-brand-green/20 text-white"
                          required
                        />
                        {errors.lastName && (
                          <p className="text-destructive text-sm mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-brand-dark border-brand-green/20 text-white"
                        required
                      />
                      {errors.email && (
                        <p className="text-destructive text-sm mt-1">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Password (min. 8 characters)"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="bg-brand-dark border-brand-green/20 text-white"
                        required
                      />
                      {errors.password && (
                        <p className="text-destructive text-sm mt-1">{errors.password}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="bg-brand-dark border-brand-green/20 text-white"
                        required
                      />
                      {errors.confirmPassword && (
                        <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
                      )}
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Auth;
