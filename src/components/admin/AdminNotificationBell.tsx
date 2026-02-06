import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/hooks/useAuth';
import { Bell, User, Mail, X, Check, CheckCheck, Shield, AlertTriangle, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

const AdminNotificationBell = () => {
  const { user } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userIsAdmin = roles.includes('admin');

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        if (retryCount < 2) {
          setTimeout(() => fetchNotifications(retryCount + 1), 1000);
          return;
        }
        throw fetchError;
      }
      setNotifications((data as Notification[]) || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || rolesLoading) return;
    if (!userIsAdmin) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          const deletedId = payload.old.id;
          setNotifications(prev => prev.filter(n => n.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, rolesLoading, userIsAdmin, toast, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_user':
        return <User className="h-4 w-4 text-brand-green" />;
      case 'new_message':
        return <Mail className="h-4 w-4 text-brand-red" />;
      case 'role_change':
        return <Shield className="h-4 w-4 text-yellow-500" />;
      case 'failed_login':
        return <Lock className="h-4 w-4 text-brand-red" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-brand-green" />;
    }
  };

  // Don't render if not admin
  if (rolesLoading || !userIsAdmin) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-brand-green hover:text-white hover:bg-brand-red/20"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-brand-red text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-brand-darker border-brand-green/20" 
        align="end"
      >
        <div className="flex items-center justify-between p-3 border-b border-brand-green/20">
          <h4 className="font-semibold text-white">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-brand-green hover:text-white h-7"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {error ? (
            <div className="p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-brand-red/60 mx-auto mb-2" />
              <p className="text-brand-red/80 text-sm mb-3">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNotifications()}
                className="text-brand-green border-brand-green/30 hover:bg-brand-green/10"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          ) : loading ? (
            <div className="p-4 text-center text-brand-green/60">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-brand-green/40 mx-auto mb-2" />
              <p className="text-brand-green/60 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-green/10">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-brand-green/5 transition-colors ${
                    !notification.read ? 'bg-brand-green/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-brand-green/70 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-brand-green/50 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead(notification.id)}
                          className="h-6 w-6 text-brand-green/60 hover:text-brand-green"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-6 w-6 text-brand-red/60 hover:text-brand-red"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default AdminNotificationBell;
