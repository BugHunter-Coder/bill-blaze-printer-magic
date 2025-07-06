import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Users, 
  Printer, 
  Settings, 
  Package, 
  CreditCard, 
  BarChart3, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ShopSetup = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { shops, loading } = useShop();
  const [activeTab, setActiveTab] = useState('overview');

  const currentShop = shops.find(shop => shop.id === profile?.shop_id);

  const setupSteps = [
    {
      id: 'overview',
      title: 'Shop Overview',
      icon: Store,
      description: 'Basic shop information and status',
      completed: !!currentShop,
      path: '/shop/settings'
    },
    {
      id: 'products',
      title: 'Products & Inventory',
      icon: Package,
      description: 'Add products and manage inventory',
      completed: false, // This would need to be checked against actual product count
      path: '/products/inventory'
    },
    {
      id: 'staff',
      title: 'Staff Management',
      icon: Users,
      description: 'Add staff members and set permissions',
      completed: false, // This would need to be checked against actual staff count
      path: '/shop/staff'
    },
    {
      id: 'printer',
      title: 'Printer Setup',
      icon: Printer,
      description: 'Configure thermal printer for receipts',
      completed: false, // This would need to be checked against printer connection
      path: '/pos'
    },
    {
      id: 'payment',
      title: 'Payment Methods',
      icon: CreditCard,
      description: 'Set up payment options and billing',
      completed: false,
      path: '/subscription'
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      icon: BarChart3,
      description: 'Configure reporting and analytics',
      completed: false,
      path: '/analytics'
    }
  ];

  const handleStepClick = (step: any) => {
    navigate(step.path);
  };

  const getCompletionPercentage = () => {
    const completedSteps = setupSteps.filter(step => step.completed).length;
    return Math.round((completedSteps / setupSteps.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentShop) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Shop Found</h2>
          <p className="text-gray-600 mb-4">Please create a shop first to access setup options.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shop Setup</h1>
            <p className="text-gray-600 mt-2">
              Complete your shop configuration to get the most out of BillBlaze
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{getCompletionPercentage()}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">{currentShop.name}</span>
            </div>
            <Badge variant={currentShop.is_active ? "default" : "secondary"}>
              {currentShop.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <Button 
            onClick={() => navigate('/dashboard')}
            variant="outline"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>

      {/* Setup Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {setupSteps.map((step) => (
          <Card 
            key={step.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              step.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'
            }`}
            onClick={() => handleStepClick(step)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    step.completed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">{step.title}</CardTitle>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
                {step.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                className={`w-full ${
                  step.completed 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {step.completed ? 'View Settings' : 'Configure'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/products/add')}
                className="h-12 flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </Button>
              <Button 
                onClick={() => navigate('/pos')}
                variant="outline"
                className="h-12 flex items-center justify-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Open POS</span>
              </Button>
              <Button 
                onClick={() => navigate('/analytics')}
                variant="outline"
                className="h-12 flex items-center justify-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>View Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopSetup; 