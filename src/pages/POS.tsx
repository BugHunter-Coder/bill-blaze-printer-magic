import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { ProductCatalog } from '@/components/ProductCatalog';
import { Cart } from '@/components/Cart';
import { BluetoothPrinter } from '@/components/BluetoothPrinter';
import Header from '@/components/Header';
import { Loader2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Product, CartItem } from '@/types/pos';
import MobileCartPopover from './MobileCartPopover';

type Shop = Database['public']['Tables']['shops']['Row'];
const HEADER = 64; // px

export default function POS() {
  const { user, profile, loading, updateProfile } = useAuth();
  const { selectedShop, loading: shopLoading } = useShop();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [printerOK, setPrinterOK] = useState(false);

  /* mobile-only UI state */
  const [drawerOpen, setDrawerOpen] = useState(false); // pop-over visibility
  const [pulse, setPulse] = useState(false);           // FAB bounce anim

  /* ─────────────────────── CART HELPERS ─────────────────────── */
  const addToCart = (p: Product) => {
    setCart(prev => {
      const key = p.selectedVariant ? `${p.id}_${p.selectedVariant.id}` : p.id;
      const found = prev.find(i =>
        i.selectedVariant ? `${i.id}_${i.selectedVariant.id}` === key : i.id === key,
      );
      return found
        ? prev.map(i =>
            (i.selectedVariant ? `${i.id}_${i.selectedVariant.id}` : i.id) === key
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [...prev, { ...p, quantity: 1 }];
    });

    // trigger bounce on FAB
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  };

  const updateQty = (id: string, q: number) =>
    setCart(prev =>
      prev
        .map(i =>
          (i.selectedVariant ? `${i.id}_${i.selectedVariant.id}` : i.id) === id
            ? { ...i, quantity: q }
            : i,
        )
        .filter(i => i.quantity > 0),
    );

  const total = cart.reduce((t, i) => t + i.price * i.quantity, 0);

  /* ─────────────────────── CHECKOUT ─────────────────────────── */
  const completeOrder = async (
    method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other',
    direct?: number,
  ) => {
    if (!user || !selectedShop?.id) return;
    const sub = direct ?? total;
    const tax = sub * (selectedShop.tax_rate || 0);
    const grand = sub + tax;

    try {
      const { data: tx, error } = await supabase
        .from('transactions')
        .insert({
          shop_id: selectedShop.id,
          cashier_id: profile?.id || user.id,
          type: 'sale',
          subtotal: sub,
          tax_amount: tax,
          total_amount: grand,
          payment_method: method,
          is_direct_billing: !!direct,
        })
        .select()
        .single();
      if (error) throw error;

      if (!direct && cart.length) {
        const lines = cart.map(i => ({
          transaction_id: tx.id,
          product_id: i.id,
          product_name: i.name,
          quantity: i.quantity,
          unit_price: i.price,
          total_price: i.price * i.quantity,
        }));
        await supabase.from('transaction_items').insert(lines);

        for (const i of cart) {
          await supabase
            .from('products')
            .update({
              stock_quantity: i.stock_quantity ? i.stock_quantity - i.quantity : 0,
            })
            .eq('id', i.id);
        }
      }

      setCart([]);
      setDrawerOpen(false);
      toast({ description: 'Order completed!' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  /* ─────────────────────── GUARDS ───────────────────────────── */
  if (loading || shopLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Loading…
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  if (!selectedShop)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-4 text-center">
          <p>No company selected</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );

  /* ─────────────────────── LAYOUT ───────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <Header
        user={user}
        onLogout={async () => {
          await supabase.auth.signOut();
          navigate('/auth');
        }}
        onProfileUpdate={updateProfile}
        onOpenManagement={() => {}}
        isPrinterConnected={printerOK}
        onPrinterConnectionChange={setPrinterOK}
        onPrinterChange={() => {}}
      />

      {/* Main */}
      <main
        className="
          flex-1 grid auto-rows-fr
          md:[grid-template-columns:1fr_28rem]
          lg:[grid-template-columns:1fr_34rem]
          xl:[grid-template-columns:1fr_40rem]
        "
        style={{ minHeight: `calc(100vh - ${HEADER}px)` }}
      >
        {/* Product grid */}
        <section className="overflow-hidden">
          <div
            className="
              h-full overflow-y-auto
              p-3 sm:p-4
              grid gap-4
              [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]
            "
          >
            <ProductCatalog onAddToCart={addToCart} onAddProduct={() => {}} />
          </div>
        </section>

        {/* Cart drawer / side-panel */}
        <aside
          id="cartDrawer"
          className="
            bg-white shadow-xl border-l flex flex-col
            md:sticky md:top-[64px] md:self-start
            md:h-[calc(100vh-64px)]
            md:overflow-hidden
            fixed inset-x-0 bottom-0 h-[85vh] rounded-t-2xl
            translate-y-full md:translate-y-0
            transition-transform duration-300
            data-[open='true']:translate-y-0
            md:relative md:rounded-none
          "
          data-open={cart.length > 0 ? 'true' : undefined}
        >
          <div className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-gray-300 md:hidden" />

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <Cart
              items={cart}
              onUpdateQuantity={updateQty}
              onRemoveItem={id =>
                setCart(prev =>
                  prev.filter(
                    i =>
                      (i.selectedVariant ? `${i.id}_${i.selectedVariant.id}` : i.id) !== id,
                  ),
                )
              }
              onClearCart={() => setCart([])}
              total={total}
              shopDetails={selectedShop}
            />
          </div>

          <div className="border-t p-4">
            <BluetoothPrinter
              isConnected={printerOK}
              onConnectionChange={setPrinterOK}
              onPrinterChange={() => {}}
              cart={cart}
              total={total}
              onOrderComplete={completeOrder}
              shopDetails={selectedShop}
            />
          </div>
        </aside>
      </main>

      {/* FAB */}
      <button
        onClick={() => setDrawerOpen(o => !o)}
        className={`
          md:hidden fixed bottom-4 right-4 z-30
          h-14 w-14 rounded-full bg-blue-600 text-white
          flex items-center justify-center shadow-lg
          transition-transform duration-300
          ${pulse ? 'animate-bounce' : ''}
        `}
      >
        <ShoppingCart className="h-6 w-6" />
        {cart.length > 0 && (
          <span
            className="
              absolute -top-1.5 -right-1.5 flex h-6 w-6
              items-center justify-center
              rounded-full bg-red-600 text-xs font-medium
            "
          >
            {cart.length}
          </span>
        )}
      </button>

      {/* Pop-over mini cart */}
      {/* <MobileCartPopover
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cart={cart}
        total={total}
        onUpdateQty={updateQty}
        onRemove={id =>
          setCart(prev =>
            prev.filter(
              i =>
                (i.selectedVariant ? `${i.id}_${i.selectedVariant.id}` : i.id) !== id,
            ),
          )
        }
        onClear={() => setCart([])}
        onGoCheckout={() => {
          setDrawerOpen(false);
          document.getElementById('cartDrawer')?.setAttribute('data-open', 'true');
        }}
      /> */}
    </div>
  );
}
