import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  profiles: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    bio?: string;
  } | null;
  user_email?: string;
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

      // Fetch participants first
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .select('id, event_id, user_id, registered_at, checked_in, check_in_time, notes')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (participantsError) throw participantsError;

      // Then fetch profile data for each participant
      const participantsWithProfiles = await Promise.all(
        (participantsData || []).map(async (participant) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, phone, bio')
            .eq('user_id', participant.user_id)
            .maybeSingle();

          return {
            ...participant,
            profiles: profileData,
            user_email: 'user@example.com' // Placeholder for now
          };
        })
      );

      setParticipants(participantsWithProfiles);
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
      'Name,Email,Phone,Registration Date,Checked In,Check-in Time',
      ...filteredParticipants.map(p => 
        `"${getParticipantName(p)}","${p.user_email}","${p.profiles?.phone || 'N/A'}","${new Date(p.registered_at).toLocaleDateString()}","${p.checked_in ? 'Yes' : 'No'}","${p.check_in_time ? new Date(p.check_in_time).toLocaleString() : 'N/A'}"`
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

  const getParticipantName = (participant: EventParticipant) => {
    const { first_name, last_name } = participant.profiles || {};
    if (first_name && last_name) {
      return `${first_name} ${last_name}`;
    }
    return first_name || last_name || 'Anonymous User';
  };

  const filteredParticipants = participants.filter(participant => {
    const name = getParticipantName(participant).toLowerCase();
    const email = participant.user_email?.toLowerCase() || '';
    const phone = participant.profiles?.phone?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || 
           email.includes(searchTerm.toLowerCase()) || 
           phone.includes(searchTerm.toLowerCase());
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
            </div>
            <div className="flex gap-2">
              <Button onClick={exportParticipants} variant="outline" size="sm" className="touch-target">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export </span>CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search participants..."
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
                    <TableCell className="font-medium">
                      <div className="break-words">
                        {getParticipantName(participant)}
                      </div>
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
                        <span className="text-sm">{participant.profiles?.phone || 'N/A'}</span>
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
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
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