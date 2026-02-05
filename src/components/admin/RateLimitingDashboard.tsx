import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Activity, Shield, Clock, AlertTriangle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface RateLimitStat {
  key: string;
  attempt_count: number;
  first_attempt: string;
  last_attempt: string;
  locked_until: string | null;
}

const RateLimitingDashboard = () => {
  const [rateLimits, setRateLimits] = useState<RateLimitStat[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    blockedAttempts: 0,
    uniqueIPs: 0,
    activeBlocks: 0
  });

  useEffect(() => {
    fetchRateLimitData();
  }, [timeRange]);

  const fetchRateLimitData = async () => {
    setLoading(true);
    try {
      const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const since = new Date();
      since.setHours(since.getHours() - hoursAgo);

      const { data, error } = await supabase
        .from('rate_limits')
        .select('*')
        .gte('last_attempt', since.toISOString())
        .order('last_attempt', { ascending: false });

      if (error) throw error;

      setRateLimits(data || []);

      // Calculate stats
      const now = new Date();
      const totalAttempts = data?.reduce((sum, r) => sum + r.attempt_count, 0) || 0;
      const blockedAttempts = data?.filter(r => r.locked_until && new Date(r.locked_until) > now).length || 0;
      const uniqueIPs = new Set(data?.map(r => r.key.split(':')[1]).filter(Boolean)).size;
      const activeBlocks = data?.filter(r => r.locked_until && new Date(r.locked_until) > now).length || 0;

      setStats({ totalAttempts, blockedAttempts, uniqueIPs, activeBlocks });
    } catch (error) {
      console.error('Error fetching rate limits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group attempts by hour for chart
  const getHourlyData = () => {
    const hourlyMap = new Map<string, number>();
    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    
    for (let i = 0; i < Math.min(hours, 48); i++) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      const key = format(hour, 'MMM d HH:00');
      hourlyMap.set(key, 0);
    }

    rateLimits.forEach(limit => {
      const hour = format(new Date(limit.last_attempt), 'MMM d HH:00');
      if (hourlyMap.has(hour)) {
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + limit.attempt_count);
      }
    });

    return Array.from(hourlyMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .reverse();
  };

  // Group by endpoint type
  const getEndpointData = () => {
    const endpointMap = new Map<string, number>();
    
    rateLimits.forEach(limit => {
      const endpoint = limit.key.split(':')[0] || 'unknown';
      endpointMap.set(endpoint, (endpointMap.get(endpoint) || 0) + limit.attempt_count);
    });

    return Array.from(endpointMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const COLORS = ['#00ff88', '#ff4444', '#ffaa00', '#44aaff', '#aa44ff'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-brand-red" />
          <h2 className="text-xl font-bold text-white">Rate Limiting Dashboard</h2>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-brand-dark border-brand-green/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-brand-darker border-brand-green/20">
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-brand-darker border-brand-green/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-green/60 text-sm">Total Attempts</p>
                <p className="text-2xl font-bold text-white">{stats.totalAttempts}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-brand-green/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-brand-darker border-brand-green/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-green/60 text-sm">Active Blocks</p>
                <p className="text-2xl font-bold text-brand-red">{stats.activeBlocks}</p>
              </div>
              <Shield className="h-8 w-8 text-brand-red/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-brand-darker border-brand-green/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-green/60 text-sm">Unique IPs</p>
                <p className="text-2xl font-bold text-white">{stats.uniqueIPs}</p>
              </div>
              <Activity className="h-8 w-8 text-brand-green/40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-brand-darker border-brand-green/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-green/60 text-sm">Rate Limit Records</p>
                <p className="text-2xl font-bold text-white">{rateLimits.length}</p>
              </div>
              <Clock className="h-8 w-8 text-brand-green/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attempts Over Time */}
        <Card className="bg-brand-darker border-brand-green/20">
          <CardHeader>
            <CardTitle className="text-white">Rate Limit Attempts Over Time</CardTitle>
            <CardDescription>Hourly breakdown of rate-limited requests</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getHourlyData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3a1a" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#00ff88" 
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#00ff88" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0f', 
                    border: '1px solid #00ff88',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#00ff88" 
                  strokeWidth={2}
                  dot={{ fill: '#00ff88' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attempts by Endpoint */}
        <Card className="bg-brand-darker border-brand-green/20">
          <CardHeader>
            <CardTitle className="text-white">Top Rate-Limited Endpoints</CardTitle>
            <CardDescription>Most frequently rate-limited API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getEndpointData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a3a1a" />
                <XAxis type="number" stroke="#00ff88" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#00ff88" 
                  width={100}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0a0a0f', 
                    border: '1px solid #00ff88',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#ff4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Blocks Table */}
      {stats.activeBlocks > 0 && (
        <Card className="bg-brand-darker border-brand-red/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-brand-red" />
              Currently Blocked IPs/Keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rateLimits
                .filter(r => r.locked_until && new Date(r.locked_until) > new Date())
                .map(limit => (
                  <div 
                    key={limit.key} 
                    className="flex items-center justify-between p-3 bg-brand-dark rounded border border-brand-red/20"
                  >
                    <div>
                      <span className="text-white font-mono">{limit.key}</span>
                      <p className="text-brand-green/60 text-sm">
                        {limit.attempt_count} attempts
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">Blocked</Badge>
                      <p className="text-brand-red text-xs mt-1">
                        Until: {format(new Date(limit.locked_until!), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RateLimitingDashboard;
