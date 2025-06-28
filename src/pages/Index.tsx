import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Users,
  Calendar,
  BarChart3,
  Activity,
  Target,
  Plus
} from 'lucide-react';
import { SalesReport } from '@/components/SalesReport';
import { ProductManagement } from '@/components/ProductManagement';

interface DashboardStats {
  todayOrders: number;
  todaySales: number;
  todayProfit: number;
  runningTransactions: number;
  totalProducts: number;
  lowStockProducts: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  monthlyGrowth: number;
  yearlyGrowth: number;
}

const Index = () => {
  const { user, profile, loading } = useAuth();
  const { selectedShop } = useShop();
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todaySales: 0,
    todayProfit: 0,
    runningTransactions: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    monthlyGrowth: 0,
    yearlyGrowth: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user should be redirected to admin panel - ONLY for system admins
  useEffect(() => {
    if (user && profile && !loading) {
      const isSystemAdmin = user.email === 'admin@billblaze.com' || 
                           user.email === 'harjot@iprofit.in';
      
      if (isSystemAdmin) {
        navigate('/admin');
        return;
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (selectedShop) {
      fetchDashboardStats();
    }
  }, [selectedShop]);

  const fetchDashboardStats = async () => {
    if (!selectedShop) return;
    
    try {
      setLoadingStats(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Fetch today's transactions
      const { data: todayTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', selectedShop.id)
        .gte('created_at', today.toISOString());

      if (transactionsError) throw transactionsError;

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', selectedShop.id);

      if (productsError) throw productsError;

      // Calculate stats
      const todayOrders = todayTransactions?.length || 0;
      const todaySales = todayTransactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const todayProfit = todaySales * 0.3; // Assuming 30% profit margin
      const runningTransactions = 0; // No status field in transactions, set to 0 for now
      const totalProducts = products?.length || 0;
      const lowStockProducts = products?.filter(p => p.stock_quantity <= p.min_stock_level).length || 0;

      // Fetch monthly and yearly data for revenue calculation
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      
      const { data: monthlyTransactions } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('shop_id', selectedShop.id)
        .gte('created_at', startOfMonth.toISOString());

      const { data: yearlyTransactions } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('shop_id', selectedShop.id)
        .gte('created_at', startOfYear.toISOString());

      const monthlyRevenue = monthlyTransactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
      const yearlyRevenue = yearlyTransactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

      setStats({
        todayOrders,
        todaySales,
        todayProfit,
        runningTransactions,
        totalProducts,
        lowStockProducts,
        monthlyRevenue,
        yearlyRevenue,
        monthlyGrowth: 12.5, // Mock data - you can calculate actual growth
        yearlyGrowth: 8.3
      });

    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!selectedShop) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No company selected</p>
          <p className="text-sm text-gray-500 mb-4">Please select a company from the header to view the dashboard.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with {selectedShop.name}</p>
        </div>
        <Button onClick={() => navigate('/pos')} className="bg-blue-600 hover:bg-blue-700">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Go to POS
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayOrders > 0 ? '+' : ''}{stats.todayOrders} from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.todayProfit.toFixed(2)}</span> profit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.runningTransactions}</div>
            <p className="text-xs text-muted-foreground">
              Active orders in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">{stats.lowStockProducts}</span> low stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹{stats.monthlyRevenue.toFixed(2)}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+{stats.monthlyGrowth}%</span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Financial Year Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">₹{stats.yearlyRevenue.toFixed(2)}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-sm text-blue-600">+{stats.yearlyGrowth}%</span>
              <span className="text-sm text-gray-500 ml-1">from last year</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="products">Product Overview</TabsTrigger>
          <TabsTrigger value="reports">Detailed Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Detailed Reports</h3>
                <p className="text-gray-600 mb-4">Access comprehensive financial reports and analytics.</p>
                <Button onClick={() => navigate('/pos?management=sales')}>
                  View Full Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
