
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { ShopManagement } from '@/components/ShopManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Settings, ArrowLeft } from 'lucide-react';

const POS = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showManagement, setShowManagement] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShopData = async () => {
      if (!user || !profile?.shop_id) return;
      
      try {
        const { data: shopData, error } = await supabase
          .from('shops')
          .select('*')
          .eq('id', profile.shop_id)
          .single();
        
        if (error) throw error;
        setShop(shopData);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to fetch shop data: " + error.message,
          variant: "destructive",
        });
      }
    };

    fetchShopData();
  }, [user, profile]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        description: "Logout successful!",
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to logout: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async (data: any) => {
    try {
      await updateProfile(data);
      toast({
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile: " + error.message,
        variant: "destructive",
      });
    }
  };

  const addExpense = (expense: any) => {
    // Handle expense addition
    console.log('Adding expense:', expense);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile?.shop_id) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onLogout={handleLogout}
        onProfileUpdate={handleProfileUpdate}
        showBackToLanding={false}
      />
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Store className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {shop?.name || 'Your Shop'} - POS System
              </h1>
              <p className="text-gray-600">Point of Sale & Management</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button
              variant={showManagement ? "default" : "outline"}
              onClick={() => setShowManagement(!showManagement)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {showManagement ? 'Hide Management' : 'Shop Management'}
            </Button>
          </div>
        </div>

        {showManagement ? (
          <ShopManagement
            shopDetails={shop}
            onShopUpdate={() => {
              // Refresh shop data
              console.log('Shop updated');
            }}
            transactions={transactions}
            onAddExpense={addExpense}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Point of Sale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">POS Interface</h3>
                  <p className="text-gray-500 mb-4">
                    Your point of sale interface will be available here.
                  </p>
                  <Button onClick={() => setShowManagement(true)}>
                    Access Shop Management
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowManagement(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Products & Inventory
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowManagement(true)}
                >
                  <Store className="h-4 w-4 mr-2" />
                  View Sales Reports
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;
