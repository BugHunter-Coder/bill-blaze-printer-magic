import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Store, Loader2 } from 'lucide-react';
import { useShop } from '@/hooks/useShop';

export const GlobalShopSelector = () => {
  const { shops, selectedShop, selectedShopId, loading, setSelectedShopId } = useShop();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-600">Loading shops...</span>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <Store className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600">No shops available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <Store className="h-4 w-4 text-blue-600" />
      <div>
        <Label className="text-xs font-medium text-gray-600">Company</Label>
        <Select value={selectedShopId || ''} onValueChange={setSelectedShopId}>
          <SelectTrigger className="w-48 h-8 text-sm">
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            {shops.map((shop) => (
              <SelectItem key={shop.id} value={shop.id}>
                {shop.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedShop && (
        <div className="text-xs text-gray-500">
          {selectedShop.name}
        </div>
      )}
    </div>
  );
}; 