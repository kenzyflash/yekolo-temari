import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Search, User, Clock, MessageSquare, Filter } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string | null;
  interests: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

const ContactMessageManagement = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm, statusFilter]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    if (searchTerm) {
      filtered = filtered.filter(msg =>
        msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (msg.message && msg.message.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    setFilteredMessages(filtered);
  };

  const updateMessageStatus = async (messageId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, status: newStatus } : msg
        )
      );

      toast({
        title: "Success",
        description: `Message marked as ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-primary text-primary-foreground';
      case 'read': return 'bg-accent text-accent-foreground';
      case 'responded': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return <div className="text-brand-green">Loading messages...</div>;
  }

  return (
    <div>
      <div className="flex items-center space-x-2 mb-6">
        <Mail className="h-6 w-6 text-brand-red" />
        <h2 className="text-xl font-bold text-white">Contact Messages</h2>
        <Badge className="bg-brand-red text-white">
          {messages.filter(m => m.status === 'new').length} new
        </Badge>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-green h-5 w-5" />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-brand-darker border-brand-green/20 text-white"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-brand-darker border-brand-green/20 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-brand-darker border-brand-green/20">
            <SelectItem value="all" className="text-white">All Messages</SelectItem>
            <SelectItem value="new" className="text-white">New</SelectItem>
            <SelectItem value="read" className="text-white">Read</SelectItem>
            <SelectItem value="responded" className="text-white">Responded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-brand-green/40 mx-auto mb-4" />
            <p className="text-brand-green/80 text-lg">No messages found</p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div key={message.id} className="bg-brand-darker p-6 rounded-lg border border-brand-green/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-brand-red/20 rounded-full">
                    <User className="h-5 w-5 text-brand-red" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{message.name}</h3>
                    <p className="text-brand-green/60 text-sm">{message.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={`${getStatusColor(message.status)} text-white`}>
                    {message.status}
                  </Badge>
                  <div className="flex items-center text-brand-green/60 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(message.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Interests */}
              {message.interests.length > 0 && (
                <div className="mb-4">
                  <p className="text-brand-green/80 text-sm mb-2">Interests:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.interests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="border-brand-green/30 text-brand-green">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Message */}
              {message.message && (
                <div className="mb-4 p-3 bg-brand-dark rounded border border-brand-green/10">
                  <p className="text-brand-green/80 text-sm whitespace-pre-wrap">{message.message}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                {message.status === 'new' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMessageStatus(message.id, 'read')}
                    className="border-brand-green/20 text-brand-green hover:bg-brand-green hover:text-brand-dark"
                  >
                    Mark as Read
                  </Button>
                )}
                {message.status !== 'responded' && (
                  <Button
                    size="sm"
                    onClick={() => updateMessageStatus(message.id, 'responded')}
                    className="bg-brand-red hover:bg-brand-red/80 text-white"
                  >
                    Mark as Responded
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactMessageManagement;