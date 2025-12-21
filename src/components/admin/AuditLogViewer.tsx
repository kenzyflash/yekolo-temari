import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, UserX, UserCheck, AlertTriangle, RefreshCw, Search, Filter, CalendarIcon, Radio } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type SecurityEvent = Tables<'security_events'>;
type AuditLog = Tables<'audit_logs'>;

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

const AuditLogViewer = () => {
  const { toast } = useToast();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'security' | 'audit'>('security');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!isLive) return;

    const securityChannel = supabase
      .channel('security-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events'
        },
        (payload) => {
          console.log('New security event:', payload);
          setSecurityEvents(prev => [payload.new as SecurityEvent, ...prev]);
          toast({
            title: 'New Security Event',
            description: `${(payload.new as SecurityEvent).event_type.replace(/_/g, ' ')}`,
          });
        }
      )
      .subscribe();

    const auditChannel = supabase
      .channel('audit-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          console.log('New audit log:', payload);
          setAuditLogs(prev => [payload.new as AuditLog, ...prev]);
          toast({
            title: 'New Audit Log',
            description: `${(payload.new as AuditLog).action}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(securityChannel);
      supabase.removeChannel(auditChannel);
    };
  }, [isLive, toast]);

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

  const applyQuickDateFilter = (days: number) => {
    const to = new Date();
    const from = subDays(to, days);
    setDateRange({ from, to });
  };

  const clearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const isWithinDateRange = (dateStr: string) => {
    if (!dateRange.from && !dateRange.to) return true;
    const date = new Date(dateStr);
    const start = dateRange.from ? startOfDay(dateRange.from) : new Date(0);
    const end = dateRange.to ? endOfDay(dateRange.to) : new Date();
    return isWithinInterval(date, { start, end });
  };

  const uniqueEventTypes = [...new Set(securityEvents.map(e => e.event_type))];

  const filteredSecurityEvents = securityEvents.filter(event => {
    const matchesSearch = searchTerm === '' || 
      event.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ip_address?.includes(searchTerm);
    
    const matchesFilter = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;
    const matchesDate = isWithinDateRange(event.created_at);
    
    return matchesSearch && matchesFilter && matchesDate;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' ||
      log.actor_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = isWithinDateRange(log.timestamp);
    
    return matchesSearch && matchesDate;
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
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsLive(!isLive)}
            variant={isLive ? 'default' : 'outline'}
            size="sm"
            className={cn(isLive && 'bg-brand-green hover:bg-brand-green/90')}
          >
            <Radio className={cn("h-4 w-4 mr-2", isLive && "animate-pulse")} />
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex space-x-2">
        <Button
          variant={activeView === 'security' ? 'default' : 'outline'}
          onClick={() => setActiveView('security')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Security Events ({filteredSecurityEvents.length})
        </Button>
        <Button
          variant={activeView === 'audit' ? 'default' : 'outline'}
          onClick={() => setActiveView('audit')}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Role Changes ({filteredAuditLogs.length})
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
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn(dateRange.from && "border-brand-green")}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                {dateRange.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                  ) : (
                    format(dateRange.from, 'MMM d, yyyy')
                  )
                ) : (
                  'Date Range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => applyQuickDateFilter(1)}>Today</Button>
                  <Button variant="outline" size="sm" onClick={() => applyQuickDateFilter(7)}>7 Days</Button>
                  <Button variant="outline" size="sm" onClick={() => applyQuickDateFilter(30)}>30 Days</Button>
                </div>
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={1}
                />
                {dateRange.from && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={clearDateFilter}>
                    Clear Filter
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
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
          <div className="text-2xl font-bold text-foreground">{filteredSecurityEvents.length}</div>
          <div className="text-sm text-muted-foreground">Total Security Events</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-destructive">
            {filteredSecurityEvents.filter(e => e.event_type === 'failed_login').length}
          </div>
          <div className="text-sm text-muted-foreground">Failed Logins</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-brand-green">{filteredAuditLogs.length}</div>
          <div className="text-sm text-muted-foreground">Role Changes</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-500">
            {filteredSecurityEvents.filter(e => e.event_type === 'suspicious_activity').length}
          </div>
          <div className="text-sm text-muted-foreground">Suspicious Activity</div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
