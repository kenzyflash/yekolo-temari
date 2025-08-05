
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
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          setRoles([]);
        } else {
          const userRoles = data?.map(item => item.role) || [];
          setRoles(userRoles);
        }
      } catch (error) {
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
    return roles.includes(role);
  };
  
  const isAdmin = () => hasRole('admin');
  const isModerator = () => hasRole('moderator');

  return { roles, hasRole, isAdmin, isModerator, loading };
};
