import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Users, Calendar, BookOpen, Mail, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { format, subDays, startOfMonth, eachDayOfInterval, eachMonthOfInterval, subMonths } from 'date-fns';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AnalyticsData {
  userGrowth: { date: string; count: number; cumulative: number }[];
  eventParticipation: { event: string; registered: number; checkedIn: number; rate: number }[];
  blogMetrics: { month: string; published: number; drafts: number }[];
  emailStats: { status: string; count: number }[];
  totals: {
    totalUsers: number;
    newUsersThisMonth: number;
    userGrowthPercent: number;
    totalEvents: number;
    avgParticipation: number;
    totalBlogs: number;
    publishedBlogs: number;
    totalEmails: number;
    emailSuccessRate: number;
  };
}

const COLORS = ['#ef4444', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6'];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        profilesRes,
        eventsRes,
        participantsRes,
        blogsRes,
        emailLogsRes
      ] = await Promise.all([
        supabase.from('profiles').select('created_at'),
        supabase.from('events').select('id, title, participants'),
        supabase.from('event_participants').select('event_id, checked_in, registered_at'),
        supabase.from('blogs').select('created_at, status, published'),
        supabase.from('email_logs').select('status, success_count, failure_count, created_at')
      ]);

      // Process user growth data
      const profiles = profilesRes.data || [];
      const userGrowthMap = new Map<string, number>();
      const last30Days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date()
      });

      last30Days.forEach(day => {
        userGrowthMap.set(format(day, 'yyyy-MM-dd'), 0);
      });

      profiles.forEach(profile => {
        const date = format(new Date(profile.created_at), 'yyyy-MM-dd');
        if (userGrowthMap.has(date)) {
          userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
        }
      });

      let cumulative = profiles.filter(p => 
        new Date(p.created_at) < subDays(new Date(), 29)
      ).length;

      const userGrowth = Array.from(userGrowthMap.entries()).map(([date, count]) => {
        cumulative += count;
        return {
          date: format(new Date(date), 'MMM dd'),
          count,
          cumulative
        };
      });

      // Process event participation data
      const events = eventsRes.data || [];
      const participants = participantsRes.data || [];
      
      const eventParticipation = events.slice(0, 10).map(event => {
        const eventParticipants = participants.filter(p => p.event_id === event.id);
        const registered = eventParticipants.length;
        const checkedIn = eventParticipants.filter(p => p.checked_in).length;
        const rate = registered > 0 ? Math.round((checkedIn / registered) * 100) : 0;
        
        return {
          event: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
          registered,
          checkedIn,
          rate
        };
      });

      // Process blog metrics
      const blogs = blogsRes.data || [];
      const last6Months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date()
      });

      const blogMetrics = last6Months.map(month => {
        const monthStr = format(month, 'yyyy-MM');
        const monthBlogs = blogs.filter(blog => 
          format(new Date(blog.created_at), 'yyyy-MM') === monthStr
        );
        
        return {
          month: format(month, 'MMM'),
          published: monthBlogs.filter(b => b.published || b.status === 'published').length,
          drafts: monthBlogs.filter(b => !b.published && b.status !== 'published').length
        };
      });

      // Process email statistics
      const emailLogs = emailLogsRes.data || [];
      const emailStatusCounts: Record<string, number> = {
        'Sent': 0,
        'Partial': 0,
        'Failed': 0,
        'Pending': 0
      };

      emailLogs.forEach(log => {
        if (log.status === 'sent') {
          emailStatusCounts['Sent']++;
        } else if (log.status === 'partial') {
          emailStatusCounts['Partial']++;
        } else if (log.status === 'failed') {
          emailStatusCounts['Failed']++;
        } else {
          emailStatusCounts['Pending']++;
        }
      });

      const emailStats = Object.entries(emailStatusCounts)
        .filter(([_, count]) => count > 0)
        .map(([status, count]) => ({ status, count }));

      // Calculate totals
      const thisMonth = startOfMonth(new Date());
      const lastMonth = startOfMonth(subMonths(new Date(), 1));
      const newUsersThisMonth = profiles.filter(p => new Date(p.created_at) >= thisMonth).length;
      const newUsersLastMonth = profiles.filter(p => 
        new Date(p.created_at) >= lastMonth && new Date(p.created_at) < thisMonth
      ).length;
      
      const userGrowthPercent = newUsersLastMonth > 0 
        ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : newUsersThisMonth > 0 ? 100 : 0;

      const totalSuccessEmails = emailLogs.reduce((sum, log) => sum + (log.success_count || 0), 0);
      const totalFailedEmails = emailLogs.reduce((sum, log) => sum + (log.failure_count || 0), 0);
      const emailSuccessRate = (totalSuccessEmails + totalFailedEmails) > 0
        ? Math.round((totalSuccessEmails / (totalSuccessEmails + totalFailedEmails)) * 100)
        : 0;

      const avgParticipation = eventParticipation.length > 0
        ? Math.round(eventParticipation.reduce((sum, e) => sum + e.rate, 0) / eventParticipation.length)
        : 0;

      setData({
        userGrowth,
        eventParticipation,
        blogMetrics,
        emailStats: emailStats.length > 0 ? emailStats : [{ status: 'No Data', count: 1 }],
        totals: {
          totalUsers: profiles.length,
          newUsersThisMonth,
          userGrowthPercent,
          totalEvents: events.length,
          avgParticipation,
          totalBlogs: blogs.length,
          publishedBlogs: blogs.filter(b => b.published || b.status === 'published').length,
          totalEmails: emailLogs.length,
          emailSuccessRate
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading analytics..." />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 text-brand-red mx-auto mb-4" />
        <p className="text-brand-green">Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-brand-darker border-brand-green/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-brand-green/80">Total Users</CardTitle>
            <Users className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.totals.totalUsers}</div>
            <div className="flex items-center text-xs mt-1">
              {data.totals.userGrowthPercent >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={data.totals.userGrowthPercent >= 0 ? 'text-green-500' : 'text-red-500'}>
                {data.totals.userGrowthPercent >= 0 ? '+' : ''}{data.totals.userGrowthPercent}%
              </span>
              <span className="text-brand-green/60 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-brand-darker border-brand-green/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-brand-green/80">Event Participation</CardTitle>
            <Calendar className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.totals.avgParticipation}%</div>
            <p className="text-xs text-brand-green/60 mt-1">
              Avg check-in rate across {data.totals.totalEvents} events
            </p>
          </CardContent>
        </Card>

        <Card className="bg-brand-darker border-brand-green/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-brand-green/80">Published Blogs</CardTitle>
            <BookOpen className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.totals.publishedBlogs}</div>
            <p className="text-xs text-brand-green/60 mt-1">
              of {data.totals.totalBlogs} total posts
            </p>
          </CardContent>
        </Card>

        <Card className="bg-brand-darker border-brand-green/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-brand-green/80">Email Success Rate</CardTitle>
            <Mail className="h-4 w-4 text-brand-red" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.totals.emailSuccessRate}%</div>
            <p className="text-xs text-brand-green/60 mt-1">
              {data.totals.totalEmails} campaigns sent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-brand-darker border border-brand-green/20">
          <TabsTrigger value="users" className="data-[state=active]:bg-brand-red data-[state=active]:text-white">
            User Growth
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-brand-red data-[state=active]:text-white">
            Event Stats
          </TabsTrigger>
          <TabsTrigger value="blogs" className="data-[state=active]:bg-brand-red data-[state=active]:text-white">
            Blog Activity
          </TabsTrigger>
          <TabsTrigger value="emails" className="data-[state=active]:bg-brand-red data-[state=active]:text-white">
            Email Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card className="bg-brand-darker border-brand-green/20">
            <CardHeader>
              <CardTitle className="text-white">User Growth (Last 30 Days)</CardTitle>
              <CardDescription className="text-brand-green/60">
                Daily new registrations and cumulative user count
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.userGrowth}>
                    <defs>
                      <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22c55e20" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#22c55e" 
                      tick={{ fill: '#22c55e', fontSize: 12 }}
                      tickLine={{ stroke: '#22c55e' }}
                    />
                    <YAxis 
                      stroke="#22c55e"
                      tick={{ fill: '#22c55e', fontSize: 12 }}
                      tickLine={{ stroke: '#22c55e' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0a0a0a', 
                        border: '1px solid #22c55e40',
                        borderRadius: '8px',
                        color: '#22c55e'
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      name="Total Users"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#colorCumulative)"
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="New Users"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <Card className="bg-brand-darker border-brand-green/20">
            <CardHeader>
              <CardTitle className="text-white">Event Participation</CardTitle>
              <CardDescription className="text-brand-green/60">
                Registration vs check-in rates per event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                {data.eventParticipation.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.eventParticipation} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#22c55e20" />
                      <XAxis 
                        type="number" 
                        stroke="#22c55e"
                        tick={{ fill: '#22c55e', fontSize: 12 }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="event" 
                        stroke="#22c55e"
                        tick={{ fill: '#22c55e', fontSize: 11 }}
                        width={150}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0a0a0a', 
                          border: '1px solid #22c55e40',
                          borderRadius: '8px',
                          color: '#22c55e'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="registered" name="Registered" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="checkedIn" name="Checked In" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-brand-green/60">No event data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blogs" className="mt-4">
          <Card className="bg-brand-darker border-brand-green/20">
            <CardHeader>
              <CardTitle className="text-white">Blog Activity (Last 6 Months)</CardTitle>
              <CardDescription className="text-brand-green/60">
                Published posts vs drafts per month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.blogMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22c55e20" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#22c55e"
                      tick={{ fill: '#22c55e', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#22c55e"
                      tick={{ fill: '#22c55e', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0a0a0a', 
                        border: '1px solid #22c55e40',
                        borderRadius: '8px',
                        color: '#22c55e'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="published" name="Published" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="drafts" name="Drafts" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="mt-4">
          <Card className="bg-brand-darker border-brand-green/20">
            <CardHeader>
              <CardTitle className="text-white">Email Campaign Statistics</CardTitle>
              <CardDescription className="text-brand-green/60">
                Distribution of email campaign outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.emailStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#22c55e' }}
                    >
                      {data.emailStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0a0a0a', 
                        border: '1px solid #22c55e40',
                        borderRadius: '8px',
                        color: '#22c55e'
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span style={{ color: '#22c55e' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
