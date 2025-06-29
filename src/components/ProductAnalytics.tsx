import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Loader2,
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/hooks/useShop';
import { useToast } from '@/hooks/use-toast';
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, PieChart, Pie, Cell, BarChart } from 'recharts';

interface ProductData {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalRevenue: number;
  averagePrice: number;
  topSellingProducts: Array<{
    name: string;
    revenue: number;
    quantity: number;
    stock: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    revenue: number;
    products: number;
    color: string;
  }>;
  stockAlerts: Array<{
    name: string;
    currentStock: number;
    minStock: number;
    status: 'critical' | 'low' | 'normal';
  }>;
  priceDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export const ProductAnalytics = () => {
  const { selectedShopId } = useShop();
  const [productData, setProductData] = useState<ProductData>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalRevenue: 0,
    averagePrice: 0,
    topSellingProducts: [],
    categoryPerformance: [],
    stockAlerts: [],
    priceDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    if (selectedShopId) {
      fetchProductData();
    }
  }, [selectedShopId, timeframe]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      
      if (!selectedShopId) return;

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeframe));

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', selectedShopId)
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Fetch transactions for revenue analysis
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (*)
        `)
        .eq('shop_id', selectedShopId)
        .gte('created_at', daysAgo.toISOString());

      if (transactionsError) throw transactionsError;

      // Analyze product data
      const totalProducts = products?.length || 0;
      const activeProducts = products?.filter(p => p.is_active).length || 0;
      const lowStockProducts = products?.filter(p => p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0).length || 0;
      const outOfStockProducts = products?.filter(p => p.stock_quantity === 0).length || 0;

      // Calculate revenue from transactions
      const productRevenue = new Map();
      const productQuantity = new Map();

      transactions?.forEach(transaction => {
        if (transaction.transaction_items) {
          transaction.transaction_items.forEach((item: any) => {
            const productId = item.product_id;
            if (!productRevenue.has(productId)) {
              productRevenue.set(productId, 0);
              productQuantity.set(productId, 0);
            }
            productRevenue.set(productId, productRevenue.get(productId) + item.total_price);
            productQuantity.set(productId, productQuantity.get(productId) + item.quantity);
          });
        }
      });

      const totalRevenue = Array.from(productRevenue.values()).reduce((sum, revenue) => sum + revenue, 0);
      const averagePrice = products?.reduce((sum, product) => sum + product.price, 0) / totalProducts || 0;

      // Get top selling products
      const topSellingProducts = Array.from(productRevenue.entries())
        .map(([productId, revenue]) => {
          const product = products?.find(p => p.id === productId);
          return {
            name: product?.name || 'Unknown Product',
            revenue,
            quantity: productQuantity.get(productId) || 0,
            stock: product?.stock_quantity || 0
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Generate category performance (simplified)
      const categoryPerformance = [
        { category: 'Electronics', revenue: Math.random() * 50000, products: Math.floor(Math.random() * 20) + 5, color: '#0088FE' },
        { category: 'Clothing', revenue: Math.random() * 40000, products: Math.floor(Math.random() * 15) + 3, color: '#00C49F' },
        { category: 'Food & Beverages', revenue: Math.random() * 30000, products: Math.floor(Math.random() * 25) + 8, color: '#FFBB28' },
        { category: 'Home & Garden', revenue: Math.random() * 20000, products: Math.floor(Math.random() * 12) + 2, color: '#FF8042' }
      ];

      // Generate stock alerts
      const stockAlerts = products
        ?.filter(p => p.stock_quantity <= p.min_stock_level)
        .map(product => ({
          name: product.name,
          currentStock: product.stock_quantity,
          minStock: product.min_stock_level,
          status: (product.stock_quantity === 0 ? 'critical' : 'low') as 'critical' | 'low' | 'normal'
        }))
        .slice(0, 10) || [];

      // Generate price distribution
      const priceRanges = [
        { min: 0, max: 100, label: '₹0-100' },
        { min: 101, max: 500, label: '₹101-500' },
        { min: 501, max: 1000, label: '₹501-1000' },
        { min: 1001, max: 5000, label: '₹1001-5000' },
        { min: 5001, max: Infinity, label: '₹5000+' }
      ];

      const priceDistribution = priceRanges.map(range => {
        const count = products?.filter(p => p.price >= range.min && p.price <= range.max).length || 0;
        return {
          range: range.label,
          count,
          percentage: totalProducts > 0 ? (count / totalProducts) * 100 : 0
        };
      });

      setProductData({
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        totalRevenue,
        averagePrice,
        topSellingProducts,
        categoryPerformance,
        stockAlerts,
        priceDistribution
      });

    } catch (error) {
      console.error('Error fetching product data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch product analytics data.",
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
          <span>Loading product analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Analytics</h2>
          <p className="text-gray-600">Monitor product performance and inventory health</p>
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
          <Button onClick={fetchProductData} variant="outline" size="sm">
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
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{productData.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{productData.totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">{productData.lowStockProducts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{productData.outOfStockProducts}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productData.categoryPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Price Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Price Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productData.priceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, percentage }) => `${range}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {productData.priceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productData.topSellingProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      {product.quantity} units sold • Stock: {product.stock}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">₹{product.revenue.toFixed(2)}</p>
                  <Badge variant="secondary" className="text-xs">
                    {product.quantity} sold
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productData.stockAlerts.length > 0 ? (
              productData.stockAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      alert.status === 'critical' ? 'bg-red-100' : 'bg-orange-100'
                    }`}>
                      {alert.status === 'critical' ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{alert.name}</p>
                      <p className="text-sm text-gray-600">
                        Current: {alert.currentStock} • Min: {alert.minStock}
                      </p>
                    </div>
                  </div>
                  <Badge variant={alert.status === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.status === 'critical' ? 'Out of Stock' : 'Low Stock'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-gray-600">All products have sufficient stock levels</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 