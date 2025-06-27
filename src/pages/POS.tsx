
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { POSInterface } from '@/components/POSInterface';
import { ShopManagement } from '@/components/ShopManagement';
import { Button } from '@/components/ui/button';
import { Store, Settings, ArrowLeft } from 'lucide-react';

const POS = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const [shop, setShop] = useState<any>(null);
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
      
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-4">
          <Store className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {shop?.name || 'Your Shop'} - POS
            </h1>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={showManagement ? "default" : "outline"}
            onClick={() => setShowManagement(!showManagement)}
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            {showManagement ? 'Hide Management' : 'Management'}
          </Button>
        </div>
      </div>

      {showManagement ? (
        <div className="p-4">
          <ShopManagement
            shopDetails={shop}
            onShopUpdate={() => {
              // Refresh shop data
              console.log('Shop updated');
            }}
            transactions={[]}
            onAddExpense={() => {}}
          />
        </div>
      ) : (
        shop && <POSInterface shopDetails={shop} />
      )}
    </div>
  );
};

export default POS;
