
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Store, Users, Settings, AlertCircle, ArrowLeft } from 'lucide-react';
import { Shop, UserProfile } from '@/types/pos';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      
      // Enhanced admin check - multiple ways to verify admin access
      const isAdminUser = 
        profile?.role === 'admin' || 
        user?.email === 'admin@billblaze.com' ||
        user?.email === 'harjot@iprofit.in' ||
        user?.email?.toLowerCase().includes('admin');
      
      console.log('Admin check result:', isAdminUser);
      setIsAdmin(isAdminUser);
      
      if (isAdminUser) {
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
      
      // Admin can see all shops - use service_role or bypass RLS if needed
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Shops query result:', { shopsData, shopsError });

      if (shopsError) {
        console.error('Error fetching shops:', shopsError);
        // If normal query fails, try with a different approach
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
                You don't have admin privileges to access this panel. Your email: {user.email}
                <br />
                Your role: {profile?.role || 'No role assigned'}
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
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-green-600">
            Admin Access
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Shop Management</h2>
            <Button onClick={fetchShops} variant="outline" disabled={loadingShops}>
              {loadingShops ? 'Loading...' : 'Refresh Shops'}
            </Button>
          </div>
          
          {loadingShops ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading shops...</span>
            </div>
          ) : shops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shops.map((shop) => (
                <Card key={shop.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <Store className="h-5 w-5 mr-2 text-blue-600" />
                        {shop.name}
                      </CardTitle>
                      <Badge variant={shop.is_active ? "default" : "secondary"}>
                        {shop.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <p><strong>Address:</strong> {shop.address || 'Not provided'}</p>
                      <p><strong>Phone:</strong> {shop.phone || 'Not provided'}</p>
                      <p><strong>Email:</strong> {shop.email || 'Not provided'}</p>
                      <p><strong>Tax Rate:</strong> {((shop.tax_rate || 0) * 100).toFixed(2)}%</p>
                      <p><strong>Owner ID:</strong> {shop.owner_id || 'Not assigned'}</p>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{shopUsers[shop.id]?.length || 0} users</span>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleShopStatus(shop.id, shop.is_active || false)}
                      >
                        {shop.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500">
                      Created: {new Date(shop.created_at || '').toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Store className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No shops found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No shops have been created yet or there may be permission issues.
              </p>
              <div className="mt-4 space-x-2">
                <Button onClick={fetchShops} variant="outline">
                  Try Again
                </Button>
                <Button onClick={() => navigate('/dashboard')} variant="default">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
