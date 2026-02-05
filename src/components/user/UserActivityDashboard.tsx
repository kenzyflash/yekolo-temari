import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Monitor, Smartphone, Globe, Clock, CheckCircle, XCircle, Shield, RefreshCw } from 'lucide-react';

interface LoginHistoryEntry {
  id: string;
  login_at: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: unknown;
  login_success: boolean;
  failure_reason: string | null;
}

interface SessionFingerprint {
  id: string;
  fingerprint_hash: string;
  user_agent: string | null;
  ip_address: string | null;
  device_info: unknown;
  created_at: string;
  last_seen: string;
  is_trusted: boolean;
}

const UserActivityDashboard = () => {
  const { user } = useAuth();
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);
  const [sessions, setSessions] = useState<SessionFingerprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserActivity();
    }
  }, [user]);

  const fetchUserActivity = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [historyRes, sessionsRes] = await Promise.all([
        supabase
          .from('user_login_history')
          .select('*')
          .eq('user_id', user.id)
          .order('login_at', { ascending: false })
          .limit(50),
        supabase
          .from('session_fingerprints')
          .select('*')
          .eq('user_id', user.id)
          .order('last_seen', { ascending: false })
      ]);

      if (historyRes.data) {
        setLoginHistory(historyRes.data);
      }
      if (sessionsRes.data) {
        setSessions(sessionsRes.data);
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe className="h-4 w-4" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getBrowserName = (userAgent: string | null): string => {
    if (!userAgent) return 'Unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'Unknown Browser';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand-red" />
          <h2 className="text-xl font-bold text-white">Security Activity</h2>
        </div>
        <Button onClick={fetchUserActivity} variant="outline" size="sm" className="border-brand-green/20 text-brand-green">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Active Sessions */}
      <Card className="bg-brand-darker border-brand-green/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Monitor className="h-5 w-5 text-brand-red" />
            Active Devices
          </CardTitle>
          <CardDescription>
            Devices that have been used to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-3 bg-brand-dark rounded-lg border border-brand-green/20"
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(session.user_agent)}
                    <div>
                      <p className="text-white font-medium">
                        {getBrowserName(session.user_agent)}
                      </p>
                      <p className="text-brand-green/60 text-sm">
                        IP: {session.ip_address || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={session.is_trusted ? 'default' : 'destructive'} className={session.is_trusted ? 'bg-brand-green/20 text-brand-green' : ''}>
                      {session.is_trusted ? 'Trusted' : 'Suspicious'}
                    </Badge>
                    <p className="text-brand-green/60 text-xs mt-1">
                      Last seen: {format(new Date(session.last_seen), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-green/60 text-center py-4">No active sessions recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card className="bg-brand-darker border-brand-green/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-red" />
            Login History
          </CardTitle>
          <CardDescription>
            Recent login attempts to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-brand-green/20">
                    <TableHead className="text-brand-green">Status</TableHead>
                    <TableHead className="text-brand-green">Date & Time</TableHead>
                    <TableHead className="text-brand-green">IP Address</TableHead>
                    <TableHead className="text-brand-green">Device</TableHead>
                    <TableHead className="text-brand-green">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((entry) => (
                    <TableRow key={entry.id} className="border-brand-green/20">
                      <TableCell>
                        {entry.login_success ? (
                          <div className="flex items-center gap-1 text-brand-green">
                            <CheckCircle className="h-4 w-4" />
                            <span>Success</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-brand-red">
                            <XCircle className="h-4 w-4" />
                            <span>Failed</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-white">
                        {format(new Date(entry.login_at), 'MMM d, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell className="text-brand-green/80 font-mono text-sm">
                        {entry.ip_address || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-brand-green/80">
                          {getDeviceIcon(entry.user_agent)}
                          <span>{getBrowserName(entry.user_agent)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-brand-green/60 text-sm">
                        {entry.failure_reason || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-brand-green/60 text-center py-4">No login history available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivityDashboard;
