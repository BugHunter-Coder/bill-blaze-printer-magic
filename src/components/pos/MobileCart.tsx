import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';

interface MobileCartProps {
  cart: any[];
  total: number;
  onOpenCheckout: () => void;
}

export function MobileCart({
  cart,
  total,
  onOpenCheckout
}: MobileCartProps) {
  return (
    <Button
      size="lg"
      className="fixed bottom-4 right-4 rounded-full shadow-lg gap-2 z-50 lg:hidden"
      disabled={cart.length === 0}
      onClick={onOpenCheckout}
    >
      <ShoppingCart className="h-5 w-5" />
      <span>Cart</span>
      {cart.length > 0 && (
        <Badge variant="secondary" className="ml-1">
          {cart.length}
        </Badge>
      )}
    </Button>
  );
}