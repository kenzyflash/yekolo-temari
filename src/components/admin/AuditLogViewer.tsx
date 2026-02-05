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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, UserX, UserCheck, AlertTriangle, RefreshCw, Search, Filter, CalendarIcon, Radio, AlertCircle, Info, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type SecurityEvent = Tables<'security_events'>;
type AuditLog = Tables<'audit_logs'>;

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

const ITEMS_PER_PAGE = 15;

// Severity configuration for events
const getSeverity = (eventType: string): Severity => {
  const criticalEvents = ['failed_login', 'unauthorized_access', 'rate_limit_exceeded', 'suspicious_activity', 'account_locked'];
  const highEvents = ['role_change', 'password_reset', 'permission_denied', 'admin_action'];
  const mediumEvents = ['profile_update', 'settings_change', 'data_export', 'password_change'];
  const lowEvents = ['login_success', 'logout', 'session_refresh', 'email_verified'];
  
  if (criticalEvents.includes(eventType)) return 'critical';
  if (highEvents.includes(eventType)) return 'high';
  if (mediumEvents.includes(eventType)) return 'medium';
  if (lowEvents.includes(eventType)) return 'low';
  return 'info';
};

const severityConfig: Record<Severity, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  critical: { 
    label: 'Critical', 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/10',
    borderColor: 'border-l-destructive',
    icon: AlertCircle 
  },
  high: { 
    label: 'High', 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-l-orange-500',
    icon: AlertTriangle 
  },
  medium: { 
    label: 'Medium', 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-l-yellow-500',
    icon: Shield 
  },
  low: { 
    label: 'Low', 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-l-blue-500',
    icon: Info 
  },
  info: { 
    label: 'Info', 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted/50',
    borderColor: 'border-l-muted-foreground',
    icon: Info 
  },
};

const AuditLogViewer = () => {
  const { toast } = useToast();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'security' | 'audit'>('security');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isLive, setIsLive] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, eventTypeFilter, severityFilter, dateRange, activeView]);

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
          const newEvent = payload.new as SecurityEvent;
          const severity = getSeverity(newEvent.event_type);
          setSecurityEvents(prev => [newEvent, ...prev]);
          
          // Show toast with severity-appropriate styling
          if (severity === 'critical' || severity === 'high') {
            toast({
              title: `⚠️ ${severityConfig[severity].label} Security Event`,
              description: `${newEvent.event_type.replace(/_/g, ' ')} - ${newEvent.user_email || 'Unknown user'}`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'New Security Event',
              description: `${newEvent.event_type.replace(/_/g, ' ')}`,
            });
          }
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
          .limit(500),
        supabase
          .from('audit_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(500)
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

  const applyQuickDateFilter = (days: number) => {
    const to = new Date();
    const from = subDays(to, days);
    setDateRange({ from, to });
  };

  const clearDateFilter = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const exportToCsv = () => {
    let csvContent: string;
    let filename: string;
    
    if (activeView === 'security') {
      const headers = ['ID', 'Event Type', 'Severity', 'User Email', 'IP Address', 'Details', 'Created At'];
      const rows = filteredSecurityEvents.map(event => [
        event.id,
        event.event_type,
        getSeverity(event.event_type),
        event.user_email || '',
        event.ip_address || '',
        JSON.stringify(event.details || {}),
        event.created_at
      ]);
      csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      filename = `security_events_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else {
      const headers = ['ID', 'Action', 'Actor Email', 'Target Email', 'Old Role', 'New Role', 'Timestamp'];
      const rows = filteredAuditLogs.map(log => [
        log.id,
        log.action,
        log.actor_user_email,
        log.target_user_email,
        log.old_role || '',
        log.new_role || '',
        log.timestamp
      ]);
      csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      filename = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Success',
      description: `Exported ${activeView === 'security' ? filteredSecurityEvents.length : filteredAuditLogs.length} records to ${filename}`
    });
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
    const matchesSeverity = severityFilter === 'all' || getSeverity(event.event_type) === severityFilter;
    const matchesDate = isWithinDateRange(event.created_at);
    
    return matchesSearch && matchesFilter && matchesSeverity && matchesDate;
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === '' ||
      log.actor_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = isWithinDateRange(log.timestamp);
    
    return matchesSearch && matchesDate;
  });

  // Pagination logic
  const currentItems = activeView === 'security' ? filteredSecurityEvents : filteredAuditLogs;
  const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);
  const paginatedItems = currentItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => setCurrentPage(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Severity counts for stats
  const severityCounts = {
    critical: filteredSecurityEvents.filter(e => getSeverity(e.event_type) === 'critical').length,
    high: filteredSecurityEvents.filter(e => getSeverity(e.event_type) === 'high').length,
    medium: filteredSecurityEvents.filter(e => getSeverity(e.event_type) === 'medium').length,
    low: filteredSecurityEvents.filter(e => getSeverity(e.event_type) === 'low').length,
    info: filteredSecurityEvents.filter(e => getSeverity(e.event_type) === 'info').length,
  };

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
          <Button onClick={exportToCsv} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
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

      {/* Severity Stats Bar */}
      {activeView === 'security' && (
        <div className="flex flex-wrap gap-2">
          {(Object.entries(severityCounts) as [Severity, number][]).map(([severity, count]) => {
            const config = severityConfig[severity];
            return (
              <button
                key={severity}
                onClick={() => setSeverityFilter(severityFilter === severity ? 'all' : severity)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  config.bgColor,
                  config.color,
                  severityFilter === severity && "ring-2 ring-offset-2 ring-offset-background",
                  severityFilter === severity && severity === 'critical' && "ring-destructive",
                  severityFilter === severity && severity === 'high' && "ring-orange-500",
                  severityFilter === severity && severity === 'medium' && "ring-yellow-500",
                  severityFilter === severity && severity === 'low' && "ring-blue-500",
                  severityFilter === severity && severity === 'info' && "ring-muted-foreground"
                )}
              >
                <config.icon className="h-3.5 w-3.5" />
                {config.label}: {count}
              </button>
            );
          })}
        </div>
      )}

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
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No security events found
                  </TableCell>
                </TableRow>
              ) : (
                (paginatedItems as SecurityEvent[]).map((event) => {
                  const severity = getSeverity(event.event_type);
                  const config = severityConfig[severity];
                  const Icon = config.icon;
                  const isExpanded = expandedRows.has(event.id);
                  const hasDetails = event.details && Object.keys(event.details as object).length > 0;
                  
                  return (
                    <Collapsible key={event.id} open={isExpanded} onOpenChange={() => hasDetails && toggleRowExpansion(event.id)} asChild>
                      <>
                        <CollapsibleTrigger asChild disabled={!hasDetails}>
                          <TableRow 
                            className={cn(
                              "border-l-4 transition-colors",
                              config.borderColor,
                              severity === 'critical' && "bg-destructive/5",
                              hasDetails && "cursor-pointer hover:bg-muted/50"
                            )}
                          >
                            <TableCell className="w-[40px]">
                              {hasDetails && (
                                isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(config.bgColor, config.color, "gap-1")}>
                                <Icon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {event.event_type.replace(/_/g, ' ')}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {event.user_email || 'Unknown'}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {event.ip_address || 'N/A'}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {format(new Date(event.created_at), 'MMM d, yyyy HH:mm')}
                            </TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <TableRow className={cn("border-l-4", config.borderColor, "bg-muted/30")}>
                            <TableCell colSpan={6} className="py-4">
                              <div className="space-y-3 px-4">
                                <h4 className="text-sm font-semibold text-foreground">Event Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Event ID</span>
                                    <p className="font-mono text-sm">{event.id}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase">User ID</span>
                                    <p className="font-mono text-sm">{event.user_id || 'N/A'}</p>
                                  </div>
                                </div>
                                {event.details && (
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Full Details</span>
                                    <pre className="mt-1 p-3 bg-background rounded-md text-sm overflow-x-auto border border-border">
                                      {JSON.stringify(event.details, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  );
                })
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
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Role Change</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                (paginatedItems as AuditLog[]).map((log) => {
                  const isExpanded = expandedRows.has(log.id);
                  const hasAdditionalData = log.additional_data && Object.keys(log.additional_data as object).length > 0;
                  
                  return (
                    <Collapsible key={log.id} open={isExpanded} onOpenChange={() => toggleRowExpansion(log.id)} asChild>
                      <>
                        <CollapsibleTrigger asChild>
                          <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <TableCell className="w-[40px]">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
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
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={6} className="py-4">
                              <div className="space-y-3 px-4">
                                <h4 className="text-sm font-semibold text-foreground">Log Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Log ID</span>
                                    <p className="font-mono text-sm">{log.id}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Actor User ID</span>
                                    <p className="font-mono text-sm">{log.actor_user_id}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Target User ID</span>
                                    <p className="font-mono text-sm">{log.target_user_id}</p>
                                  </div>
                                </div>
                                {hasAdditionalData && (
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Additional Data</span>
                                    <pre className="mt-1 p-3 bg-background rounded-md text-sm overflow-x-auto border border-border">
                                      {JSON.stringify(log.additional_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, currentItems.length)} of{' '}
            {currentItems.length} {activeView === 'security' ? 'events' : 'logs'}
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={cn(
                    "cursor-pointer",
                    currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={cn(
                    "cursor-pointer",
                    currentPage === totalPages && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">{filteredSecurityEvents.length}</div>
          <div className="text-sm text-muted-foreground">Total Security Events</div>
        </div>
        <div className={cn("border rounded-lg p-4", severityConfig.critical.bgColor, "border-destructive/30")}>
          <div className={cn("text-2xl font-bold", severityConfig.critical.color)}>
            {severityCounts.critical}
          </div>
          <div className="text-sm text-muted-foreground">Critical Events</div>
        </div>
        <div className={cn("border rounded-lg p-4", severityConfig.high.bgColor, "border-orange-500/30")}>
          <div className={cn("text-2xl font-bold", severityConfig.high.color)}>
            {severityCounts.high}
          </div>
          <div className="text-sm text-muted-foreground">High Severity</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-brand-green">{filteredAuditLogs.length}</div>
          <div className="text-sm text-muted-foreground">Role Changes</div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
