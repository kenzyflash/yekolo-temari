
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Plus, X, Save, Users } from 'lucide-react';
import { EventParticipants } from './EventParticipants';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  event_type: string;
  participants: number;
  status: string;
  created_at: string;
}

const EventManagement = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    event_type: 'Meetup',
    participants: 0,
    status: 'upcoming'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.event_date || !formData.event_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast({ title: "Event updated successfully" });
      } else {
        const { error } = await supabase
          .from('events')
          .insert([formData]);

        if (error) throw error;
        toast({ title: "Event created successfully" });
      }

      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      event_time: '',
      location: '',
      event_type: 'Meetup',
      participants: 0,
      status: 'upcoming'
    });
    setEditingEvent(null);
    setShowForm(false);
  };

  const editEvent = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location,
      event_type: event.event_type,
      participants: event.participants,
      status: event.status
    });
    setShowForm(true);
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      await fetchEvents();
      toast({ title: "Event deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-brand-green">Loading events...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Event Management</h2>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-brand-red hover:bg-brand-accent-red"
        >
          <Plus size={16} className="mr-2" />
          New Event
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-brand-darker border border-brand-green/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollable-content">
            <div className="p-4 border-b border-brand-green/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h3>
                <Button
                  onClick={resetForm}
                  variant="ghost"
                  size="sm"
                  className="text-brand-green hover:text-brand-red touch-target"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-brand-green font-medium mb-2">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="bg-brand-dark border-brand-green/20 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-brand-green font-medium mb-2">Description *</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="bg-brand-dark border-brand-green/20 text-white"
                  rows={4}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-green font-medium mb-2">Date *</label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                    className="bg-brand-dark border-brand-green/20 text-white touch-target"
                    required
                  />
                </div>
                <div>
                  <label className="block text-brand-green font-medium mb-2">Time *</label>
                  <Input
                    value={formData.event_time}
                    onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                    placeholder="e.g., 10:00 AM - 12:00 PM"
                    className="bg-brand-dark border-brand-green/20 text-white touch-target"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-brand-green font-medium mb-2">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="bg-brand-dark border-brand-green/20 text-white"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-green font-medium mb-2">Type</label>
                  <Select value={formData.event_type} onValueChange={(value) => setFormData({...formData, event_type: value})}>
                    <SelectTrigger className="bg-brand-dark border-brand-green/20 text-white touch-target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CTF">CTF</SelectItem>
                      <SelectItem value="Workshop">Workshop</SelectItem>
                      <SelectItem value="Conference">Conference</SelectItem>
                      <SelectItem value="Meetup">Meetup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-brand-green font-medium mb-2">Status</label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger className="bg-brand-dark border-brand-green/20 text-white touch-target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Button type="submit" className="bg-brand-red hover:bg-brand-accent-red touch-target">
                  <Save size={16} className="mr-2" />
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
                <Button type="button" onClick={resetForm} variant="outline" className="touch-target">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="bg-brand-darker p-4 rounded-lg border border-brand-green/20">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium text-lg break-words">{event.title}</h3>
                <p className="text-brand-green/80 text-sm mt-1 break-words">{event.description}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs text-brand-green/60">
                  <span>{new Date(event.event_date).toLocaleDateString()}</span>
                  <span>{event.event_time}</span>
                  {event.location && <span className="break-words">{event.location}</span>}
                  <span className={`px-2 py-1 rounded self-start ${
                    event.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                    event.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 sm:flex-col lg:flex-row">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-brand-green hover:text-brand-red touch-target"
                    >
                      <Users size={14} />
                      <span className="ml-1 sm:hidden lg:inline">Participants</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-full sm:max-w-6xl max-h-[90vh] overflow-hidden bg-brand-darker border-brand-green/20 mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-white">Event Participants</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto scrollable-content">
                      <EventParticipants eventId={event.id} />
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  onClick={() => editEvent(event)}
                  size="sm"
                  variant="ghost"
                  className="text-brand-green hover:text-brand-red touch-target"
                >
                  <Edit size={14} />
                  <span className="ml-1 sm:hidden lg:inline">Edit</span>
                </Button>
                <Button
                  onClick={() => deleteEvent(event.id)}
                  size="sm"
                  variant="ghost"
                  className="text-brand-green hover:text-brand-red touch-target"
                >
                  <Trash2 size={14} />
                  <span className="ml-1 sm:hidden lg:inline">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventManagement;
