import { Cart } from '@/components/Cart';
import { CartItem, Shop } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Banknote, 
  Smartphone,
  Building2,
  MoreHorizontal,
  Printer
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CartPanelProps {
  cart: CartItem[];
  total: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCompleteOrder: (method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other', amount?: number) => void;
  shopDetails: Shop;
  printerConnected: boolean;
  onPrinterToggle: (connected: boolean) => void;
}

export function CartPanel({
  cart,
  total,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCompleteOrder,
  shopDetails,
  printerConnected,
  onPrinterToggle
}: CartPanelProps) {
  const taxAmount = total * (shopDetails.tax_rate || 0);
  const grandTotal = total + taxAmount;

  const paymentMethods = [
    { id: 'cash' as const, label: 'Cash Payment', icon: Banknote },
    { id: 'card' as const, label: 'Card Payment', icon: CreditCard },
    { id: 'upi' as const, label: 'UPI Payment', icon: Smartphone },
    { id: 'bank_transfer' as const, label: 'Bank Transfer', icon: Building2 },
  ];

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-card-foreground">Order Summary</h2>
          <Badge variant="outline">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>
      </div>

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

      {cart.length > 0 && (
        <div className="p-4 border-t border-border space-y-4">
          <Card>
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({((shopDetails.tax_rate || 0) * 100).toFixed(1)}%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <Button
                key={method.id}
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => onCompleteOrder(method.id)}
              >
                <method.icon className="h-4 w-4" />
                {method.label}
              </Button>
            ))}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  More Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                <DropdownMenuItem onClick={() => onCompleteOrder('other')}>
                  Other Payment Method
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="pt-2">
            <Button
              variant={printerConnected ? "default" : "outline"}
              size="sm"
              onClick={() => onPrinterToggle(!printerConnected)}
              className="w-full gap-2"
            >
              <Printer className="h-4 w-4" />
              {printerConnected ? 'Printer Connected' : 'Connect Printer'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}