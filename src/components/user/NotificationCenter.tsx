
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const NotificationCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Use raw SQL query since notifications table might not be in types yet
      const { data, error } = await supabase.rpc('get_user_notifications', {
        user_uuid: user.id
      });

      if (error) {
        // Fallback to direct table access if RPC doesn't exist
        const { data: directData, error: directError } = await supabase
          .from('notifications' as any)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (directError) throw directError;
        setNotifications(directData || []);
      } else {
        setNotifications(data || []);
      }
    } catch (error: any) {
      console.log('Notification fetch error:', error);
      // Set empty array if table doesn't exist yet
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications' as any)
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
      
      toast({
        title: "Success",
        description: "Notification deleted"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications' as any)
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );

      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getNotificationBorder = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      default:
        return 'border-l-blue-500';
    }
  };

  if (loading) {
    return <div className="text-brand-green">Loading notifications...</div>;
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-dots">
          <div className="terminal-dot dot-red"></div>
          <div className="terminal-dot dot-yellow"></div>
          <div className="terminal-dot dot-green"></div>
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Bell className="h-6 w-6 text-brand-red" />
            <h2 className="text-xl font-bold text-white">Notifications</h2>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-brand-red text-white text-xs px-2 py-1 rounded-full">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          {notifications.some(n => !n.read) && (
            <Button
              onClick={markAllAsRead}
              size="sm"
              variant="outline"
              className="border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-dark"
            >
              Mark All Read
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-brand-green/40 mx-auto mb-4" />
              <p className="text-brand-green/80 text-lg">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-l-4 ${getNotificationBorder(notification.type)} ${
                  notification.read
                    ? 'bg-brand-darker/50 border-brand-green/10'
                    : 'bg-brand-darker border-brand-green/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <h4 className={`font-medium ${notification.read ? 'text-brand-green/60' : 'text-white'}`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 ${notification.read ? 'text-brand-green/40' : 'text-brand-green/80'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-brand-green/40 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!notification.read && (
                      <Button
                        onClick={() => markAsRead(notification.id)}
                        size="sm"
                        variant="ghost"
                        className="text-brand-green hover:text-brand-red"
                      >
                        <Check size={14} />
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteNotification(notification.id)}
                      size="sm"
                      variant="ghost"
                      className="text-brand-green hover:text-brand-red"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
