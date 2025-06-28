import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Store, Building2 } from 'lucide-react';
import { useShop } from '@/hooks/useShop';

export const GlobalShopSelector = () => {
  const { shops, selectedShop, selectedShopId, setSelectedShopId, loading } = useShop();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <Store className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!selectedShop) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <Store className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-500">No shops</span>
      </div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-blue-50 transition-colors max-w-xs truncate"
          aria-label="Select company"
        >
          <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span className="font-medium truncate max-w-[120px]">{selectedShop.name}</span>
          {selectedShop.currency && (
            <Badge variant="outline" className="text-xs border-green-300 text-green-700 ml-1">
              {selectedShop.currency}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {shops.map((shop) => (
          <DropdownMenuItem
            key={shop.id}
            onClick={() => {
              setSelectedShopId(shop.id);
              setOpen(false);
            }}
            className={
              'flex items-center space-x-2 cursor-pointer ' +
              (shop.id === selectedShopId ? 'bg-blue-100 text-blue-700' : '')
            }
          >
            <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="font-medium truncate max-w-[120px]">{shop.name}</span>
            {shop.currency && (
              <Badge variant="outline" className="text-xs border-green-300 text-green-700 ml-1">
                {shop.currency}
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 