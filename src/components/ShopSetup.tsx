
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Store } from 'lucide-react';
import { CURRENCIES } from '@/types/pos';
import { toast } from 'sonner';

interface ShopSetupProps {
  onShopCreated: () => void;
}

const ShopSetup = ({ onShopCreated }: ShopSetupProps) => {
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [shopData, setShopData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    tax_id: '',
    currency: 'USD',
    tax_rate: 0.08,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Create the shop
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          owner_id: user.id,
          ...shopData,
        })
        .select()
        .single();

      if (shopError) throw shopError;

      // Update the user's profile with the shop_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ shop_id: shop.id, role: 'admin' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Shop created successfully!');
      await refreshProfile();
      onShopCreated();
    } catch (error: any) {
      console.error('Error creating shop:', error);
      toast.error(error.message || 'Failed to create shop');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Store className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Setup Your Shop</CardTitle>
          <CardDescription>
            Configure your shop details to get started with your POS system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shop-name">Shop Name *</Label>
                <Input
                  id="shop-name"
                  placeholder="Enter shop name"
                  value={shopData.name}
                  onChange={(e) => setShopData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shop-phone">Phone</Label>
                <Input
                  id="shop-phone"
                  placeholder="Enter phone number"
                  value={shopData.phone}
                  onChange={(e) => setShopData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shop-address">Address</Label>
              <Textarea
                id="shop-address"
                placeholder="Enter shop address"
                value={shopData.address}
                onChange={(e) => setShopData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shop-email">Email</Label>
                <Input
                  id="shop-email"
                  type="email"
                  placeholder="Enter shop email"
                  value={shopData.email}
                  onChange={(e) => setShopData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shop-tax-id">Tax ID</Label>
                <Input
                  id="shop-tax-id"
                  placeholder="Enter tax ID"
                  value={shopData.tax_id}
                  onChange={(e) => setShopData(prev => ({ ...prev, tax_id: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shop-currency">Currency</Label>
                <Select
                  value={shopData.currency}
                  onValueChange={(value) => setShopData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.name} ({currency.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shop-tax-rate">Tax Rate (%)</Label>
                <Input
                  id="shop-tax-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="8.00"
                  value={shopData.tax_rate * 100}
                  onChange={(e) => setShopData(prev => ({ 
                    ...prev, 
                    tax_rate: parseFloat(e.target.value) / 100 
                  }))}
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Shop...' : 'Create Shop'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopSetup;
