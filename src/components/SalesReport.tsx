
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Transaction, DailyReport } from '@/types/pos';

interface SalesReportProps {
  transactions: Transaction[];
}

export const SalesReport = ({ transactions }: SalesReportProps) => {
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);

  useEffect(() => {
    generateDailyReports();
  }, [transactions]);

  const generateDailyReports = () => {
    const reportMap = new Map<string, DailyReport>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.created_at).toDateString();
      
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
      } else if (transaction.type === 'expense') {
        report.totalExpenses += transaction.total_amount;
      }

      report.totalTransactions += 1;
      report.totalProfit = report.totalSales - report.totalExpenses;
    });

    const reports = Array.from(reportMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);

    setDailyReports(reports);
  };

  const totalSales = dailyReports.reduce((sum, report) => sum + report.totalSales, 0);
  const totalExpenses = dailyReports.reduce((sum, report) => sum + report.totalExpenses, 0);
  const totalProfit = totalSales - totalExpenses;

  const todayReport = dailyReports.find(report => 
    new Date(report.date).toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-green-600">
                  ${(todayReport?.totalSales || 0).toFixed(2)}
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
                  ${(todayReport?.totalExpenses || 0).toFixed(2)}
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
                  ${(todayReport?.totalProfit || 0).toFixed(2)}
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

      {/* Daily Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales Report (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyReports.map((report) => (
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
                    <p className="font-medium text-green-600">${report.totalSales.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Expenses</p>
                    <p className="font-medium text-red-600">${report.totalExpenses.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Profit</p>
                    <p className={`font-medium ${report.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${report.totalProfit.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Transactions</p>
                    <p className="font-medium text-blue-600">{report.transactionCount}</p>
                  </div>
                </div>
              </div>
            ))}
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
              <p className="text-2xl font-bold text-green-600">${totalSales.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
