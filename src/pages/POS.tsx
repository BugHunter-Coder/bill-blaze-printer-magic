import { useState, useEffect } from 'react';
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
import { Loader2, ShoppingCart, Maximize2, Minimize2, X } from 'lucide-react';
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
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [isBrowserFullScreen, setIsBrowserFullScreen] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);

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

    // Show success toast
    toast({
      title: "Added to Cart",
      description: `${p.name} has been added to your cart`,
    });
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

  /* ─────────────────────── FULL SCREEN TOGGLE ───────────────── */
  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter full screen
        await document.documentElement.requestFullscreen();
        setIsBrowserFullScreen(true);
        setIsFullScreen(true);
      } else {
        // Exit full screen
        await document.exitFullscreen();
        setIsBrowserFullScreen(false);
        setIsFullScreen(false);
      }
    } catch (error) {
      console.error('Full screen error:', error);
      // Fallback to app-level full screen if browser full screen fails
      setIsFullScreen(!isFullScreen);
    }
  };

  // Handle full screen change events
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsBrowserFullScreen(!!document.fullscreenElement);
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  // Auto-enter full screen on load
  useEffect(() => {
    const enterFullScreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          setIsBrowserFullScreen(true);
          setIsFullScreen(true);
        }
      } catch (error) {
        console.log('Auto full screen not supported or denied:', error);
        // Keep app-level full screen as fallback
        setIsFullScreen(true);
      }
    };

    // Small delay to ensure page is loaded
    const timer = setTimeout(enterFullScreen, 500);
    return () => clearTimeout(timer);
  }, []);

  // Check orientation on mount and resize
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

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
    <>
      {/* Portrait Mode Warning - completely removed */}
      {/* (Overlay code deleted) */}

      {/* Main POS Container */}
      <div 
        className={`
          ${isFullScreen ? 'fixed inset-0 z-50 bg-white' : 'min-h-screen'} 
          flex flex-col bg-gradient-to-br from-gray-50 to-blue-50
        `}
      >
        {/* Header - hidden in full screen mode */}
        {!isFullScreen && (
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
        )}

        {/* Full Screen Toggle Button */}
        <div className={`${isFullScreen ? 'fixed top-4 right-4 z-50' : 'hidden'}`}>
          <Button
            onClick={toggleFullScreen}
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm shadow-lg"
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Exit Full Screen
          </Button>
        </div>

        {/* Main */}
        <main
          className={`
            flex-1 grid auto-rows-fr
            ${isFullScreen ? 'h-screen' : ''}
            md:[grid-template-columns:1fr_28rem]
            lg:[grid-template-columns:1fr_34rem]
            xl:[grid-template-columns:1fr_40rem]
          `}
          style={{ minHeight: isFullScreen ? '100vh' : `calc(100vh - ${HEADER}px)` }}
        >
          {/* Product grid */}
          <section className="overflow-hidden">
            <div
              className={`
                h-full overflow-y-auto
                p-3 sm:p-4
                grid gap-4
                [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]
                ${isFullScreen ? 'pt-16' : ''}
              `}
            >
              <ProductCatalog onAddToCart={addToCart} onAddProduct={() => {}} />
            </div>
          </section>

          {/* Cart drawer / side-panel */}
          <aside
            id="cartDrawer"
            className="
              bg-white shadow-2xl border-l flex flex-col
              md:sticky md:top-[64px] md:self-start
              md:h-[calc(100vh-64px)]
              md:overflow-hidden
              fixed inset-x-0 bottom-0 max-h-[90vh] h-auto rounded-t-2xl
              translate-y-full md:translate-y-0
              transition-transform duration-300
              data-[open='true']:translate-y-0
              md:relative md:rounded-none
              z-40
            "
            data-open={showMobileCart ? 'true' : undefined}
          >
            {/* Drag Handle */}
            <div className="mx-auto mt-2 mb-1 h-1.5 w-12 rounded-full bg-gray-300 md:hidden" />
            
            {/* Cart Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b md:hidden bg-white sticky top-0 z-10 rounded-t-2xl">
              <h3 className="font-semibold text-gray-900">Cart ({cart.length} items)</h3>
              <div className="flex items-center gap-2">
                <div className="text-sm font-bold text-green-600">₹{total.toFixed(2)}</div>
                <button 
                  onClick={() => setShowMobileCart(false)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  aria-label="Close cart"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 pt-1 space-y-2">
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

            {/* Footer/Payment - sticky bottom */}
            <div className="border-t px-2 py-3 bg-white sticky bottom-0 z-10 rounded-b-2xl">
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

        {/* Semi-transparent overlay for mobile cart */}
        {showMobileCart && (
          <div 
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setShowMobileCart(false)}
          />
        )}

        {/* FAB - Cart Button */}
        <button
          onClick={() => {
            if (cart.length > 0) {
              setShowMobileCart(true);
            }
          }}
          className={`
            md:hidden fixed bottom-4 right-4 z-30
            h-14 w-14 rounded-full bg-blue-600 text-white
            flex items-center justify-center shadow-lg
            transition-all duration-300
            ${pulse ? 'animate-bounce' : ''}
            ${cart.length === 0 ? 'opacity-50' : 'opacity-100 hover:bg-blue-700'}
          `}
          disabled={cart.length === 0}
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

        {/* Mini Cart Preview - Shows briefly when items are added */}
        {cart.length > 0 && !showMobileCart && (
          <div className="md:hidden fixed bottom-20 right-4 z-20 bg-white rounded-lg shadow-lg border p-3 max-w-xs animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">Cart Preview</span>
              <button 
                onClick={() => setShowMobileCart(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                View All
              </button>
            </div>
            <div className="space-y-1">
              {cart.slice(0, 2).map((item) => (
                <div key={item.selectedVariant ? `${item.id}_${item.selectedVariant.id}` : item.id} className="flex items-center justify-between text-xs">
                  <span className="truncate flex-1">{item.name}</span>
                  <span className="font-medium">x{item.quantity}</span>
                </div>
              ))}
              {cart.length > 2 && (
                <div className="text-xs text-gray-500 text-center pt-1 border-t">
                  +{cart.length - 2} more items
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <span className="text-sm font-bold text-green-600">₹{total.toFixed(2)}</span>
              <button 
                onClick={() => setShowMobileCart(true)}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700"
              >
                Checkout
              </button>
            </div>
          </div>
        )}

        {/* Full Screen Toggle Button - Desktop */}
        {!isFullScreen && (
          <div className="fixed top-20 right-4 z-40 md:block hidden">
            <Button
              onClick={toggleFullScreen}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm shadow-lg"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Full Screen
            </Button>
          </div>
        )}

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
    </>
  );
}
