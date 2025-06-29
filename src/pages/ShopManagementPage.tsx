import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { ShopSettings } from '@/components/ShopSettings';
import { StaffManagement } from '@/components/StaffManagement';
import { PrinterSetup } from '@/components/PrinterSetup';
import { Integrations } from '@/components/Integrations';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Settings, Users, Receipt, Globe } from 'lucide-react';

export const ShopManagementPage = () => {
  const { user, loading } = useAuth();
  const { selectedShop, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    // Set active tab based on URL
    if (location.pathname.includes('/shop/settings')) {
      setActiveTab('settings');
    } else if (location.pathname.includes('/shop/staff')) {
      setActiveTab('staff');
    } else if (location.pathname.includes('/shop/printer')) {
      setActiveTab('printer');
    } else if (location.pathname.includes('/shop/integrations')) {
      setActiveTab('integrations');
    }
  }, [location.pathname]);

  if (loading || shopLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Please log in to access shop management</p>
          <Button onClick={() => navigate('/auth')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (!selectedShop) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No company selected</p>
          <p className="text-sm text-gray-500 mb-4">Please select a company from the header to access shop management.</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Shop Management</h1>
                  <p className="text-gray-600">Manage {selectedShop.name} settings and configuration</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Management Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              <TabsTrigger value="settings" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg transition-all flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Shop Settings</span>
              </TabsTrigger>
              <TabsTrigger value="staff" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg transition-all flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Staff Management</span>
              </TabsTrigger>
              <TabsTrigger value="printer" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg transition-all flex items-center space-x-2">
                <Receipt className="h-4 w-4" />
                <span>Printer Setup</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-lg transition-all flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Integrations</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="mt-6">
              <ShopSettings />
            </TabsContent>

            <TabsContent value="staff" className="mt-6">
              <StaffManagement />
            </TabsContent>

            <TabsContent value="printer" className="mt-6">
              <PrinterSetup />
            </TabsContent>

            <TabsContent value="integrations" className="mt-6">
              <Integrations />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ShopManagementPage;
