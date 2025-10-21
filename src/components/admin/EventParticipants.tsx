import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, UserCheck, Mail, Phone, Calendar } from 'lucide-react';

interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  checked_in: boolean;
  check_in_time?: string;
  notes?: string;
  confirmation_sent: boolean;
  user_email: string;
  user_phone: string;
  user_name: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
}

interface EventParticipantsProps {
  eventId: string;
}

export function EventParticipants({ eventId }: EventParticipantsProps) {
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchEventAndParticipants();
  }, [eventId]);

  const fetchEventAndParticipants = async () => {
    setLoading(true);
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, event_date, event_time, location')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Use edge function to fetch participants with auth.users data
      const { data, error } = await supabase.functions.invoke('get-event-participants', {
        body: { eventId }
      });

      if (error) throw error;

      setParticipants(data.participants || []);
    } catch (error: any) {
      console.error('Error fetching participants:', error);
      toast({
        title: "Error",
        description: "Failed to load event participants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (participantId: string, checked_in: boolean) => {
    try {
      const updateData = checked_in 
        ? { checked_in: true, check_in_time: new Date().toISOString() }
        : { checked_in: false, check_in_time: null };

      const { error } = await supabase
        .from('event_participants')
        .update(updateData)
        .eq('id', participantId);

      if (error) throw error;

      await fetchEventAndParticipants();
      toast({
        title: "Success",
        description: `Participant ${checked_in ? 'checked in' : 'check-in removed'}`,
      });
    } catch (error: any) {
      console.error('Error updating check-in:', error);
      toast({
        title: "Error",
        description: "Failed to update check-in status",
        variant: "destructive",
      });
    }
  };

  const exportParticipants = () => {
    const csvContent = [
      'Name,Email,Phone,Registration Date,Checked In,Check-in Time,Confirmation Sent',
      ...filteredParticipants.map(p => 
        `"${p.user_name}","${p.user_email}","${p.user_phone}","${new Date(p.registered_at).toLocaleDateString()}","${p.checked_in ? 'Yes' : 'No'}","${p.check_in_time ? new Date(p.check_in_time).toLocaleString() : 'N/A'}","${p.confirmation_sent ? 'Yes' : 'No'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title || 'event'}-participants.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSendEmails = async (selected: boolean = false) => {
    setSendingEmails(true);
    try {
      const participantIds = selected ? selectedParticipants : undefined;

      const { data, error } = await supabase.functions.invoke('send-event-confirmation', {
        body: {
          eventId,
          participantIds,
          emailType: 'registration'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || 'Confirmation emails sent successfully!',
      });
      
      setSelectedParticipants([]);
      await fetchEventAndParticipants();
    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to send confirmation emails',
        variant: "destructive",
      });
    } finally {
      setSendingEmails(false);
    }
  };

  const toggleSelectParticipant = (participantId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(participantId)
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedParticipants.length === filteredParticipants.length) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(filteredParticipants.map(p => p.id));
    }
  };

  const filteredParticipants = participants.filter(participant => {
    const search = searchTerm.toLowerCase();
    return participant.user_name.toLowerCase().includes(search) || 
           participant.user_email.toLowerCase().includes(search) || 
           participant.user_phone.toLowerCase().includes(search);
  });

  if (loading) {
    return <div className="flex justify-center p-8">Loading participants...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {event?.title}
          </CardTitle>
          <CardDescription>
            {event?.event_date} at {event?.event_time} | {event?.location}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-muted-foreground">
              <span>Total: {participants.length}</span>
              <span>Checked In: {participants.filter(p => p.checked_in).length}</span>
              <span>Confirmations Sent: {participants.filter(p => p.confirmation_sent).length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedParticipants.length > 0 && (
                <Button 
                  onClick={() => handleSendEmails(true)} 
                  disabled={sendingEmails}
                  size="sm"
                  className="touch-target"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Send to Selected ({selectedParticipants.length})</span>
                  <span className="sm:hidden">Selected ({selectedParticipants.length})</span>
                </Button>
              )}
              <Button 
                onClick={() => handleSendEmails(false)} 
                disabled={sendingEmails || participants.length === 0}
                variant="outline"
                size="sm"
                className="touch-target"
              >
                <Mail className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Send to All</span>
                <span className="sm:hidden">All</span>
              </Button>
              <Button onClick={exportParticipants} variant="outline" size="sm" className="touch-target">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export </span>CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 touch-target"
          />
        </div>
      </div>

      {/* Participants Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto scrollable-content">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.length === filteredParticipants.length && filteredParticipants.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="min-w-[150px]">Name</TableHead>
                  <TableHead className="min-w-[200px]">Email</TableHead>
                  <TableHead className="min-w-[120px] hidden sm:table-cell">Phone</TableHead>
                  <TableHead className="min-w-[120px] hidden md:table-cell">Registration</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(participant.id)}
                        onChange={() => toggleSelectParticipant(participant.id)}
                        className="rounded cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="break-words">{participant.user_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="break-all text-sm">{participant.user_email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{participant.user_phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">
                        {new Date(participant.registered_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={participant.checked_in ? "default" : "secondary"} className="text-xs">
                          {participant.checked_in ? 'Checked In' : 'Registered'}
                        </Badge>
                        {participant.checked_in && participant.check_in_time && (
                          <div className="text-xs text-muted-foreground">
                            {new Date(participant.check_in_time).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleCheckIn(participant.id, !participant.checked_in)}
                        variant={participant.checked_in ? "outline" : "default"}
                        size="sm"
                        className="touch-target text-xs sm:text-sm"
                      >
                        <UserCheck className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {participant.checked_in ? 'Undo' : 'Check In'}
                        </span>
                        <span className="sm:hidden">
                          {participant.checked_in ? 'Undo' : 'In'}
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredParticipants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                      {searchTerm ? 'No participants found matching your search.' : 'No participants registered yet.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
