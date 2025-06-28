import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, TrendingDown, DollarSign, Loader2, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useShop } from '@/hooks/useShop';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionDetails } from './TransactionDetails';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionItem = Database['public']['Tables']['transaction_items']['Row'];
type Expense = Database['public']['Tables']['expenses']['Row'];

interface TransactionWithItems extends Transaction {
  transaction_items: TransactionItem[];
}

interface DailyReport {
  date: string;
  totalSales: number;
  totalTransactions: number;
  totalExpenses: number;
  totalProfit: number;
  transactionCount: number;
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

export const SalesReport = () => {
  const { selectedShopId, selectedShop } = useShop();
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedShopId) {
      fetchShopData();
    }
  }, [selectedShopId]);

  const fetchShopData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!selectedShopId) {
        setError('No shop selected');
        setLoading(false);
        return;
      }

      // Fetch transactions for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (*)
        `)
        .eq('shop_id', selectedShopId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        setError('Failed to fetch transactions');
        return;
      }

      // Store transactions for display
      setTransactions(transactionsData || []);

      // Fetch expenses for the last 30 days
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('shop_id', selectedShopId)
        .gte('expense_date', thirtyDaysAgo.toISOString())
        .order('expense_date', { ascending: false });

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        setError('Failed to fetch expenses');
        return;
      }

      generateDailyReports(transactionsData as TransactionWithItems[] || [], expenses || []);
    } catch (err) {
      console.error('Error fetching shop data:', err);
      setError('Failed to fetch shop data');
    } finally {
      setLoading(false);
    }
  };

  const generateDailyReports = (transactions: TransactionWithItems[], expenses: Expense[]) => {
    const reportMap = new Map<string, DailyReport>();
    const itemSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    // Process transactions
    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at || '').toDateString();
      
      if (!reportMap.has(date)) {
        reportMap.set(date, {
          date,
          totalSales: 0,
          totalTransactions: 0,
          totalExpenses: 0,
          totalProfit: 0,
          transactionCount: 0,
          topSellingItems: [],
        });
      }

      const report = reportMap.get(date)!;

      if (transaction.type === 'sale') {
        report.totalSales += transaction.total_amount;
        report.transactionCount += 1;

        // Process transaction items for top selling items
        if (transaction.transaction_items) {
          transaction.transaction_items.forEach((item: TransactionItem) => {
            const itemKey = item.product_name;
            if (!itemSalesMap.has(itemKey)) {
              itemSalesMap.set(itemKey, {
                name: item.product_name,
                quantity: 0,
                revenue: 0,
              });
            }
            
            const itemData = itemSalesMap.get(itemKey)!;
            itemData.quantity += item.quantity;
            itemData.revenue += item.total_price;
          });
        }
      }

      report.totalTransactions += 1;
    });

    // Process expenses
    expenses.forEach(expense => {
      const date = new Date(expense.expense_date || '').toDateString();
      
      if (!reportMap.has(date)) {
        reportMap.set(date, {
          date,
          totalSales: 0,
          totalTransactions: 0,
          totalExpenses: 0,
          totalProfit: 0,
          transactionCount: 0,
          topSellingItems: [],
        });
      }

      const report = reportMap.get(date)!;
      report.totalExpenses += expense.amount;
    });

    // Calculate profits and get top selling items
    const reports = Array.from(reportMap.values()).map(report => {
      report.totalProfit = report.totalSales - report.totalExpenses;
      return report;
    });

    // Sort by date (newest first) and limit to 30 days
    const sortedReports = reports
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);

    // Add top selling items to today's report
    const todayReport = sortedReports.find(report => 
      new Date(report.date).toDateString() === new Date().toDateString()
    );

    if (todayReport) {
      todayReport.topSellingItems = Array.from(itemSalesMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    }

    setDailyReports(sortedReports);
  };

  const totalSales = dailyReports.reduce((sum, report) => sum + report.totalSales, 0);
  const totalExpenses = dailyReports.reduce((sum, report) => sum + report.totalExpenses, 0);
  const totalProfit = totalSales - totalExpenses;

  const todayReport = dailyReports.find(report => 
    new Date(report.date).toDateString() === new Date().toDateString()
  );

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleCloseTransactionDetails = () => {
    setShowTransactionDetails(false);
    setSelectedTransaction(null);
  };

  if (!selectedShopId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">No company selected</p>
          <p className="text-sm text-gray-500">Please select a company from the header to view sales reports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading sales data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button 
            onClick={fetchShopData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto space-y-6 p-6">
      {/* Company Info */}
      {selectedShop && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Store className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Current Company</p>
                  <p className="font-medium">{selectedShop.name}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{(todayReport?.totalSales || 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{(todayReport?.totalExpenses || 0).toFixed(2)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Profit</p>
                <p className={`text-2xl font-bold ${(todayReport?.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{(todayReport?.totalProfit || 0).toFixed(2)}
                </p>
              </div>
              <Badge variant={(todayReport?.totalProfit || 0) >= 0 ? "default" : "destructive"}>
                {(todayReport?.totalProfit || 0) >= 0 ? "Profit" : "Loss"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-blue-600">
                  {todayReport?.transactionCount || 0}
                </p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Items (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {todayReport?.topSellingItems && todayReport.topSellingItems.length > 0 ? (
              todayReport.topSellingItems.slice(0, 5).map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-sm text-gray-600">
                      Revenue: ₹{item.revenue.toFixed(2)}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    ${item.revenue.toFixed(2)}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data available for today</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions.length > 0 ? (
              transactions.slice(0, 10).map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleTransactionClick(transaction)}
                >
                  <div>
                    <p className="font-medium">#{transaction.invoice_number}</p>
                    <p className="text-sm text-gray-600">{new Date(transaction.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">Payment: {transaction.payment_method}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">₹{transaction.total_amount.toFixed(2)}</p>
                    <Badge variant="outline" className="text-xs">
                      {transaction.is_direct_billing ? 'Direct' : 'Regular'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No transactions found</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales Report (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyReports.length > 0 ? (
              dailyReports.map((report) => (
                <div key={report.date} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{new Date(report.date).toLocaleDateString()}</h3>
                    <Badge variant={report.totalProfit >= 0 ? "default" : "destructive"}>
                      {report.totalProfit >= 0 ? "Profit" : "Loss"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Sales</p>
                      <p className="font-medium text-green-600">₹{report.totalSales.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Expenses</p>
                      <p className="font-medium text-red-600">₹{report.totalExpenses.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Profit</p>
                      <p className={`font-medium ${report.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{report.totalProfit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Transactions</p>
                      <p className="font-medium text-blue-600">{report.transactionCount}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data available for the last 30 days</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-green-600">₹{totalSales.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{totalProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetails
          transaction={selectedTransaction}
          isOpen={showTransactionDetails}
          onClose={handleCloseTransactionDetails}
        />
      )}
    </div>
  );
};
