import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, UserX, UserCheck, AlertTriangle, RefreshCw, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type SecurityEvent = Tables<'security_events'>;
type AuditLog = Tables<'audit_logs'>;

const AuditLogViewer = () => {
  const { toast } = useToast();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'security' | 'audit'>('security');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [securityRes, auditRes] = await Promise.all([
        supabase
          .from('security_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100)
      ]);

      if (securityRes.error) throw securityRes.error;
      if (auditRes.error) throw auditRes.error;

      setSecurityEvents(securityRes.data || []);
      setAuditLogs(auditRes.data || []);
    } catch (error: any) {
      console.error('Error fetching audit data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'failed_login':
        return <UserX className="h-4 w-4 text-destructive" />;
      case 'role_change':
        return <UserCheck className="h-4 w-4 text-brand-green" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case 'failed_login':
        return 'destructive';
      case 'role_change':
        return 'default';
      case 'suspicious_activity':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const uniqueEventTypes = [...new Set(securityEvents.map(e => e.event_type))];

  const filteredSecurityEvents = securityEvents.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ip_address?.includes(searchTerm);
    
    const matchesFilter = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    return searchTerm === '' ||
      log.actor_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mb-4"></div>
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Audit Log Viewer</h2>
          <p className="text-muted-foreground">Monitor security events and role changes</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-2">
        <Button
          variant={activeView === 'security' ? 'default' : 'outline'}
          onClick={() => setActiveView('security')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Security Events ({securityEvents.length})
        </Button>
        <Button
          variant={activeView === 'audit' ? 'default' : 'outline'}
          onClick={() => setActiveView('audit')}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Role Changes ({auditLogs.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, event type, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeView === 'security' && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {uniqueEventTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Security Events View */}
      {activeView === 'security' && (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Type</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSecurityEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No security events found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSecurityEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{getEventIcon(event.event_type)}</TableCell>
                    <TableCell>
                      <Badge variant={getEventBadgeVariant(event.event_type) as any}>
                        {event.event_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {event.user_email || 'Unknown'}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {event.ip_address || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {event.details && (
                        <span className="text-sm text-muted-foreground truncate block">
                          {JSON.stringify(event.details).slice(0, 50)}...
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {format(new Date(event.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Audit Logs View */}
      {activeView === 'audit' && (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Role Change</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAuditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.actor_user_email}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.target_user_email}
                    </TableCell>
                    <TableCell>
                      {log.old_role && log.new_role ? (
                        <span className="text-sm">
                          <Badge variant="secondary" className="mr-1">{log.old_role}</Badge>
                          →
                          <Badge variant="default" className="ml-1">{log.new_role}</Badge>
                        </span>
                      ) : log.new_role ? (
                        <Badge variant="default">{log.new_role}</Badge>
                      ) : log.old_role ? (
                        <span className="text-muted-foreground">Removed: {log.old_role}</span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{securityEvents.length}</div>
          <div className="text-sm text-muted-foreground">Total Security Events</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-destructive">
            {securityEvents.filter(e => e.event_type === 'failed_login').length}
          </div>
          <div className="text-sm text-muted-foreground">Failed Logins</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-brand-green">{auditLogs.length}</div>
          <div className="text-sm text-muted-foreground">Role Changes</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-500">
            {securityEvents.filter(e => e.event_type === 'suspicious_activity').length}
          </div>
          <div className="text-sm text-muted-foreground">Suspicious Activity</div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
