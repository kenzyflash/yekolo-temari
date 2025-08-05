import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Clock, User } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  target_user_id: string;
  target_user_email: string;
  actor_user_id: string;
  actor_user_email: string;
  old_role?: string;
  new_role?: string;
  timestamp: string;
}

interface AuditLogProps {
  limit?: number;
}

const AuditLog = ({ limit = 50 }: AuditLogProps) => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-brand-green">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-6 w-6 text-brand-red" />
        <h3 className="text-xl font-bold text-white">Security Audit Log</h3>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-brand-green/40 mx-auto mb-4" />
          <p className="text-brand-green/80">No audit logs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="bg-brand-darker p-4 rounded-lg border border-brand-green/20">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-brand-red/20 rounded-full">
                    <User className="h-4 w-4 text-brand-red" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {log.action}
                    </p>
                    <p className="text-brand-green/60 text-sm">
                      Actor: {log.actor_user_email} → Target: {log.target_user_email}
                    </p>
                    {log.old_role && log.new_role && (
                      <p className="text-brand-green/60 text-sm">
                        Role changed from {log.old_role} to {log.new_role}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-brand-green/60 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditLog;