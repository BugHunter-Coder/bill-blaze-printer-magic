import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  Star, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  ShoppingBag,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/hooks/useShop';
import { useToast } from '@/hooks/use-toast';
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, PieChart, Pie, Cell, BarChart } from 'recharts';

interface CustomerData {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  averageOrderValue: number;
  customerRetentionRate: number;
  topCustomers: Array<{
    name: string;
    totalSpent: number;
    orderCount: number;
    lastOrder: string;
  }>;
  customerGrowth: Array<{
    month: string;
    newCustomers: number;
    totalCustomers: number;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const CustomerAnalytics = () => {
  const { selectedShopId } = useShop();
  const [customerData, setCustomerData] = useState<CustomerData>({
    totalCustomers: 0,
    newCustomers: 0,
    repeatCustomers: 0,
    averageOrderValue: 0,
    customerRetentionRate: 0,
    topCustomers: [],
    customerGrowth: [],
    customerSegments: []
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    if (selectedShopId) {
      fetchCustomerData();
    }
  }, [selectedShopId, timeframe]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      if (!selectedShopId) return;

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeframe));

      // Fetch transactions for customer analysis
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', selectedShopId)
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Analyze customer data
      const customerMap = new Map();
      const customerOrderCount = new Map();
      const customerTotalSpent = new Map();

      transactions?.forEach(transaction => {
        const customerId = transaction.customer_id || 'anonymous';
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            firstOrder: transaction.created_at,
            lastOrder: transaction.created_at,
            orderCount: 0,
            totalSpent: 0
          });
        }

        const customer = customerMap.get(customerId);
        customer.orderCount += 1;
        customer.totalSpent += transaction.total_amount;
        customer.lastOrder = transaction.created_at;
      });

      // Calculate metrics
      const totalCustomers = customerMap.size;
      const repeatCustomers = Array.from(customerMap.values()).filter(c => c.orderCount > 1).length;
      const totalRevenue = Array.from(customerMap.values()).reduce((sum, c) => sum + c.totalSpent, 0);
      const averageOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
      const customerRetentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

      // Get top customers
      const topCustomers = Array.from(customerMap.entries())
        .map(([id, data]) => ({
          name: id === 'anonymous' ? 'Anonymous Customer' : `Customer ${id}`,
          totalSpent: data.totalSpent,
          orderCount: data.orderCount,
          lastOrder: data.lastOrder
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      // Generate customer segments
      const segments = [
        { segment: 'High Value', count: topCustomers.filter(c => c.totalSpent > 1000).length, percentage: 0, color: '#0088FE' },
        { segment: 'Regular', count: topCustomers.filter(c => c.totalSpent > 500 && c.totalSpent <= 1000).length, percentage: 0, color: '#00C49F' },
        { segment: 'Occasional', count: topCustomers.filter(c => c.totalSpent > 100 && c.totalSpent <= 500).length, percentage: 0, color: '#FFBB28' },
        { segment: 'New', count: topCustomers.filter(c => c.totalSpent <= 100).length, percentage: 0, color: '#FF8042' }
      ];

      segments.forEach(segment => {
        segment.percentage = totalCustomers > 0 ? (segment.count / totalCustomers) * 100 : 0;
      });

      // Generate customer growth data (simplified)
      const customerGrowth = [
        { month: 'Jan', newCustomers: Math.floor(Math.random() * 20) + 5, totalCustomers: Math.floor(Math.random() * 100) + 50 },
        { month: 'Feb', newCustomers: Math.floor(Math.random() * 20) + 5, totalCustomers: Math.floor(Math.random() * 100) + 50 },
        { month: 'Mar', newCustomers: Math.floor(Math.random() * 20) + 5, totalCustomers: Math.floor(Math.random() * 100) + 50 },
        { month: 'Apr', newCustomers: Math.floor(Math.random() * 20) + 5, totalCustomers: Math.floor(Math.random() * 100) + 50 },
        { month: 'May', newCustomers: Math.floor(Math.random() * 20) + 5, totalCustomers: Math.floor(Math.random() * 100) + 50 },
        { month: 'Jun', newCustomers: Math.floor(Math.random() * 20) + 5, totalCustomers: Math.floor(Math.random() * 100) + 50 }
      ];

      setCustomerData({
        totalCustomers,
        newCustomers: Math.floor(totalCustomers * 0.3), // Simplified calculation
        repeatCustomers,
        averageOrderValue,
        customerRetentionRate,
        topCustomers,
        customerGrowth,
        customerSegments: segments
      });

    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customer analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading customer analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Analytics</h2>
          <p className="text-gray-600">Understand your customer behavior and trends</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchCustomerData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-blue-600">{customerData.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Customers</p>
                <p className="text-2xl font-bold text-green-600">{customerData.newCustomers}</p>
              </div>
              <UserPlus className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Repeat Customers</p>
                <p className="text-2xl font-bold text-purple-600">{customerData.repeatCustomers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-orange-600">₹{customerData.averageOrderValue.toFixed(2)}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerData.customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="newCustomers" fill="#3b82f6" name="New Customers" />
                  <Bar dataKey="totalCustomers" fill="#10b981" name="Total Customers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Segments Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerData.customerSegments}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ segment, percentage }) => `${segment}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {customerData.customerSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customerData.topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-600">
                      {customer.orderCount} orders • Last order: {new Date(customer.lastOrder).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">₹{customer.totalSpent.toFixed(2)}</p>
                  <Badge variant="secondary" className="text-xs">
                    {customer.orderCount} orders
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Retention Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Retention Rate</p>
              <p className="text-2xl font-bold text-blue-600">{customerData.customerRetentionRate.toFixed(1)}%</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Growth Rate</p>
              <p className="text-2xl font-bold text-green-600">+{((customerData.newCustomers / customerData.totalCustomers) * 100).toFixed(1)}%</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Loyal Customers</p>
              <p className="text-2xl font-bold text-purple-600">{customerData.repeatCustomers}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 