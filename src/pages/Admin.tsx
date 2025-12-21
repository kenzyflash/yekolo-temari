import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import MatrixRain from '@/components/MatrixRain';
import BlogManagement from '@/components/admin/BlogManagement';
import EventManagement from '@/components/admin/EventManagement';
import ProjectManagement from '@/components/admin/ProjectManagement';
import UserManagement from '@/components/admin/UserManagement';
import ContactMessageManagement from '@/components/admin/ContactMessageManagement';
import EmailManagement from '@/components/admin/EmailManagement';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import { Settings, BookOpen, Calendar, FolderOpen, Users, Shield, Mail, Send, BarChart3, FileText } from 'lucide-react';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roles, loading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState({
    blogs: 0,
    events: 0,
    projects: 0,
    users: 0,
    messages: 0,
    emails: 0
  });

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (!isAdmin()) {
        return;
      }
      fetchStats();
    }
  }, [user, authLoading, rolesLoading, isAdmin, navigate]);

  const fetchStats = async () => {
    try {
      const [blogsRes, eventsRes, projectsRes, usersRes, messagesRes, emailsRes] = await Promise.all([
        supabase.from('blogs').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
        supabase.from('email_logs').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        blogs: blogsRes.count || 0,
        events: eventsRes.count || 0,
        projects: projectsRes.count || 0,
        users: usersRes.count || 0,
        messages: messagesRes.count || 0,
        emails: emailsRes.count || 0
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    }
  };

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mb-4"></div>
          <div className="text-brand-green text-xl">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    navigate('/auth');
    return null;
  }

  // Show access denied if not admin (removed the test admin access button)
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-brand-dark relative overflow-hidden">
        <MatrixRain />
        <Navigation />
        
        <div className="relative z-10 pt-24 pb-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <div className="p-8">
                <Shield className="h-16 w-16 text-brand-red mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
                <p className="text-brand-green mb-6">
                  You don't have permission to access the admin panel. 
                  Your current roles: {roles.length ? roles.join(', ') : 'user'}
                </p>
                <Button onClick={() => navigate('/')} className="bg-brand-red hover:bg-brand-accent-red">
                  Return Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'analytics', name: 'Analytics', icon: BarChart3, count: null },
    { id: 'blogs', name: 'Blogs', icon: BookOpen, count: stats.blogs },
    { id: 'events', name: 'Events', icon: Calendar, count: stats.events },
    { id: 'projects', name: 'Projects', icon: FolderOpen, count: stats.projects },
    { id: 'users', name: 'Users', icon: Users, count: stats.users },
    { id: 'messages', name: 'Messages', icon: Mail, count: stats.messages },
    { id: 'email', name: 'Email', icon: Send, count: stats.emails },
    { id: 'audit', name: 'Audit Logs', icon: FileText, count: null }
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Settings className="h-8 w-8 text-brand-red" />
                  <div>
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-brand-green mt-1">Manage your platform content and users</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-brand-green/60 text-sm">Welcome back, {user?.email}</p>
                  <p className="text-brand-green/60 text-sm">Role: {roles.join(', ') || 'user'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <div key={tab.id} className="terminal-window hover-glow transition-all duration-300">
                  <div className="terminal-header">
                    <div className="terminal-dots">
                      <div className="terminal-dot dot-red"></div>
                      <div className="terminal-dot dot-yellow"></div>
                      <div className="terminal-dot dot-green"></div>
                    </div>
                  </div>
                  <div className="p-6 text-center">
                    <Icon className="h-8 w-8 text-brand-red mx-auto mb-3" />
                    <div className="text-2xl font-bold text-white mb-1">{tab.count}</div>
                    <div className="text-brand-green text-sm">{tab.name}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-brand-red text-white'
                      : 'bg-brand-darker text-brand-green hover:bg-brand-red/20'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.name}</span>
                  {tab.count !== null && (
                    <span className="bg-brand-green/20 text-brand-green px-2 py-1 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
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
              {activeTab === 'analytics' && <AdminAnalytics />}
              {activeTab === 'blogs' && <BlogManagement />}
              {activeTab === 'events' && <EventManagement />}
              {activeTab === 'projects' && <ProjectManagement />}
              {activeTab === 'users' && <UserManagement />}
              {activeTab === 'messages' && <ContactMessageManagement />}
              {activeTab === 'email' && <EmailManagement />}
              {activeTab === 'audit' && <AuditLogViewer />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
