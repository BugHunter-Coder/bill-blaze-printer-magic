import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, Store, DollarSign, Activity, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShopAnalytics {
  totalShops: number;
  activeShops: number;
  totalUsers: number;
  totalRevenue: number;
  averageRevenuePerShop: number;
  topPerformingShops: Array<{
    id: string;
    name: string;
    revenue: number;
    users: number;
    isActive: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    shopName: string;
    action: string;
    timestamp: string;
  }>;
}

const ShopAnalytics = () => {
  const [analytics, setAnalytics] = useState<ShopAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const { toast } = useToast();

  useEffect(() => {
    fetchShopAnalytics();
  }, [timeRange]);

  const fetchShopAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch shops data
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (shopsError) throw shopsError;

      // Fetch users data
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      if (usersError) throw usersError;

      // Fetch transactions data (if you have a transactions table)
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', getDateFromTimeRange(timeRange));

      if (transactionsError && transactionsError.code !== 'PGRST116') {
        console.warn('Transactions table might not exist:', transactionsError);
      }

      // Calculate analytics
      const totalShops = shops?.length || 0;
      const activeShops = shops?.filter(shop => shop.is_active).length || 0;
      const totalUsers = users?.length || 0;
      
      // Calculate revenue (assuming transactions table exists)
      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const averageRevenuePerShop = totalShops > 0 ? totalRevenue / totalShops : 0;

      // Get top performing shops (by user count for now)
      const shopUserCounts = users?.reduce((acc, user) => {
        if (user.shop_id) {
          acc[user.shop_id] = (acc[user.shop_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const topPerformingShops = shops
        ?.map(shop => ({
          id: shop.id,
          name: shop.name,
          revenue: 0, // Would calculate from transactions
          users: shopUserCounts[shop.id] || 0,
          isActive: shop.is_active
        }))
        .sort((a, b) => b.users - a.users)
        .slice(0, 5) || [];

      // Mock recent activity (in real app, you'd have an activity log table)
      const recentActivity = shops?.slice(0, 5).map(shop => ({
        id: shop.id,
        shopName: shop.name,
        action: shop.is_active ? 'Shop activated' : 'Shop deactivated',
        timestamp: shop.updated_at || shop.created_at
      })) || [];

      setAnalytics({
        totalShops,
        activeShops,
        totalUsers,
        totalRevenue,
        averageRevenuePerShop,
        topPerformingShops,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching shop analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shop analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateFromTimeRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop Analytics</h1>
          <p className="text-gray-600">System-wide shop performance and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7D
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30D
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90D
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalShops}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.activeShops} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all shops
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics?.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Revenue/Shop</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics?.averageRevenuePerShop.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per shop average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Top Performing Shops</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Shops</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topPerformingShops.map((shop, index) => (
                  <div key={shop.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{shop.name}</h3>
                        <p className="text-sm text-gray-500">{shop.users} users</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={shop.isActive ? 'default' : 'secondary'}>
                        {shop.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm text-gray-500">₹{shop.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <div>
                        <h3 className="font-medium">{activity.shopName}</h3>
                        <p className="text-sm text-gray-500">{activity.action}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShopAnalytics; 