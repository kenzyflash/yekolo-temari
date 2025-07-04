
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
import { Settings, BookOpen, Calendar, FolderOpen, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, roles, loading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('blogs');
  const [stats, setStats] = useState({
    blogs: 0,
    events: 0,
    projects: 0,
    users: 0
  });

  useEffect(() => {
    console.log('Admin page - Auth loading:', authLoading, 'Roles loading:', rolesLoading);
    console.log('User:', user);
    console.log('Roles:', roles);
    console.log('Is admin:', isAdmin());
    
    if (!authLoading && !rolesLoading) {
      if (!user) {
        console.log('No user found, redirecting to auth');
        navigate('/auth');
        return;
      }
      if (!isAdmin()) {
        console.log('User is not admin, showing access denied');
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page. Please contact an administrator if you believe this is an error.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      console.log('User is admin, fetching stats');
      fetchStats();
    }
  }, [user, authLoading, rolesLoading, isAdmin, navigate, toast]);

  const fetchStats = async () => {
    try {
      const [blogsRes, eventsRes, projectsRes, usersRes] = await Promise.all([
        supabase.from('blogs').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        blogs: blogsRes.count || 0,
        events: eventsRes.count || 0,
        projects: projectsRes.count || 0,
        users: usersRes.count || 0
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

  // Add a manual admin role assignment for testing
  const makeUserAdmin = async () => {
    if (!user) return;
    
    try {
      // First check if user already has admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (existingRole) {
        toast({
          title: "Info",
          description: "You already have admin role",
        });
        return;
      }

      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: user.id,
          role: 'admin'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin role added successfully. Please refresh the page.",
      });
      
      // Refresh the page to update roles
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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

  // Show access denied if not admin, but provide a way to become admin for testing
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
                <div className="space-y-4">
                  <Button onClick={() => navigate('/')} className="bg-brand-red hover:bg-brand-accent-red">
                    Return Home
                  </Button>
                  <div className="text-sm text-brand-green/60">
                    <p>For testing purposes, you can temporarily grant yourself admin access:</p>
                    <Button 
                      onClick={makeUserAdmin}
                      variant="outline"
                      className="mt-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-dark"
                    >
                      Grant Admin Access (Testing)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'blogs', name: 'Blogs', icon: BookOpen, count: stats.blogs },
    { id: 'events', name: 'Events', icon: Calendar, count: stats.events },
    { id: 'projects', name: 'Projects', icon: FolderOpen, count: stats.projects },
    { id: 'users', name: 'Users', icon: Users, count: stats.users }
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
              {activeTab === 'blogs' && <BlogManagement />}
              {activeTab === 'events' && <EventManagement />}
              {activeTab === 'projects' && <ProjectManagement />}
              {activeTab === 'users' && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">User Management</h2>
                  <p className="text-brand-green">User management features coming soon...</p>
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
