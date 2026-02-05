import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { 
  Users, 
  MoreHorizontal, 
  Lock, 
  Unlock, 
  Download, 
  Trash2, 
  Mail,
  Search,
  RefreshCw,
  UserX,
  CheckSquare
} from 'lucide-react';

interface UserWithRole {
  user_id: string;
  role: string;
  created_at: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  locked_until?: string | null;
}

const BulkUserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch user roles with profile data
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) throw rolesError;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, locked_until');

      if (profilesError) throw profilesError;

      // Merge data
      const mergedUsers = rolesData?.map(role => {
        const profile = profilesData?.find(p => p.user_id === role.user_id);
        return {
          ...role,
          email: profile?.email || '',
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          locked_until: profile?.locked_until
        };
      }) || [];

      setUsers(mergedUsers);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllVisible = () => {
    const visibleUserIds = filteredUsers.map(u => u.user_id);
    setSelectedUsers(new Set(visibleUserIds));
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const bulkUnlockAccounts = async () => {
    if (selectedUsers.size === 0) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ locked_until: null, failed_login_count: 0 })
        .in('user_id', Array.from(selectedUsers));

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Unlocked ${selectedUsers.size} accounts`
      });
      fetchUsers();
      clearSelection();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to unlock accounts',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const bulkLockAccounts = async () => {
    if (selectedUsers.size === 0) return;
    
    setActionLoading(true);
    try {
      const lockUntil = new Date();
      lockUntil.setHours(lockUntil.getHours() + 24); // Lock for 24 hours

      const { error } = await supabase
        .from('profiles')
        .update({ locked_until: lockUntil.toISOString() })
        .in('user_id', Array.from(selectedUsers));

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Locked ${selectedUsers.size} accounts for 24 hours`
      });
      fetchUsers();
      clearSelection();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to lock accounts',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const exportSelectedUsers = () => {
    const selectedUserData = users.filter(u => selectedUsers.has(u.user_id));
    const csvContent = [
      ['User ID', 'Email', 'First Name', 'Last Name', 'Role', 'Created At', 'Locked Until'].join(','),
      ...selectedUserData.map(u => [
        u.user_id,
        u.email || '',
        u.first_name || '',
        u.last_name || '',
        u.role,
        u.created_at,
        u.locked_until || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: `Exported ${selectedUserData.length} users to CSV`
    });
  };

  const bulkRemoveRole = async () => {
    if (selectedUsers.size === 0) return;
    
    setActionLoading(true);
    try {
      // Don't allow removing admin roles for safety
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .in('user_id', Array.from(selectedUsers))
        .neq('role', 'admin');

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Removed roles from ${selectedUsers.size} users (admins protected)`
      });
      fetchUsers();
      clearSelection();
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove roles',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-green" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-brand-red" />
          <h2 className="text-xl font-bold text-white">Bulk User Management</h2>
        </div>
        <Badge variant="outline" className="border-brand-green text-brand-green">
          {users.length} total users
        </Badge>
      </div>

      {/* Search and Actions */}
      <Card className="bg-brand-darker border-brand-green/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-green/60" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-brand-dark border-brand-green/20 text-white"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllVisible}
                className="border-brand-green/20 text-brand-green"
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                Select All
              </Button>
              
              {selectedUsers.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    className="border-brand-green/20 text-brand-green"
                  >
                    Clear ({selectedUsers.size})
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-brand-red hover:bg-brand-accent-red" size="sm" disabled={actionLoading}>
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-brand-darker border-brand-green/20">
                      <DropdownMenuItem onClick={bulkUnlockAccounts} className="text-brand-green cursor-pointer">
                        <Unlock className="h-4 w-4 mr-2" />
                        Unlock Accounts
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={bulkLockAccounts} className="text-brand-green cursor-pointer">
                        <Lock className="h-4 w-4 mr-2" />
                        Lock Accounts (24h)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportSelectedUsers} className="text-brand-green cursor-pointer">
                        <Download className="h-4 w-4 mr-2" />
                        Export to CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setShowDeleteDialog(true)} 
                        className="text-brand-red cursor-pointer"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Remove Roles
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-brand-darker border-brand-green/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-brand-green/20">
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="text-brand-green">Email</TableHead>
                  <TableHead className="text-brand-green">Name</TableHead>
                  <TableHead className="text-brand-green">Role</TableHead>
                  <TableHead className="text-brand-green">Status</TableHead>
                  <TableHead className="text-brand-green">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id} className="border-brand-green/20">
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.user_id)}
                        onCheckedChange={() => toggleUserSelection(user.user_id)}
                      />
                    </TableCell>
                    <TableCell className="text-white">{user.email || 'N/A'}</TableCell>
                    <TableCell className="text-brand-green/80">
                      {user.first_name || user.last_name 
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                        className={user.role === 'admin' ? 'bg-brand-red' : 'bg-brand-green/20 text-brand-green'}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.locked_until && new Date(user.locked_until) > new Date() ? (
                        <Badge variant="destructive" className="bg-orange-600">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-brand-green/20 text-brand-green">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-brand-green/60 text-sm">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-brand-green/60 py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-brand-darker border-brand-red/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remove User Roles?</AlertDialogTitle>
            <AlertDialogDescription className="text-brand-green/80">
              This will remove roles from {selectedUsers.size} selected users. 
              Admin users are protected and will not be affected.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-brand-dark border-brand-green/20 text-brand-green">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={bulkRemoveRole}
              className="bg-brand-red hover:bg-brand-accent-red"
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Remove Roles'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BulkUserManagement;
