
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import { Transaction, DailyReport } from '@/types/pos';

interface SalesReportProps {
  transactions: Transaction[];
}

export const SalesReport = ({ transactions }: SalesReportProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const generateDailyReport = (date: Date): DailyReport => {
    const dayTransactions = transactions.filter(t => 
      new Date(t.date).toDateString() === date.toDateString()
    );

    const sales = dayTransactions.filter(t => t.type === 'sale');
    const expenses = dayTransactions.filter(t => t.type === 'expense');

    const totalSales = sales.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    // Calculate top selling items
    const itemSales: { [key: string]: { quantity: number; revenue: number } } = {};
    sales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          if (!itemSales[item.name]) {
            itemSales[item.name] = { quantity: 0, revenue: 0 };
          }
          itemSales[item.name].quantity += item.quantity;
          itemSales[item.name].revenue += item.quantity * item.price;
        });
      }
    });

    const topSellingItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      date: date.toDateString(),
      totalSales,
      totalExpenses,
      totalProfit: totalSales - totalExpenses,
      transactionCount: sales.length,
      topSellingItems,
    };
  };

  const today = new Date();
  const todayReport = generateDailyReport(today);

  const getLastNDays = (n: number) => {
    const reports: DailyReport[] = [];
    for (let i = 0; i < n; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      reports.push(generateDailyReport(date));
    }
    return reports.reverse();
  };

  const weeklyReports = getLastNDays(7);
  const monthlyReports = getLastNDays(30);

  const weeklyTotals = weeklyReports.reduce((acc, report) => ({
    sales: acc.sales + report.totalSales,
    expenses: acc.expenses + report.totalExpenses,
    profit: acc.profit + report.totalProfit,
    transactions: acc.transactions + report.transactionCount,
  }), { sales: 0, expenses: 0, profit: 0, transactions: 0 });

  const monthlyTotals = monthlyReports.reduce((acc, report) => ({
    sales: acc.sales + report.totalSales,
    expenses: acc.expenses + report.totalExpenses,
    profit: acc.profit + report.totalProfit,
    transactions: acc.transactions + report.transactionCount,
  }), { sales: 0, expenses: 0, profit: 0, transactions: 0 });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sales</p>
                    <p className="text-xl font-bold text-green-600">${todayReport.totalSales.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expenses</p>
                    <p className="text-xl font-bold text-red-600">${todayReport.totalExpenses.toFixed(2)}</p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Profit</p>
                    <p className={`text-xl font-bold ${todayReport.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${todayReport.totalProfit.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className={`h-6 w-6 ${todayReport.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-xl font-bold text-blue-600">{todayReport.transactionCount}</p>
                  </div>
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {todayReport.topSellingItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {todayReport.topSellingItems.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span>{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.revenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{item.quantity} sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Weekly Sales</p>
                    <p className="text-xl font-bold text-green-600">${weeklyTotals.sales.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Weekly Expenses</p>
                    <p className="text-xl font-bold text-red-600">${weeklyTotals.expenses.toFixed(2)}</p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Weekly Profit</p>
                    <p className={`text-xl font-bold ${weeklyTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${weeklyTotals.profit.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className={`h-6 w-6 ${weeklyTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Weekly Transactions</p>
                    <p className="text-xl font-bold text-blue-600">{weeklyTotals.transactions}</p>
                  </div>
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {weeklyReports.map((report) => (
                  <div key={report.date} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{new Date(report.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">{report.transactionCount} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${report.totalSales.toFixed(2)} sales</p>
                      <p className={`text-sm ${report.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${report.totalProfit.toFixed(2)} profit
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Sales</p>
                    <p className="text-xl font-bold text-green-600">${monthlyTotals.sales.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Expenses</p>
                    <p className="text-xl font-bold text-red-600">${monthlyTotals.expenses.toFixed(2)}</p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Profit</p>
                    <p className={`text-xl font-bold ${monthlyTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${monthlyTotals.profit.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className={`h-6 w-6 ${monthlyTotals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Transactions</p>
                    <p className="text-xl font-bold text-blue-600">{monthlyTotals.transactions}</p>
                  </div>
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
