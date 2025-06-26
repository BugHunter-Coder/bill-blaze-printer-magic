
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CreateShopSectionProps {
  shops: any[];
  setShops: (shops: any[]) => void;
}

export const CreateShopSection = ({ shops, setShops }: CreateShopSectionProps) => {
  const { user, refreshProfile } = useAuth();
  const [newShopName, setNewShopName] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopEmail, setNewShopEmail] = useState('');
  const [newShopTaxRate, setNewShopTaxRate] = useState(8);
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const { toast } = useToast();

  const handleCreateShop = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a shop.",
        variant: "destructive",
      });
      return;
    }

    if (!newShopName.trim()) {
      toast({
        title: "Error",
        description: "Shop name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingShop(true);
    try {
      // Create the shop
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .insert([{
          name: newShopName,
          address: newShopAddress || null,
          phone: newShopPhone || null,
          email: newShopEmail || null,
          tax_rate: newShopTaxRate / 100, // Convert percentage to decimal
          owner_id: user.id,
          is_active: true,
        }])
        .select('*')
        .single();

      if (shopError) throw shopError;

      // Update the user's profile with the shop_id and admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          shop_id: shopData.id, 
          role: 'admin' 
        })
        .eq('id', user.id);

      if (profileError) {
        console.warn('Profile update error:', profileError);
        // Don't throw here as the shop was created successfully
      }

      // Update local state
      setShops([...shops, shopData]);
      
      // Clear form
      setNewShopName('');
      setNewShopAddress('');
      setNewShopPhone('');
      setNewShopEmail('');
      setNewShopTaxRate(8);
      
      // Refresh user profile
      await refreshProfile();
      
      toast({
        title: "Success",
        description: "Shop created successfully! You are now the shop administrator.",
      });
    } catch (error: any) {
      console.error('Error creating shop:', error);
      toast({
        title: "Error",
        description: "Failed to create shop: " + (error.message || 'Unknown error'),
        variant: "destructive",
      });
    } finally {
      setIsCreatingShop(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Create New Shop</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-shop-name">Shop Name *</Label>
            <Input
              id="new-shop-name"
              type="text"
              value={newShopName}
              onChange={(e) => setNewShopName(e.target.value)}
              placeholder="Enter shop name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-shop-address">Shop Address</Label>
            <Input
              id="new-shop-address"
              type="text"
              value={newShopAddress}
              onChange={(e) => setNewShopAddress(e.target.value)}
              placeholder="Enter shop address"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-shop-phone">Shop Phone</Label>
            <Input
              id="new-shop-phone"
              type="text"
              value={newShopPhone}
              onChange={(e) => setNewShopPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-shop-email">Shop Email</Label>
            <Input
              id="new-shop-email"
              type="email"
              value={newShopEmail}
              onChange={(e) => setNewShopEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-shop-tax-rate">Shop Tax Rate (%)</Label>
          <Input
            id="new-shop-tax-rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={newShopTaxRate}
            onChange={(e) => setNewShopTaxRate(parseFloat(e.target.value) || 0)}
            placeholder="Enter tax rate"
          />
        </div>
        <Button 
          onClick={handleCreateShop} 
          disabled={isCreatingShop || !newShopName.trim()}
          className="w-full"
        >
          {isCreatingShop ? 'Creating Shop...' : 'Create Shop'}
        </Button>
      </CardContent>
    </Card>
  );
};
