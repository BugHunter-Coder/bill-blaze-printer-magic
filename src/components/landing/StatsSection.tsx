import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  ShoppingCart, 
  Store, 
  Package, 
  DollarSign,
  Calendar,
  Loader2
} from "lucide-react";
import { useGlobalStats } from "@/hooks/useGlobalStats";

export const StatsSection = () => {
  const { stats, loading, error } = useGlobalStats();

  // Fallback data in case of errors
  const fallbackStats = {
    totalTransactions: 1250,
    totalRevenue: 2500000,
    totalShops: 45,
    totalProducts: 3200,
    todayTransactions: 89,
    todayRevenue: 125000,
    monthlyTransactions: 1250,
    monthlyRevenue: 1800000,
  };

  const displayStats = error ? fallbackStats : stats;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              BillBlaze in Numbers
            </h2>
            <p className="text-lg text-gray-600">
              Real-time statistics from our growing community
            </p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            <TrendingUp className="w-3 h-3 mr-1" />
            {error ? "Sample Statistics" : "Live Statistics"}
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            BillBlaze in Numbers
          </h2>
          <p className="text-lg text-gray-600">
            {error ? "Sample statistics from our growing community" : "Real-time statistics from our growing community"}
          </p>
          {error && (
            <p className="text-sm text-gray-500 mt-2">
              Live data temporarily unavailable
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {/* Total Transactions */}
          <Card className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {formatNumber(displayStats.totalTransactions)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {formatCurrency(displayStats.totalRevenue)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </CardContent>
          </Card>

          {/* Total Shops */}
          <Card className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center mx-auto mb-3">
                <Store className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {formatNumber(displayStats.totalShops)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Active Shops</p>
            </CardContent>
          </Card>

          {/* Total Products */}
          <Card className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
            <CardHeader className="pb-2">
              <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center mx-auto mb-3">
                <Package className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {formatNumber(displayStats.totalProducts)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Products Listed</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Stats */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                <CardTitle className="text-lg">Today's Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transactions</span>
                <span className="font-semibold text-lg">{formatNumber(displayStats.todayTransactions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-lg text-green-600">
                  {formatCurrency(displayStats.todayRevenue)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                <CardTitle className="text-lg">This Month</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transactions</span>
                <span className="font-semibold text-lg">{formatNumber(displayStats.monthlyTransactions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue</span>
                <span className="font-semibold text-lg text-green-600">
                  {formatCurrency(displayStats.monthlyRevenue)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}; 