
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import MatrixRain from '@/components/MatrixRain';
import Footer from '@/components/Footer';
import UserBlogManagement from '@/components/user/UserBlogManagement';
import NotificationCenter from '@/components/user/NotificationCenter';
import { ProfileManager } from '@/components/user/ProfileManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Bell, User, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

interface DashboardStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  pendingBlogs: number;
}

const UserDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    pendingBlogs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      fetchStats();
    }
  }, [user, authLoading, navigate]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('status')
        .eq('author_id', user.id);

      if (error) throw error;

      const stats = data.reduce((acc, blog) => {
        acc.totalBlogs++;
        switch (blog.status) {
          case 'published':
            acc.publishedBlogs++;
            break;
          case 'draft':
            acc.draftBlogs++;
            break;
          case 'pending':
            acc.pendingBlogs++;
            break;
        }
        return acc;
      }, {
        totalBlogs: 0,
        publishedBlogs: 0,
        draftBlogs: 0,
        pendingBlogs: 0
      });

      setStats(stats);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." fullScreen />
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
                  <User className="h-8 w-8 text-brand-red" />
                  <div>
                    <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
                    <p className="text-brand-green mt-1">Welcome back, {user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="terminal-window hover-glow transition-all duration-300">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <div className="p-6 text-center">
                <div className="text-2xl font-bold text-white mb-1">{stats.totalBlogs}</div>
                <div className="text-brand-green text-sm">Total Articles</div>
              </div>
            </div>
            
            <div className="terminal-window hover-glow transition-all duration-300">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <div className="p-6 text-center">
                <div className="text-2xl font-bold text-white mb-1">{stats.publishedBlogs}</div>
                <div className="text-brand-green text-sm">Published</div>
              </div>
            </div>
            
            <div className="terminal-window hover-glow transition-all duration-300">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <div className="p-6 text-center">
                <div className="text-2xl font-bold text-white mb-1">{stats.draftBlogs}</div>
                <div className="text-brand-green text-sm">Drafts</div>
              </div>
            </div>
            
            <div className="terminal-window hover-glow transition-all duration-300">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                </div>
              </div>
              <div className="p-6 text-center">
                <div className="text-2xl font-bold text-white mb-1">{stats.pendingBlogs}</div>
                <div className="text-brand-green text-sm">Pending Review</div>
              </div>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="blogs" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-brand-darker border border-brand-green/20">
              <TabsTrigger value="blogs" className="flex items-center space-x-2 data-[state=active]:bg-brand-red">
                <BookOpen size={18} />
                <span>My Articles</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-2 data-[state=active]:bg-brand-red">
                <Bell size={18} />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center space-x-2 data-[state=active]:bg-brand-red">
                <Settings size={18} />
                <span>Profile</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="blogs" className="mt-6">
              <UserBlogManagement onStatsUpdate={fetchStats} />
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-6">
              <NotificationCenter />
            </TabsContent>
            
            <TabsContent value="profile" className="mt-6">
              <ProfileManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default UserDashboard;
