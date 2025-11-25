import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Users, UserCheck, Shield, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Profile {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface RecipientSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRecipientTypeChange: (type: 'selected' | 'all' | 'by_role', role?: string) => void;
}

export function RecipientSelector({ 
  selectedIds, 
  onSelectionChange,
  onRecipientTypeChange 
}: RecipientSelectorProps) {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'admins' | 'users'>('all');

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, profiles, filterType]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name')
        .not('email', 'is', null)
        .order('email');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    let filtered = [...profiles];

    // Apply role filter
    if (filterType !== 'all') {
      try {
        const role = filterType === 'admins' ? 'admin' : 'user';
        const { data: roleUsers } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', role);

        const roleUserIds = new Set(roleUsers?.map(r => r.user_id) || []);
        filtered = filtered.filter(p => roleUserIds.has(p.user_id));
      } catch (error) {
        console.error('Error filtering by role:', error);
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.email?.toLowerCase().includes(query) ||
        p.first_name?.toLowerCase().includes(query) ||
        p.last_name?.toLowerCase().includes(query)
      );
    }

    setFilteredProfiles(filtered);
  };

  const handleToggleUser = (userId: string) => {
    const newSelection = selectedIds.includes(userId)
      ? selectedIds.filter(id => id !== userId)
      : [...selectedIds, userId];
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(filteredProfiles.map(p => p.user_id));
  };

  const handleClearSelection = () => {
    onSelectionChange([]);
  };

  const handleQuickSelect = (type: 'all' | 'admins' | 'users') => {
    setFilterType(type);
    if (type === 'all') {
      onRecipientTypeChange('all');
    } else if (type === 'admins') {
      onRecipientTypeChange('by_role', 'admin');
    } else {
      onRecipientTypeChange('by_role', 'user');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickSelect('all')}
        >
          <Users className="h-4 w-4 mr-2" />
          All Users
        </Button>
        <Button
          variant={filterType === 'admins' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickSelect('admins')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Admins Only
        </Button>
        <Button
          variant={filterType === 'users' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickSelect('users')}
        >
          <User className="h-4 w-4 mr-2" />
          Regular Users
        </Button>
      </div>

      {/* Selection Controls */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {selectedIds.length} of {filteredProfiles.length} selected
        </Badge>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClearSelection}>
            Clear
          </Button>
        </div>
      </div>

      {/* User List */}
      <ScrollArea className="h-[400px] rounded-md border p-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading users...
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProfiles.map((profile) => {
              const isSelected = selectedIds.includes(profile.user_id);
              const displayName = profile.first_name && profile.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile.email;

              return (
                <div
                  key={profile.user_id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleToggleUser(profile.user_id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleUser(profile.user_id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{displayName}</div>
                    {profile.first_name && profile.last_name && (
                      <div className="text-sm text-muted-foreground">{profile.email}</div>
                    )}
                  </div>
                  {isSelected && (
                    <UserCheck className="h-4 w-4 text-primary" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}