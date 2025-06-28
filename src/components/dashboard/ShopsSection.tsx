import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, Store } from 'lucide-react';
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

  // Show empty state if no shops
  if (shops.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shop Management</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Shops Found</h3>
          <p className="text-gray-500 mb-4">
            Create your first shop to get started with your POS system.
          </p>
          <p className="text-sm text-gray-400">
            Use the "Create New Shop" section below to set up your shop.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shop-select">Select Shop</Label>
          <Select onValueChange={handleShopSelect} value={selectedShop?.id || ''}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a shop to manage" />
            </SelectTrigger>
            <SelectContent>
              {shops.map((shop) => (
                <SelectItem key={shop.id} value={shop.id}>
                  <div className="flex items-center">
                    <span>{shop.name}</span>
                    {!shop.is_active && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedShop && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedShop.name}</h3>
              <Badge variant={selectedShop.is_active ? "default" : "secondary"}>
                {selectedShop.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div><strong>Address:</strong> {selectedShop.address || 'Not provided'}</div>
              <div><strong>Phone:</strong> {selectedShop.phone || 'Not provided'}</div>
              <div><strong>Email:</strong> {selectedShop.email || 'Not provided'}</div>
              <div><strong>Tax Rate:</strong> {((selectedShop.tax_rate || 0) * 100).toFixed(2)}%</div>
              <div><strong>Currency:</strong> {selectedShop.currency || 'INR'}</div>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="shop-active">Shop Status</Label>
              <Switch
                id="shop-active"
                checked={isShopActive}
                onCheckedChange={handleShopActiveToggle}
              />
              <span className="text-sm text-gray-500">
                {isShopActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type="password"
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
              <p className="text-xs text-gray-500">
                Use this API key for integrations and external services
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
