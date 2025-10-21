import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { profileSchema, type ProfileFormData } from '@/lib/validation-schemas';
import { User, Phone, Mail, FileText, Save } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export function ProfileManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          phone: data.phone || '',
          bio: data.bio || ''
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form data
    try {
      profileSchema.parse(formData);
      setErrors({});
    } catch (error: any) {
      const fieldErrors: Partial<Record<keyof ProfileFormData, string>> = {};
      error.errors.forEach((err: any) => {
        fieldErrors[err.path[0] as keyof ProfileFormData] = err.message;
      });
      setErrors(fieldErrors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let error;
      if (existingProfile) {
        // Update existing profile
        const result = await supabase
          .from('profiles')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            bio: formData.bio,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new profile
        const result = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            bio: formData.bio,
            email: user.email
          });
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      await fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading profile...</div>;
  }

  return (
    <Card className="bg-brand-darker border-brand-green/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <User className="h-5 w-5" />
          Profile Settings
        </CardTitle>
        <CardDescription className="text-brand-green">
          Manage your personal information and contact details
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-brand-green font-medium mb-2">
                First Name *
              </label>
              <Input
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
              <label className="block text-brand-green font-medium mb-2">
                Last Name *
              </label>
              <Input
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
            <label className="block text-brand-green font-medium mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-brand-dark/50 border-brand-green/20 text-white/60"
            />
            <p className="text-xs text-brand-green/60 mt-1">
              Email address cannot be changed here. Contact support if needed.
            </p>
          </div>

          <div>
            <label className="block text-brand-green font-medium mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-brand-dark border-brand-green/20 text-white"
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="text-destructive text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-brand-green font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bio
            </label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="bg-brand-dark border-brand-green/20 text-white"
              rows={4}
              placeholder="Tell us about yourself..."
            />
            {errors.bio && (
              <p className="text-destructive text-sm mt-1">{errors.bio}</p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="bg-brand-red hover:bg-brand-accent-red"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>

        {profile && (
          <div className="mt-6 pt-6 border-t border-brand-green/20">
            <div className="text-xs text-brand-green/60">
              <p>Profile created: {new Date(profile.created_at).toLocaleDateString()}</p>
              <p>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}