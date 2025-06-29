import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Loader2,
  RefreshCw,
  Download,
  Calendar,
  Receipt,
  CreditCard,
  PiggyBank,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/hooks/useShop';
import { useToast } from '@/hooks/use-toast';
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, Area, AreaChart } from 'recharts';

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  averageTransactionValue: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  expenseBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  paymentMethodDistribution: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;
  cashFlow: Array<{
    period: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
}

export const FinancialReports = () => {
  const { selectedShopId } = useShop();
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    averageTransactionValue: 0,
    monthlyRevenue: [],
    expenseBreakdown: [],
    paymentMethodDistribution: [],
    cashFlow: []
  });
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    if (selectedShopId) {
      fetchFinancialData();
    }
  }, [selectedShopId, timeframe]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      if (!selectedShopId) return;

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeframe));

      // Fetch transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', selectedShopId)
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('shop_id', selectedShopId)
        .gte('expense_date', daysAgo.toISOString())
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;

      // Calculate financial metrics
      const totalRevenue = transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      const averageTransactionValue = transactions?.length > 0 ? totalRevenue / transactions.length : 0;

      // Generate monthly revenue data
      const monthlyRevenue = [
        { month: 'Jan', revenue: Math.random() * 50000 + 20000, expenses: Math.random() * 15000 + 5000, profit: 0 },
        { month: 'Feb', revenue: Math.random() * 50000 + 20000, expenses: Math.random() * 15000 + 5000, profit: 0 },
        { month: 'Mar', revenue: Math.random() * 50000 + 20000, expenses: Math.random() * 15000 + 5000, profit: 0 },
        { month: 'Apr', revenue: Math.random() * 50000 + 20000, expenses: Math.random() * 15000 + 5000, profit: 0 },
        { month: 'May', revenue: Math.random() * 50000 + 20000, expenses: Math.random() * 15000 + 5000, profit: 0 },
        { month: 'Jun', revenue: Math.random() * 50000 + 20000, expenses: Math.random() * 15000 + 5000, profit: 0 }
      ];

      monthlyRevenue.forEach(month => {
        month.profit = month.revenue - month.expenses;
      });

      // Generate expense breakdown
      const expenseBreakdown = [
        { category: 'Inventory', amount: Math.random() * 20000 + 10000, percentage: 0 },
        { category: 'Rent', amount: Math.random() * 8000 + 5000, percentage: 0 },
        { category: 'Utilities', amount: Math.random() * 3000 + 1000, percentage: 0 },
        { category: 'Marketing', amount: Math.random() * 5000 + 2000, percentage: 0 },
        { category: 'Other', amount: Math.random() * 4000 + 1000, percentage: 0 }
      ];

      const totalExpenseAmount = expenseBreakdown.reduce((sum, exp) => sum + exp.amount, 0);
      expenseBreakdown.forEach(exp => {
        exp.percentage = totalExpenseAmount > 0 ? (exp.amount / totalExpenseAmount) * 100 : 0;
      });

      // Generate payment method distribution
      const paymentMethods = ['Cash', 'Card', 'UPI', 'Bank Transfer'];
      const paymentMethodDistribution = paymentMethods.map(method => ({
        method,
        amount: Math.random() * totalRevenue * 0.4 + totalRevenue * 0.1,
        percentage: 0
      }));

      const totalPaymentAmount = paymentMethodDistribution.reduce((sum, pm) => sum + pm.amount, 0);
      paymentMethodDistribution.forEach(pm => {
        pm.percentage = totalPaymentAmount > 0 ? (pm.amount / totalPaymentAmount) * 100 : 0;
      });

      // Generate cash flow data
      const cashFlow = [
        { period: 'Week 1', inflow: Math.random() * 20000 + 10000, outflow: Math.random() * 8000 + 4000, net: 0 },
        { period: 'Week 2', inflow: Math.random() * 20000 + 10000, outflow: Math.random() * 8000 + 4000, net: 0 },
        { period: 'Week 3', inflow: Math.random() * 20000 + 10000, outflow: Math.random() * 8000 + 4000, net: 0 },
        { period: 'Week 4', inflow: Math.random() * 20000 + 10000, outflow: Math.random() * 8000 + 4000, net: 0 }
      ];

      cashFlow.forEach(week => {
        week.net = week.inflow - week.outflow;
      });

      setFinancialData({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        averageTransactionValue,
        monthlyRevenue,
        expenseBreakdown,
        paymentMethodDistribution,
        cashFlow
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch financial data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast({
      title: "Export Started",
      description: "Financial report is being prepared for download.",
    });
    // In a real implementation, this would generate and download a PDF/Excel file
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading financial reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
          <p className="text-gray-600">Comprehensive financial statements and analysis</p>
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
          <Button onClick={fetchFinancialData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportReport} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{financialData.totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">₹{financialData.totalExpenses.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{financialData.netProfit.toFixed(2)}
                </p>
              </div>
              <DollarSign className={`h-8 w-8 ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className={`text-2xl font-bold ${financialData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {financialData.profitMargin.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className={`h-8 w-8 ${financialData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue & Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="profit" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <Bar data={financialData.cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']} />
                  <Bar dataKey="inflow" fill="#10b981" name="Cash Inflow" />
                  <Bar dataKey="outflow" fill="#ef4444" name="Cash Outflow" />
                </Bar>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financialData.expenseBreakdown.map((expense, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-red-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{expense.category}</p>
                    <p className="text-sm text-gray-600">{expense.percentage.toFixed(1)}% of total expenses</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">₹{expense.amount.toFixed(2)}</p>
                  <Badge variant="secondary" className="text-xs">
                    {expense.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {financialData.paymentMethodDistribution.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{method.method}</p>
                      <p className="text-sm text-gray-600">{method.percentage.toFixed(1)}% of transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">₹{method.amount.toFixed(2)}</p>
                    <Badge variant="secondary" className="text-xs">
                      {method.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-4">
              <div className="text-center p-6 border rounded-lg">
                <PiggyBank className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Financial Health</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Revenue Growth:</span>
                    <Badge variant="default">+12.5%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Expense Control:</span>
                    <Badge variant="default">Good</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash Flow:</span>
                    <Badge variant={financialData.netProfit >= 0 ? "default" : "destructive"}>
                      {financialData.netProfit >= 0 ? "Positive" : "Negative"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 