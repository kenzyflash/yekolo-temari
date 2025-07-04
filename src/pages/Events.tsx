
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Users, Clock, ExternalLink } from 'lucide-react';
import Navigation from '@/components/Navigation';
import MatrixRain from '@/components/MatrixRain';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
}

const Events = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  const eventTypes = ['All', 'CTF', 'Workshop', 'Conference', 'Meetup'];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

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

  const filteredEvents = filter === 'All' 
    ? events 
    : events.filter(event => event.event_type === filter);

  const handleJoinTelegram = () => {
    window.open('https://t.me/yekolotemari', '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-brand-green text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden">
      <MatrixRain />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 glow-text">
              Upcoming <span className="text-brand-red">Events</span>
            </h1>
            <p className="text-xl text-brand-green max-w-2xl mx-auto mb-8">
              Join our cybersecurity events, workshops, and competitions to enhance your skills and network with fellow hackers.
            </p>
            
            <Button
              onClick={handleJoinTelegram}
              className="bg-brand-red hover:bg-brand-accent-red text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover-glow"
            >
              <ExternalLink size={20} className="mr-2" />
              Join Telegram Community
            </Button>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-4 mb-12 justify-center">
            {eventTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-6 py-3 rounded-lg border transition-all ${
                  filter === type
                    ? 'bg-brand-red text-white border-brand-red'
                    : 'bg-brand-darker text-brand-green border-brand-green/20 hover:border-brand-red hover:text-brand-red'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Events Grid */}
          <div className="grid gap-8 lg:gap-12">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-brand-green/80 text-lg">No events found for the selected filter.</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="terminal-window hover-glow transition-all duration-300">
                  <div className="terminal-header">
                    <div className="terminal-dots">
                      <div className="terminal-dot dot-red"></div>
                      <div className="terminal-dot dot-yellow"></div>
                      <div className="terminal-dot dot-green"></div>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h2 className="text-2xl lg:text-3xl font-bold text-white">
                            {event.title}
                          </h2>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            event.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                            event.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                        
                        <p className="text-brand-green/80 text-lg leading-relaxed mb-6">
                          {event.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="flex items-center space-x-3 text-brand-green/60">
                            <Calendar size={20} />
                            <span>{new Date(event.event_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-brand-green/60">
                            <Clock size={20} />
                            <span>{event.event_time}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-brand-green/60">
                            <MapPin size={20} />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-brand-green/60">
                            <Users size={20} />
                            <span>{event.participants} participants</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="px-4 py-2 bg-brand-red/20 text-brand-red rounded-lg">
                            {event.event_type}
                          </span>
                          {event.status === 'upcoming' && (
                            <Button
                              onClick={handleJoinTelegram}
                              className="bg-brand-green hover:bg-brand-green/80 text-brand-dark"
                            >
                              Join Event
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Events;
