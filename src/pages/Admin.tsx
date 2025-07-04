
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import MatrixRain from '@/components/MatrixRain';
import { Plus, Edit, Trash2, Users, Calendar, BookOpen, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [blogs, setBlogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('blogs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (!isAdmin()) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      fetchData();
    }
  }, [user, authLoading, rolesLoading, isAdmin]);

  const fetchData = async () => {
    try {
      const [blogsRes, eventsRes, rolesRes] = await Promise.all([
        supabase.from('blogs').select('*').order('created_at', { ascending: false }),
        supabase.from('events').select('*').order('event_date', { ascending: false }),
        supabase.from('user_roles').select('*, user_id').order('created_at', { ascending: false })
      ]);

      if (blogsRes.error) throw blogsRes.error;
      if (eventsRes.error) throw eventsRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setBlogs(blogsRes.data || []);
      setEvents(eventsRes.data || []);
      setUsers(rolesRes.data || []);
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

  const deleteBlog = async (id: string) => {
    try {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (error) throw error;
      
      setBlogs(blogs.filter((blog: any) => blog.id !== id));
      toast({ title: "Blog deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      
      setEvents(events.filter((event: any) => event.id !== id));
      toast({ title: "Event deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (authLoading || rolesLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-brand-green text-xl">Loading...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'blogs', name: 'Blogs', icon: BookOpen, count: blogs.length },
    { id: 'events', name: 'Events', icon: Calendar, count: events.length },
    { id: 'users', name: 'Users', icon: Users, count: users.length }
  ];

  return (
    <div className="min-h-screen bg-brand-dark relative overflow-hidden">
      <MatrixRain />
      <Navigation />
      
      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="terminal-window mb-8">
            <div className="terminal-header">
              <div className="terminal-dots">
                <div className="terminal-dot dot-red"></div>
                <div className="terminal-dot dot-yellow"></div>
                <div className="terminal-dot dot-green"></div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-3">
                <Settings className="h-8 w-8 text-brand-red" />
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              </div>
              <p className="text-brand-green mt-2">Manage content and users</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-t-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-brand-red text-white'
                      : 'bg-brand-darker text-brand-green hover:bg-brand-red/20'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.name}</span>
                  <span className="bg-brand-green/20 text-brand-green px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-dots">
                <div className="terminal-dot dot-red"></div>
                <div className="terminal-dot dot-yellow"></div>
                <div className="terminal-dot dot-green"></div>
              </div>
            </div>
            
            <div className="p-6">
              {/* Blogs Tab */}
              {activeTab === 'blogs' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Blog Posts</h2>
                    <button className="bg-brand-red hover:bg-brand-accent-red text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                      <Plus size={16} />
                      <span>New Post</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {blogs.map((blog: any) => (
                      <div key={blog.id} className="bg-brand-darker p-4 rounded-lg border border-brand-green/20">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{blog.title}</h3>
                            <p className="text-brand-green/80 text-sm mt-1">{blog.excerpt}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-brand-green/60">
                              <span>By {blog.author_name}</span>
                              <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                              <span className={`px-2 py-1 rounded ${blog.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {blog.published ? 'Published' : 'Draft'}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="text-brand-green hover:text-brand-red p-2">
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => deleteBlog(blog.id)}
                              className="text-brand-green hover:text-brand-red p-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Events</h2>
                    <button className="bg-brand-red hover:bg-brand-accent-red text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                      <Plus size={16} />
                      <span>New Event</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {events.map((event: any) => (
                      <div key={event.id} className="bg-brand-darker p-4 rounded-lg border border-brand-green/20">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{event.title}</h3>
                            <p className="text-brand-green/80 text-sm mt-1">{event.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-brand-green/60">
                              <span>{new Date(event.event_date).toLocaleDateString()}</span>
                              <span>{event.event_time}</span>
                              <span>{event.location}</span>
                              <span className={`px-2 py-1 rounded ${
                                event.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                                event.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {event.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="text-brand-green hover:text-brand-red p-2">
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => deleteEvent(event.id)}
                              className="text-brand-green hover:text-brand-red p-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">User Roles</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {users.map((userRole: any) => (
                      <div key={userRole.id} className="bg-brand-darker p-4 rounded-lg border border-brand-green/20">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">User ID: {userRole.user_id}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded text-xs ${
                                userRole.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                userRole.role === 'moderator' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {userRole.role}
                              </span>
                              <span className="text-brand-green/60 text-xs">
                                Since {new Date(userRole.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
