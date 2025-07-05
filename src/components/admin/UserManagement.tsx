
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Shield, User } from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  roles: string[];
}

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

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

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
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
        description: `User role updated to ${newRole}`
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
                  
                  <Select
                    value={user.roles[0] || 'user'}
                    onValueChange={(value: 'admin' | 'user') => updateUserRole(user.id, value)}
                  >
                    <SelectTrigger className="w-32 bg-brand-darker border-brand-green/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-darker border-brand-green/20">
                      <SelectItem value="user" className="text-white">User</SelectItem>
                      <SelectItem value="admin" className="text-white">Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
