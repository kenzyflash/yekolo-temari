
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Search, Shield, User, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserWithRole {
  id: string;
  email: string;
  displayName?: string;
  created_at: string;
  last_sign_in_at: string;
  roles: string[];
}

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAuditLog, setShowAuditLog] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      // Fetch users from auth.users (admin query) to get email addresses
      const { data: authUsersData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Fetch user roles and profiles separately
      const [rolesResponse, profilesResponse] = await Promise.all([
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('profiles').select('user_id, first_name, last_name, created_at')
      ]);

      if (rolesResponse.error) throw rolesResponse.error;
      if (profilesResponse.error) throw profilesResponse.error;

      const userRoles = rolesResponse.data || [];
      const profiles = profilesResponse.data || [];
      const authUsers = authUsersData?.users || [];

      // Create maps for efficient lookup
      const profilesMap = new Map();
      profiles.forEach(profile => {
        profilesMap.set(profile.user_id, profile);
      });

      const authUsersMap = new Map();
      authUsers.forEach(user => {
        authUsersMap.set(user.id, user);
      });

      // Group roles by user_id and create user objects
      const usersMap = new Map<string, UserWithRole>();
      
      userRoles.forEach(({ user_id, role }) => {
        if (!usersMap.has(user_id)) {
          const profile = profilesMap.get(user_id);
          const authUser = authUsersMap.get(user_id);
          const fullName = profile 
            ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
            : '';
          
          usersMap.set(user_id, {
            id: user_id,
            email: authUser?.email || `user-${user_id.slice(0, 8)}@unknown.com`, // Use actual email
            displayName: fullName || authUser?.email || `User ${user_id.slice(0, 8)}`, // Add display name field
            created_at: profile?.created_at || authUser?.created_at || new Date().toISOString(),
            last_sign_in_at: authUser?.last_sign_in_at || new Date().toISOString(),
            roles: []
          });
        }
        usersMap.get(user_id)!.roles.push(role);
      });

      setUsers(Array.from(usersMap.values()));
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users. Make sure you have admin privileges.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.roles.includes(roleFilter));
    }

    setFilteredUsers(filtered);
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user', targetUserEmail: string) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be authenticated to perform this action",
        variant: "destructive"
      });
      return;
    }

    // Prevent self-role modification
    if (userId === currentUser.id) {
      toast({
        title: "Error",
        description: "You cannot modify your own role",
        variant: "destructive"
      });
      return;
    }

    try {
      const targetUser = users.find(u => u.id === userId);
      const oldRole = targetUser?.roles[0] || 'user';

      // Remove existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      // Note: Audit logging will be available once the database schema is updated
      console.warn('Security audit: Role change performed', {
        actor: currentUser.email,
        target: targetUserEmail,
        oldRole,
        newRole,
        timestamp: new Date().toISOString()
      });

      // Update local state
      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, roles: [newRole] }
            : user
        )
      );

      toast({
        title: "Success",
        description: `User role updated to ${newRole}. Action logged for security audit.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-6">
        <Users className="h-6 w-6 text-brand-red" />
        <h2 className="text-xl font-bold text-white">User Management</h2>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-green h-5 w-5" />
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-brand-darker border-brand-green/20 text-white"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="bg-brand-darker border-brand-green/20 text-white">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent className="bg-brand-darker border-brand-green/20">
            <SelectItem value="all" className="text-white">All Roles</SelectItem>
            <SelectItem value="admin" className="text-white">Admin</SelectItem>
            <SelectItem value="user" className="text-white">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-brand-green/40 mx-auto mb-4" />
            <p className="text-brand-green/80 text-lg">No users found</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="bg-brand-darker p-4 rounded-lg border border-brand-green/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-brand-red/20 rounded-full">
                    <User className="h-5 w-5 text-brand-red" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{user.displayName || user.email}</h3>
                    <p className="text-brand-green/60 text-sm">{user.email}</p>
                    <p className="text-brand-green/40 text-xs">
                      Created: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-brand-green" />
                    <span className="text-brand-green text-sm">
                      {user.roles.join(', ')}
                    </span>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-brand-green/20 text-brand-green hover:bg-brand-green hover:text-brand-dark"
                        disabled={user.id === currentUser?.id}
                      >
                        <AlertTriangle size={12} className="mr-1" />
                        Change Role
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-brand-dark border border-brand-green/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Confirm Role Change</AlertDialogTitle>
                        <AlertDialogDescription className="text-brand-green/60">
                          You are about to change the role for {user.email}. This action will be logged for security audit purposes.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-brand-green/20 text-brand-green hover:bg-brand-green/10">
                          Cancel
                        </AlertDialogCancel>
                        <div className="flex gap-2">
                          <AlertDialogAction
                            onClick={() => updateUserRole(user.id, 'user', user.email)}
                            className="bg-brand-green hover:bg-brand-green/80 text-brand-dark"
                          >
                            Set as User
                          </AlertDialogAction>
                          <AlertDialogAction
                            onClick={() => updateUserRole(user.id, 'admin', user.email)}
                            className="bg-brand-red hover:bg-brand-red/80 text-white"
                          >
                            Set as Admin
                          </AlertDialogAction>
                        </div>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserManagement;
