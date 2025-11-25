import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronDown,
  Mail,
  Clock,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EmailLog {
  id: string;
  subject: string;
  message: string;
  email_type: string;
  status: string;
  success_count: number;
  failure_count: number;
  recipient_emails: string[];
  error_details: any;
  created_at: string;
  sent_at: string | null;
}

export function EmailHistoryPanel() {
  const { toast } = useToast();
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching email logs:', error);
      toast({
        title: "Error",
        description: "Failed to load email history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      sent: 'default',
      failed: 'destructive',
      partial: 'secondary',
      pending: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      all: 'All Users',
      selected: 'Selected Users',
      by_role: 'Role-Based',
      individual: 'Individual',
      custom: 'Custom',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading email history...
      </div>
    );
  }

  if (emailLogs.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No emails sent yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3">
        {emailLogs.map((log) => (
          <Collapsible key={log.id}>
            <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <h4 className="font-semibold">{log.subject}</h4>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{log.recipient_emails.length} recipients</span>
                    </div>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(log.email_type)}
                    </Badge>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {log.sent_at 
                          ? formatDistanceToNow(new Date(log.sent_at), { addSuffix: true })
                          : 'Not sent'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    {getStatusBadge(log.status)}
                    <span className="text-green-600">
                      ✓ {log.success_count} sent
                    </span>
                    {log.failure_count > 0 && (
                      <span className="text-destructive">
                        ✗ {log.failure_count} failed
                      </span>
                    )}
                  </div>
                </div>

                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="mt-4 space-y-3">
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm font-medium mb-2">Message:</p>
                  <p className="text-sm whitespace-pre-wrap">{log.message}</p>
                </div>

                {log.error_details && log.error_details.length > 0 && (
                  <div className="bg-destructive/10 p-3 rounded-md">
                    <p className="text-sm font-medium mb-2 text-destructive">Errors:</p>
                    <ul className="text-sm space-y-1">
                      {log.error_details.map((err: any, idx: number) => (
                        <li key={idx} className="text-destructive/80">
                          {err.email}: {err.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    View all recipients ({log.recipient_emails.length})
                  </summary>
                  <div className="mt-2 p-3 bg-muted/50 rounded-md max-h-40 overflow-auto">
                    <ul className="space-y-1">
                      {log.recipient_emails.map((email, idx) => (
                        <li key={idx}>{email}</li>
                      ))}
                    </ul>
                  </div>
                </details>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </ScrollArea>
  );
}