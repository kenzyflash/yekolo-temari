
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useUserRoles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching roles for user:', user.id);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setRoles([]);
        } else {
          console.log('User roles data:', data);
          const userRoles = data?.map(item => item.role) || [];
          setRoles(userRoles);
          console.log('Parsed roles:', userRoles);
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    // Reset loading state when user changes
    setLoading(true);
    fetchUserRoles();
  }, [user]);

  const hasRole = (role: string) => {
    const result = roles.includes(role);
    console.log(`Checking role ${role}:`, result, 'Available roles:', roles);
    return result;
  };
  
  const isAdmin = () => hasRole('admin');
  const isModerator = () => hasRole('moderator');

  return { roles, hasRole, isAdmin, isModerator, loading };
};
