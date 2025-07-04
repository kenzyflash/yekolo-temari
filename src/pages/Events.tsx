
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '../components/Navigation';
import MatrixRain from '../components/MatrixRain';
import Footer from '../components/Footer';
import { Calendar, MapPin, Users, Clock, Trophy, Code, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'Competition': return Trophy;
      case 'Workshop': return Code;
      case 'Training': return Shield;
      default: return Users;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'Competition': return 'text-yellow-400';
      case 'Workshop': return 'text-blue-400';
      case 'Training': return 'text-brand-red';
      default: return 'text-brand-green';
    }
  };

  const isUpcoming = (eventDate: string) => {
    return new Date(eventDate) >= new Date();
  };

  const upcomingEvents = events.filter((event: any) => isUpcoming(event.event_date));
  const pastEvents = events.filter((event: any) => !isUpcoming(event.event_date));

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-brand-green text-xl">Loading events...</div>
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
            <div className="terminal-window max-w-4xl mx-auto p-8">
              <div className="terminal-header mb-6">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 glow-text">
                Community <span className="text-brand-red">Events</span>
              </h1>
              <p className="text-xl text-brand-green">
                Workshops, competitions, and meetups for the cybersecurity community
              </p>
            </div>
          </div>

          {/* Upcoming Events */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Upcoming <span className="text-brand-red">Events</span>
            </h2>
            {upcomingEvents.length === 0 ? (
              <div className="text-center">
                <div className="terminal-window max-w-md mx-auto p-8">
                  <div className="terminal-header mb-4">
                    <div className="terminal-dots">
                      <div className="terminal-dot dot-red"></div>
                      <div className="terminal-dot dot-yellow"></div>
                      <div className="terminal-dot dot-green"></div>
                    </div>
                  </div>
                  <p className="text-brand-green">No upcoming events scheduled</p>
                  <p className="text-brand-green/60 text-sm mt-2">Check back soon for new events!</p>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                {upcomingEvents.map((event: any) => {
                  const EventIcon = getEventIcon(event.event_type);
                  const eventColorClass = getEventColor(event.event_type);
                  return (
                    <div key={event.id} className="terminal-window hover-glow transition-all duration-300">
                      <div className="terminal-header">
                        <div className="terminal-dots">
                          <div className="terminal-dot dot-red"></div>
                          <div className="terminal-dot dot-yellow"></div>
                          <div className="terminal-dot dot-green"></div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`flex items-center space-x-2 ${eventColorClass}`}>
                            <EventIcon className="h-5 w-5" />
                            <span className="text-sm font-medium">{event.event_type}</span>
                          </div>
                          <span className="bg-brand-red text-white px-3 py-1 rounded-full text-xs font-bold">
                            UPCOMING
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-3">{event.title}</h3>
                        <p className="text-brand-green mb-4">{event.description}</p>

                        <div className="space-y-2 mb-6">
                          <div className="flex items-center space-x-2 text-brand-green/80">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(event.event_date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-brand-green/80">
                            <Clock className="h-4 w-4" />
                            <span>{event.event_time}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-brand-green/80">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-brand-green/80">
                            <Users className="h-4 w-4" />
                            <span>{event.participants} participants expected</span>
                          </div>
                        </div>

                        <button className="w-full bg-brand-red hover:bg-brand-accent-red text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover-glow">
                          Register Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Past <span className="text-brand-red">Events</span>
              </h2>
              <div className="grid lg:grid-cols-2 gap-8">
                {pastEvents.map((event: any) => {
                  const EventIcon = getEventIcon(event.event_type);
                  const eventColorClass = getEventColor(event.event_type);
                  return (
                    <div key={event.id} className="terminal-window opacity-75 hover:opacity-100 transition-all duration-300">
                      <div className="terminal-header">
                        <div className="terminal-dots">
                          <div className="terminal-dot dot-red"></div>
                          <div className="terminal-dot dot-yellow"></div>
                          <div className="terminal-dot dot-green"></div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`flex items-center space-x-2 ${eventColorClass}`}>
                            <EventIcon className="h-5 w-5" />
                            <span className="text-sm font-medium">{event.event_type}</span>
                          </div>
                          <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            COMPLETED
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-3">{event.title}</h3>
                        <p className="text-brand-green mb-4">{event.description}</p>

                        <div className="space-y-2 mb-6">
                          <div className="flex items-center space-x-2 text-brand-green/60">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(event.event_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-brand-green/60">
                            <Users className="h-4 w-4" />
                            <span>{event.participants} participants attended</span>
                          </div>
                        </div>

                        <button className="w-full border border-brand-green/30 text-brand-green hover:bg-brand-green hover:text-brand-dark font-bold py-3 px-4 rounded-lg transition-all duration-300">
                          View Recap
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="text-center mt-16">
            <div className="terminal-window max-w-2xl mx-auto p-8">
              <div className="terminal-header mb-6">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Stay <span className="text-brand-red">Updated</span>
              </h3>
              <p className="text-brand-green mb-6">
                Join our Telegram group to get notified about upcoming events and workshops.
              </p>
              <button className="bg-brand-red hover:bg-brand-accent-red text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 hover-glow">
                Join Telegram
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Events;
