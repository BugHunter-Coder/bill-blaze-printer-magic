import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, BarChart3, TrendingUp, Users, Store, Activity, Server, Database, Globe, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemMetrics {
  totalShops: number;
  totalUsers: number;
  activeShops: number;
  totalRevenue: number;
  systemUptime: number;
  databaseSize: string;
  apiRequests: number;
  errorRate: number;
  performance: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

const SystemOverview = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const { toast } = useToast();

  useEffect(() => {
    fetchSystemMetrics();
  }, [timeRange]);

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);

      // Fetch shops data
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*');

      if (shopsError) throw shopsError;

      // Fetch users data
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (usersError) throw usersError;

      // Fetch subscribers data for revenue calculation
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*');

      if (subscribersError && subscribersError.code !== 'PGRST116') {
        console.warn('Subscribers table might not exist:', subscribersError);
      }

      // Calculate metrics
      const totalShops = shops?.length || 0;
      const totalUsers = users?.length || 0;
      const activeShops = shops?.filter(shop => shop.is_active).length || 0;
      const totalRevenue = subscribers?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0;

      // Mock system metrics (in real app, you'd get these from monitoring services)
      const systemUptime = 99.9;
      const databaseSize = '2.4 GB';
      const apiRequests = 15420;
      const errorRate = 0.02;

      const performance = {
        cpu: 45,
        memory: 67,
        disk: 23,
        network: 89
      };

      // Mock recent activity
      const recentActivity = [
        {
          id: '1',
          type: 'system',
          description: 'Database backup completed successfully',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          severity: 'low' as const
        },
        {
          id: '2',
          type: 'user',
          description: 'New shop registration: TechMart Solutions',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          severity: 'low' as const
        },
        {
          id: '3',
          type: 'payment',
          description: 'Payment processed: ₹1,999 for Premium subscription',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          severity: 'medium' as const
        },
        {
          id: '4',
          type: 'error',
          description: 'API rate limit exceeded for shop ID: 12345',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          severity: 'high' as const
        }
      ];

      setMetrics({
        totalShops,
        totalUsers,
        activeShops,
        totalRevenue,
        systemUptime,
        databaseSize,
        apiRequests,
        errorRate,
        performance,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching system metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system metrics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge variant="outline" className="text-green-600">Low</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-yellow-600">Medium</Badge>;
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Server className="h-4 w-4 text-blue-600" />;
      case 'user':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'payment':
        return <BarChart3 className="h-4 w-4 text-purple-600" />;
      case 'error':
        return <Activity className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Overview</h1>
        <p className="text-gray-600">System performance metrics and health monitoring</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalShops}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.activeShops} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all shops
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.systemUptime}%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{metrics?.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-gray-500">{metrics?.performance.cpu}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${metrics?.performance.cpu}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-gray-500">{metrics?.performance.memory}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${metrics?.performance.memory}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Disk Usage</span>
                  <span className="text-sm text-gray-500">{metrics?.performance.disk}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ width: `${metrics?.performance.disk}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Network</span>
                  <span className="text-sm text-gray-500">{metrics?.performance.network}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${metrics?.performance.network}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Size</span>
                <span className="text-sm text-gray-500">{metrics?.databaseSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Requests (24h)</span>
                <span className="text-sm text-gray-500">{metrics?.apiRequests.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-sm text-gray-500">{(metrics?.errorRate * 100).toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Sessions</span>
                <span className="text-sm text-gray-500">1,234</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getActivityIcon(activity.type)}
                  <div>
                    <h3 className="font-medium">{activity.description}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                {getSeverityBadge(activity.severity)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemOverview; 