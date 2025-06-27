
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, AlertCircle, ArrowLeft } from 'lucide-react';
import { Shop, UserProfile } from '@/types/pos';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SuperAdminPanel } from '@/components/admin/SuperAdminPanel';

const Admin = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopUsers, setShopUsers] = useState<{ [key: string]: UserProfile[] }>({});
  const [loadingShops, setLoadingShops] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      checkAdminAccess();
    }
  }, [user, profile, loading]);

  const checkAdminAccess = async () => {
    try {
      console.log('Checking admin access for user:', user?.email);
      console.log('Current profile:', profile);
      
      // Strict admin check - ONLY specific system admin emails, NOT shop owners
      const isSystemAdmin = 
        user?.email === 'admin@billblaze.com' ||
        user?.email === 'harjot@iprofit.in';
      
      console.log('System admin check result:', isSystemAdmin);
      setIsAdmin(isSystemAdmin);
      
      if (isSystemAdmin) {
        await fetchShops();
      } else {
        setLoadingShops(false);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
      setLoadingShops(false);
    } finally {
      setAdminCheckLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      console.log('Fetching shops as admin...');
      
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Shops query result:', { shopsData, shopsError });

      if (shopsError) {
        console.error('Error fetching shops:', shopsError);
        if (shopsError.code === 'PGRST301' || shopsError.message?.includes('permission')) {
          toast({
            title: "Limited Access",
            description: "Admin role may need additional permissions. Contact system administrator.",
            variant: "destructive",
          });
        }
        throw shopsError;
      }

      setShops(shopsData || []);
      console.log('Shops set:', shopsData?.length || 0);

      // Fetch users for each shop
      if (shopsData && shopsData.length > 0) {
        const usersPromises = shopsData.map(async (shop) => {
          try {
            const { data: users, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('shop_id', shop.id);
            
            if (error) {
              console.error('Error fetching users for shop:', shop.id, error);
              return { shopId: shop.id, users: [] };
            }
            return { shopId: shop.id, users: users || [] };
          } catch (err) {
            console.error('Error in user fetch promise:', err);
            return { shopId: shop.id, users: [] };
          }
        });

        const usersResults = await Promise.all(usersPromises);
        const usersMap: { [key: string]: UserProfile[] } = {};
        usersResults.forEach(({ shopId, users }) => {
          usersMap[shopId] = users;
        });
        setShopUsers(usersMap);
        console.log('Shop users set:', usersMap);
      }

    } catch (error) {
      console.error('Error fetching shops:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shops data. " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoadingShops(false);
    }
  };

  const toggleShopStatus = async (shopId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_active: !currentStatus })
        .eq('id', shopId);

      if (error) throw error;

      await fetchShops();
      toast({
        title: "Success",
        description: `Shop ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating shop status:', error);
      toast({
        title: "Error",
        description: "Failed to update shop status.",
        variant: "destructive",
      });
    }
  };

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

  if (loading || adminCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has admin access
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                You don't have system admin privileges to access this panel. Your email: {user.email}
                <br />
                This panel is only for system administrators, not shop owners.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="flex-1"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              <Button onClick={handleLogout} variant="destructive" className="flex-1">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <Settings className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">System Admin Panel</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-green-600">
            Super Admin
          </Badge>
          <span className="text-sm text-gray-600">Welcome, {profile?.full_name || user.email}</span>
          <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button onClick={handleLogout} variant="destructive" size="sm">
            Logout
          </Button>
        </div>
      </header>

      <div className="p-6">
        <SuperAdminPanel
          shops={shops}
          shopUsers={shopUsers}
          onToggleShopStatus={toggleShopStatus}
          onRefreshShops={fetchShops}
          loadingShops={loadingShops}
        />
      </div>
    </div>
  );
};

export default Admin;
