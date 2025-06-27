
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import { ShopsSection } from '@/components/dashboard/ShopsSection';
import { ProfileSection } from '@/components/dashboard/ProfileSection';
import { CreateShopSection } from '@/components/dashboard/CreateShopSection';
import { Store, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user should be redirected to admin panel - ONLY for system admins
  useEffect(() => {
    if (user && profile && !loading) {
      const isSystemAdmin = user.email === 'admin@billblaze.com' || 
                           user.email === 'harjot@iprofit.in';
      
      if (isSystemAdmin) {
        navigate('/admin');
        return;
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    const fetchShops = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setShops(data || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to fetch shops data. " + error.message,
          variant: "destructive",
        });
      }
    };

    if (user) {
      fetchShops();
    }
  }, [user]);

  useEffect(() => {
    if (shops.length > 0 && !selectedShop && profile?.shop_id) {
      const shopFromProfile = shops.find(shop => shop.id === profile.shop_id);
      setSelectedShop(shopFromProfile || shops[0]);
    } else if (shops.length > 0 && !selectedShop) {
      setSelectedShop(shops[0]);
    }
  }, [shops, selectedShop, profile]);

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
        description: "Failed to logout. " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async (data: any) => {
    setIsUpdatingProfile(true);
    try {
      await updateProfile(data);
      toast({
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile. " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onLogout={handleLogout}
        onProfileUpdate={handleProfileUpdate}
        showBackToLanding={true}
        onBackToLanding={() => navigate('/')}
      />
      
      <div className="p-6">
        {/* Quick Access to POS */}
        {profile?.shop_id && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Store className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Ready to start selling?</h3>
                  <p className="text-blue-700">Access your point of sale system and manage your shop.</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/pos')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Go to POS
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ShopsSection 
            shops={shops}
            selectedShop={selectedShop}
            setSelectedShop={setSelectedShop}
            setShops={setShops}
          />
          <ProfileSection 
            user={user}
            profile={profile}
            shops={shops}
            onUpdate={handleProfileUpdate}
            isUpdating={isUpdatingProfile}
          />
        </div>

        <CreateShopSection 
          shops={shops}
          setShops={setShops}
        />
      </div>
    </div>
  );
};

export default Index;
