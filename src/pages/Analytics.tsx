import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesReport } from '@/components/SalesReport';
import { CustomerAnalytics } from '@/components/CustomerAnalytics';
import { ProductAnalytics } from '@/components/ProductAnalytics';
import { FinancialReports } from '@/components/FinancialReports';
import { BarChart3, TrendingUp, Users, Package, DollarSign } from 'lucide-react';

const Analytics = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    // Set active tab based on URL
    if (location.pathname.includes('/analytics/sales')) {
      setActiveTab('sales');
    } else if (location.pathname.includes('/analytics/customers')) {
      setActiveTab('customers');
    } else if (location.pathname.includes('/analytics/products')) {
      setActiveTab('products');
    } else if (location.pathname.includes('/analytics/financial')) {
      setActiveTab('financial');
    }
  }, [location.pathname]);

  return (
    <div className="overflow-y-auto bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600">Comprehensive business intelligence and insights</p>
              </div>
            </div>
          </div>

          {/* Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              <TabsTrigger 
                value="sales" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg transition-all flex items-center space-x-2"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Sales Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="customers" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg transition-all flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Customer Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg transition-all flex items-center space-x-2"
              >
                <Package className="h-4 w-4" />
                <span>Product Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="financial" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg transition-all flex items-center space-x-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>Financial Reports</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="mt-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Sales Performance Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SalesReport />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="mt-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <span>Customer Behavior Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomerAnalytics />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-purple-600" />
                    <span>Product Performance Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductAnalytics />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="mt-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span>Financial Reports & Statements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FinancialReports />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 