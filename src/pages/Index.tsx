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
import { Progress } from '@/components/ui/progress';
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
  Plus,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  Globe,
  Smartphone,
  CreditCard,
  Truck,
  Star,
  RefreshCw,
  Download,
  Filter,
  Search,
  Bell,
  Settings,
  PieChart,
  LineChart,
  AreaChart,
  UserCheck,
  PackageCheck,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Minus,
  Percent,
  Timer,
  Award,
  Shield,
  Database,
  Cloud,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';
import { SalesReport } from '@/components/SalesReport';
import { ProductManagement } from '@/components/ProductManagement';
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, Legend, BarChart, LineChart as RechartsLineChart, Area, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { Sidebar, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

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
  averageOrderValue: number;
  customerCount: number;
  repeatCustomers: number;
  topSellingProduct: string;
  topSellingRevenue: number;
  systemUptime: number;
  lastBackup: string;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
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
    yearlyGrowth: 0,
    averageOrderValue: 0,
    customerCount: 0,
    repeatCustomers: 0,
    topSellingProduct: '',
    topSellingRevenue: 0,
    systemUptime: 99.9,
    lastBackup: new Date().toISOString(),
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [monthlySalesData, setMonthlySalesData] = useState<{ month: string; sales: number; orders: number; profit: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; sales: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

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
      fetchMonthlySalesData();
      fetchHourlyData();
      fetchCategoryData();
      generatePerformanceMetrics();
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
      const averageOrderValue = todayOrders > 0 ? todaySales / todayOrders : 0;

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
        yearlyGrowth: 8.3,
        averageOrderValue,
        customerCount: 1250, // Mock data
        repeatCustomers: 850, // Mock data
        topSellingProduct: 'iPhone 14 Pro',
        topSellingRevenue: 450000,
        systemUptime: 99.9,
        lastBackup: new Date().toISOString(),
        pendingOrders: 5,
        completedOrders: 127,
        cancelledOrders: 2
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

  const fetchMonthlySalesData = async () => {
    if (!selectedShop) return;
    try {
      const year = new Date().getFullYear();
      const monthlyData: { month: string; sales: number; orders: number; profit: number }[] = [];
      for (let m = 0; m < 12; m++) {
        const start = new Date(year, m, 1);
        const end = new Date(year, m + 1, 1);
        const { data, error } = await supabase
          .from('transactions')
          .select('total_amount,created_at')
          .eq('shop_id', selectedShop.id)
          .gte('created_at', start.toISOString())
          .lt('created_at', end.toISOString());
        if (error) throw error;
        const sales = data?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
        const orders = data?.length || 0;
        const profit = sales * 0.3;
        monthlyData.push({ 
          month: start.toLocaleString('default', { month: 'short' }), 
          sales, 
          orders, 
          profit 
        });
      }
      setMonthlySalesData(monthlyData);
    } catch (error) {
      console.error('Error fetching monthly sales data:', error);
    }
  };

  const fetchHourlyData = async () => {
    // Mock hourly data for today
    const hourlyData = [];
    for (let i = 0; i < 24; i++) {
      hourlyData.push({
        hour: `${i}:00`,
        sales: Math.floor(Math.random() * 50000) + 10000
      });
    }
    setHourlyData(hourlyData);
  };

  const fetchCategoryData = async () => {
    // Mock category data
    setCategoryData([
      { name: 'Electronics', value: 45, color: '#3B82F6' },
      { name: 'Clothing', value: 25, color: '#10B981' },
      { name: 'Home & Garden', value: 15, color: '#F59E0B' },
      { name: 'Sports', value: 10, color: '#EF4444' },
      { name: 'Books', value: 5, color: '#8B5CF6' }
    ]);
  };

  const generatePerformanceMetrics = () => {
    setPerformanceMetrics([
      {
        name: 'Sales Conversion',
        value: 68,
        target: 75,
        unit: '%',
        trend: 'up',
        percentage: 68
      },
      {
        name: 'Customer Satisfaction',
        value: 4.8,
        target: 4.5,
        unit: '/5',
        trend: 'up',
        percentage: 96
      },
      {
        name: 'Inventory Turnover',
        value: 12,
        target: 10,
        unit: 'x',
        trend: 'up',
        percentage: 120
      },
      {
        name: 'Order Fulfillment',
        value: 98.5,
        target: 95,
        unit: '%',
        trend: 'up',
        percentage: 98.5
      }
    ]);
  };

  if (loading || loadingStats) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-ping"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!selectedShop) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Shop Selected</h2>
          <p className="text-gray-600 mb-4">Please select a shop from the header to view the dashboard.</p>
          <Button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
        {/* Sidebar: responsive */}
        <Sidebar>
          {/* Sidebar content is handled by the Sidebar component itself */}
        </Sidebar>
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => navigate('/pos')} className="bg-blue-600 hover:bg-blue-700">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Go to POS
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          {/* Dashboard Content */}
          <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full max-w-full">
            {/* Real-time Status Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-green-800">System Online</p>
                      <p className="text-xs text-green-600">99.9% uptime</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Wifi className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Network</p>
                      <p className="text-xs text-blue-600">Connected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Database className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-800">Last Backup</p>
                      <p className="text-xs text-purple-600">2 hours ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Alerts</p>
                      <p className="text-xs text-orange-600">3 pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Today's Sales</CardTitle>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">₹{stats.todaySales.toLocaleString()}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+{stats.monthlyGrowth}%</span>
                    <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">75% of daily target</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Orders Today</CardTitle>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.todayOrders}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+12%</span>
                    <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={60} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">60% of daily target</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Average Order</CardTitle>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">₹{stats.averageOrderValue.toFixed(0)}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+8%</span>
                    <span className="text-sm text-gray-500 ml-1">vs yesterday</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={85} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">85% of target</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.customerCount.toLocaleString()}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+15%</span>
                    <span className="text-sm text-gray-500 ml-1">this month</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={92} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">92% retention rate</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Sales Trend Chart */}
              <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <LineChart className="h-5 w-5 mr-2 text-blue-600" />
                      Sales Performance
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">Last 12 Months</Badge>
                      <Button variant="outline" size="sm">
                        <Filter className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {monthlySalesData.length > 0 ? (
                    <div className="w-full h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={monthlySalesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            stroke="#6b7280"
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px'
                            }}
                            formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Sales']}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="sales" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="profit" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="w-full h-80 flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No sales data available</p>
                        <p className="text-sm text-gray-400">Start making sales to see your trends</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-purple-600" />
                    Sales by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                          formatter={(value: any) => [`${value}%`, 'Sales']}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {categoryData.map((category, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-gray-700">{category.name}</span>
                        </div>
                        <span className="font-medium text-gray-900">{category.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {performanceMetrics.map((metric, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">{metric.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-2xl font-bold text-gray-900">
                        {metric.value}{metric.unit}
                      </div>
                      <div className={`flex items-center ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.trend === 'up' ? (
                          <TrendingUpIcon className="h-4 w-4" />
                        ) : metric.trend === 'down' ? (
                          <TrendingDownIcon className="h-4 w-4" />
                        ) : (
                          <Minus className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Target</span>
                        <span className="font-medium">{metric.target}{metric.unit}</span>
                      </div>
                      <Progress value={metric.percentage} className="h-2" />
                      <p className="text-xs text-gray-500">
                        {metric.percentage}% of target achieved
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Quick Actions */}
              <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => navigate('/pos')} 
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Start New Sale
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    View Customers
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-green-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { action: 'New order completed', amount: '₹2,450', time: '2 min ago', status: 'success' },
                    { action: 'Product stock updated', amount: 'iPhone 14 Pro', time: '5 min ago', status: 'info' },
                    { action: 'Customer registered', amount: 'John Doe', time: '10 min ago', status: 'success' },
                    { action: 'Payment received', amount: '₹1,200', time: '15 min ago', status: 'success' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.amount} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-blue-600" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="text-sm font-medium text-green-600">{stats.systemUptime}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <span className="text-sm font-medium text-green-600">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Backup</span>
                    <span className="text-sm font-medium text-green-600">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Security</span>
                    <span className="text-sm font-medium text-green-600">Protected</span>
                  </div>
                  <div className="pt-2 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      System Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics Tabs */}
            <Tabs defaultValue="sales" className="w-full">
              <TabsList className="grid w-full grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <TabsTrigger 
                  value="sales" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all"
                >
                  Sales Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="products" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all"
                >
                  Product Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="customers" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all"
                >
                  Customer Insights
                </TabsTrigger>
                <TabsTrigger 
                  value="reports" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all"
                >
                  Detailed Reports
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sales" className="space-y-2 sm:space-y-4 mt-4 sm:mt-6">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Sales Performance Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SalesReport />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="space-y-2 sm:space-y-4 mt-4 sm:mt-6">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Product Management & Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProductManagement />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customers" className="space-y-2 sm:space-y-4 mt-4 sm:mt-6">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Customer Analytics & Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Analytics</h3>
                      <p className="text-gray-600 mb-4">Advanced customer behavior analysis and insights.</p>
                      <Button onClick={() => navigate('/pos?management=customers')}>
                        View Customer Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-2 sm:space-y-4 mt-4 sm:mt-6">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Comprehensive Business Reports</CardTitle>
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
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
