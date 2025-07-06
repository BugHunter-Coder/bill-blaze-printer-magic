import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export const ProfileDebug = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { shops, refreshShops, refreshShopAccess } = useShop();

  const handleCreateShop = async () => {
    if (!user) return;
    
    try {
      // Create a test shop
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          name: 'Test Shop',
          owner_id: user.id,
          is_active: true,
        })
        .select()
        .single();

      if (shopError) throw shopError;

      // Update profile with shop_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          shop_id: shop.id, 
          role: 'admin' 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await refreshProfile();
      await refreshShops();
      
      console.log('Shop created and profile updated:', { shop, profileError });
    } catch (error) {
      console.error('Error creating shop:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: 'Test User',
          role: 'admin'
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      console.log('Profile updated');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const activeShops = shops.filter(s => s.is_active);
  const inactiveShops = shops.filter(s => !s.is_active);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile & Shop Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">User Info</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Profile Info</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Shops Summary</h3>
          <div className="text-sm space-y-1">
            <p><strong>Total Shops:</strong> {shops.length}</p>
            <p><strong>Active Shops:</strong> {activeShops.length}</p>
            <p><strong>Inactive Shops:</strong> {inactiveShops.length}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">All Shops</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(shops, null, 2)}
          </pre>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleCreateShop} variant="outline">
            Create Test Shop
          </Button>
          <Button onClick={handleUpdateProfile} variant="outline">
            Update Profile
          </Button>
          <Button onClick={refreshProfile} variant="outline">
            Refresh Profile
          </Button>
          <Button onClick={refreshShops} variant="outline">
            Refresh Shops
          </Button>
          <Button onClick={refreshShopAccess} variant="outline">
            Refresh Access
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 