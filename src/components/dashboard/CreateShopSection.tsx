
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateShopSectionProps {
  shops: any[];
  setShops: (shops: any[]) => void;
}

export const CreateShopSection = ({ shops, setShops }: CreateShopSectionProps) => {
  const [newShopName, setNewShopName] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopEmail, setNewShopEmail] = useState('');
  const [newShopTaxRate, setNewShopTaxRate] = useState(0);
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const { toast } = useToast();

  const handleCreateShop = async () => {
    setIsCreatingShop(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .insert([{
          name: newShopName,
          address: newShopAddress,
          phone: newShopPhone,
          email: newShopEmail,
          tax_rate: newShopTaxRate,
          is_active: true,
        }])
        .select('*');

      if (error) throw error;

      setShops([...shops, data[0]]);
      setNewShopName('');
      setNewShopAddress('');
      setNewShopPhone('');
      setNewShopEmail('');
      setNewShopTaxRate(0);
      setIsCreatingShop(false);
      toast({
        title: "Success",
        description: "Shop created successfully.",
      });
    } catch (error: any) {
      setIsCreatingShop(false);
      toast({
        title: "Error",
        description: "Failed to create shop. " + error.message,
        variant: "destructive",
      });
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
            <Label htmlFor="new-shop-name">Shop Name</Label>
            <Input
              id="new-shop-name"
              type="text"
              value={newShopName}
              onChange={(e) => setNewShopName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-shop-address">Shop Address</Label>
            <Input
              id="new-shop-address"
              type="text"
              value={newShopAddress}
              onChange={(e) => setNewShopAddress(e.target.value)}
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-shop-email">Shop Email</Label>
            <Input
              id="new-shop-email"
              type="email"
              value={newShopEmail}
              onChange={(e) => setNewShopEmail(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-shop-tax-rate">Shop Tax Rate (%)</Label>
          <Input
            id="new-shop-tax-rate"
            type="number"
            value={newShopTaxRate.toString()}
            onChange={(e) => setNewShopTaxRate(parseFloat(e.target.value))}
          />
        </div>
        <Button onClick={handleCreateShop} disabled={isCreatingShop}>
          {isCreatingShop ? 'Creating...' : 'Create Shop'}
        </Button>
      </CardContent>
    </Card>
  );
};
