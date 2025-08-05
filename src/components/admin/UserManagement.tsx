
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Search, Shield, User, AlertTriangle } from 'lucide-react';
import AuditLog from './AuditLog';

interface UserWithRole {
  id: string;
  email: string;
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
      // Get all users from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Group roles by user_id
      const rolesByUser = userRoles.reduce((acc, { user_id, role }) => {
        if (!acc[user_id]) acc[user_id] = [];
        acc[user_id].push(role);
        return acc;
      }, {} as Record<string, string[]>);

      // For now, we'll create mock user data since we can't directly access auth.users
      // In a real implementation, you'd need admin service role access
      const mockUsers = Object.keys(rolesByUser).map(userId => ({
        id: userId,
        email: `user-${userId.slice(0, 8)}@example.com`,
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        roles: rolesByUser[userId] || ['user']
      }));

      setUsers(mockUsers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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

      // Log the role change for audit purposes
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          action: 'Role Change',
          target_user_id: userId,
          target_user_email: targetUserEmail,
          actor_user_id: currentUser.id,
          actor_user_email: currentUser.email || 'Unknown',
          old_role: oldRole,
          new_role: newRole,
          timestamp: new Date().toISOString()
        });

      if (auditError) {
        console.error('Failed to log audit entry:', auditError);
      }

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
    return <div className="text-brand-green">Loading users...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-brand-red" />
          <h2 className="text-xl font-bold text-white">User Management</h2>
        </div>
        <Button 
          onClick={() => setShowAuditLog(!showAuditLog)}
          variant="outline"
          className="border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-dark"
        >
          <Shield size={16} className="mr-2" />
          {showAuditLog ? 'Hide' : 'Show'} Audit Log
        </Button>
      </div>

      {showAuditLog && (
        <div className="mb-8">
          <AuditLog limit={20} />
        </div>
      )}

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
                    <h3 className="text-white font-medium">{user.email}</h3>
                    <p className="text-brand-green/60 text-sm">
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
