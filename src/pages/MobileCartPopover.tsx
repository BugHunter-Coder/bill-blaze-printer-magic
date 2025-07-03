import { useEffect, useRef } from 'react';
import { Cart } from '@/components/Cart';
import { CartItem } from '@/types/pos';

interface Props {
  open: boolean;
  onClose(): void;
  cart: CartItem[];
  total: number;
  onUpdateQty: (id: string, q: number) => void;
  onRemove: (id: string) => void;
  onClear(): void;
  onGoCheckout(): void;
}

/**
 * ✔︎ Appears above the FAB on small devices
 * ✔︎ Closes on outside-click
 * ✔︎ Lets user jump to full checkout drawer
 */
export default function MobileCartPopover({
  open,
  onClose,
  cart,
  total,
  onUpdateQty,
  onRemove,
  onClear,
  onGoCheckout,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  /* close when clicking outside */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    window.addEventListener('mousedown', handle);
    return () => window.removeEventListener('mousedown', handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="
        fixed bottom-24 right-4 z-40
        w-[92vw] max-w-xs
        bg-white border rounded-xl shadow-2xl
        flex flex-col
      "
      style={{ maxHeight: '65vh' }}
    >
      <div className="flex-1 overflow-y-auto p-3">
      <Cart
        items={cart}
        onUpdateQuantity={onUpdateQty}
        onRemoveItem={onRemove}
        onClearCart={onClear}
        total={total}
        shopDetails={{ name: '', tax_rate: 0.18 } as any} // Minimal shop details for mobile
        compact
      />
      </div>

      <button
        onClick={() => {
          onClose();
          onGoCheckout();
        }}
        className="w-full rounded-b-xl bg-blue-600 py-3 text-white font-semibold"
      >
        Go to Checkout
      </button>
    </div>
  );
}
