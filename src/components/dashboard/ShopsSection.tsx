
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShopsSectionProps {
  shops: any[];
  selectedShop: any;
  setSelectedShop: (shop: any) => void;
  setShops: (shops: any[]) => void;
}

export const ShopsSection = ({ shops, selectedShop, setSelectedShop, setShops }: ShopsSectionProps) => {
  const [isApiKeyCopied, setIsApiKeyCopied] = useState(false);
  const [isShopActive, setIsShopActive] = useState(true);
  const { toast } = useToast();

  const handleShopSelect = (shopId: string) => {
    const shop = shops.find(shop => shop.id === shopId);
    setSelectedShop(shop);
    setIsShopActive(shop?.is_active ?? true);
  };

  const handleApiKeyCopy = () => {
    navigator.clipboard.writeText(selectedShop?.api_key || 'No API Key');
    setIsApiKeyCopied(true);
    setTimeout(() => setIsApiKeyCopied(false), 2000);
  };

  const handleShopActiveToggle = async (checked: boolean) => {
    if (!selectedShop) return;

    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_active: checked })
        .eq('id', selectedShop.id);

      if (error) throw error;

      setIsShopActive(checked);
      setShops(shops.map(shop => shop.id === selectedShop.id ? { ...shop, is_active: checked } : shop));
      setSelectedShop({ ...selectedShop, is_active: checked });
      toast({
        title: "Success",
        description: `Shop ${checked ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error: any) {
      setIsShopActive(!checked);
      toast({
        title: "Error",
        description: "Failed to update shop status.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select onValueChange={handleShopSelect} defaultValue={selectedShop?.id}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a shop" />
          </SelectTrigger>
          <SelectContent>
            {shops.map((shop) => (
              <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedShop && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedShop.name}</h3>
              <Badge variant={selectedShop.is_active ? "default" : "secondary"}>
                {selectedShop.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p>Address: {selectedShop.address || 'Not provided'}</p>
            <p>Phone: {selectedShop.phone || 'Not provided'}</p>
            <p>Email: {selectedShop.email || 'Not provided'}</p>
            <p>Tax Rate: {((selectedShop.tax_rate || 0) * 100).toFixed(2)}%</p>

            <div className="flex items-center space-x-2">
              <Label htmlFor="shop-active">Shop Active</Label>
              <Switch
                id="shop-active"
                checked={isShopActive}
                onCheckedChange={handleShopActiveToggle}
              />
            </div>

            <div className="mt-4">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={selectedShop.api_key || 'No API Key'}
                  readOnly
                  className="pr-10"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={handleApiKeyCopy}
                  disabled={isApiKeyCopied}
                >
                  {isApiKeyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
