import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { useToast } from '@/hooks/use-toast';
import { POSInterface } from '@/components/POSInterface';
import { ShopManagement } from '@/components/ShopManagement';
import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Shop = Database['public']['Tables']['shops']['Row'];

const POS = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const { selectedShop, loading: shopLoading } = useShop();
  const [showManagement, setShowManagement] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check URL parameters to auto-open management
  useEffect(() => {
    const management = searchParams.get('management');
    if (management === 'true' || management === 'sales' || management === 'products' || management === 'expenses') {
      setShowManagement(true);
    }
  }, [searchParams]);

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

  if (loading || shopLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!selectedShop) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No company selected</p>
          <p className="text-sm text-gray-500 mb-4">Please select a company from the header to use the POS system.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {selectedShop.name} - POS
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
        <ShopManagement
          onShopUpdate={() => {
            // Refresh shop data
            console.log('Shop updated');
          }}
          transactions={[]}
          onAddExpense={() => {}}
          defaultTab={searchParams.get('management') || 'products'}
        />
      ) : (
        <POSInterface shopDetails={selectedShop} />
      )}
    </div>
  );
};

export default POS;
