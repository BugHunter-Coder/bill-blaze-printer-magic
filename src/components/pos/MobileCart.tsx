import { CartItem, Shop } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { BluetoothPrinter } from '@/components/BluetoothPrinter';
import { Cart } from '@/components/Cart';

interface MobileCartProps {
  cart: CartItem[];
  total: number;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCompleteOrder: (method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other', amount?: number) => Promise<void>;
  shopDetails: Shop;
  printerConnected: boolean;
  onPrinterToggle: (connected: boolean) => void;
  onPrinterChange: (device: BluetoothDevice | null) => void;
}

export function MobileCart({
  cart,
  total,
  isOpen,
  onToggle,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCompleteOrder,
  shopDetails,
  printerConnected,
  onPrinterToggle,
  onPrinterChange
}: MobileCartProps) {
  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-4 right-4 rounded-full shadow-lg gap-2 z-50"
            disabled={cart.length === 0}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Cart</span>
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {cart.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <SheetTitle>Your Cart</SheetTitle>
                <Badge variant="outline">
                  ₹{total.toFixed(2)}
                </Badge>
              </div>
            </SheetHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Cart Items */}
              <div className="flex-1 overflow-auto">
                <Cart
                  items={cart}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                  onClearCart={onClearCart}
                  total={total}
                  shopDetails={shopDetails}
                  compact
                />
              </div>
              
              {/* Checkout */}
              <div className="flex-shrink-0 border-t border-border">
                <BluetoothPrinter
                  isConnected={printerConnected}
                  onConnectionChange={onPrinterToggle}
                  onPrinterChange={onPrinterChange}
                  cart={cart}
                  total={total}
                  onOrderComplete={async (method, amount) => {
                    await onCompleteOrder(method, amount);
                    onToggle(false);
                  }}
                  shopDetails={shopDetails}
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}