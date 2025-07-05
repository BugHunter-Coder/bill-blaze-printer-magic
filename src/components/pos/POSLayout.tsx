import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { Navigate, useNavigate } from 'react-router-dom';
import { ProductGrid } from './ProductGrid';
import { MobileCart } from './MobileCart';
import { POSHeader } from './POSHeader';
import { useCart } from '@/hooks/useCart';
import { usePOSState } from '@/hooks/usePOSState';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { BluetoothPrinter } from '@/components/BluetoothPrinter';
import { Cart } from '@/components/Cart';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';
import { useToast } from '@/hooks/use-toast';

export default function POSLayout() {
  const { user, loading } = useAuth();
  const { selectedShop, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const isPageVisible = usePageVisibility();
  const { toast } = useToast();
  
  const {
    cart,
    total,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    completeOrder
  } = useCart(selectedShop);

  // Use persistent state for session data
  const {
    printerConnected,
    checkoutModalOpen,
    mobileCartOpen,
    setPrinterConnected,
    setCheckoutModalOpen,
    setMobileCartOpen,
  } = usePOSState(selectedShop?.id);

  // Local state for printer device (can't be serialized)
  const [printerDevice, setPrinterDevice] = useState<BluetoothDevice | null>(null);

  // Handle page visibility changes
  useEffect(() => {
    if (isPageVisible) {
      // Page became visible - could trigger any necessary refreshes
      console.log('POS page became visible');
    } else {
      // Page became hidden - ensure state is saved
      console.log('POS page became hidden');
    }
  }, [isPageVisible]);

  if (loading || shopLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading POS...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  
  if (!selectedShop) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">No Shop Selected</h2>
          <p className="text-muted-foreground">Please select a shop to continue</p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutModalOpen(true);
  };

  const handleCheckoutComplete = async (
    paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other',
    directAmount?: number
  ) => {
    await completeOrder(paymentMethod, directAmount);
    setCheckoutModalOpen(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <POSHeader 
        shopName={selectedShop.name}
        user={user}
        printerConnected={printerConnected}
        onPrinterToggle={setPrinterConnected}
        onPrinterChange={setPrinterDevice}
        printerDevice={printerDevice}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 overflow-auto">
          <ProductGrid onAddToCart={addToCart} />
        </div>

        {/* Desktop Cart Only (no payment section here) */}
        <div className="hidden lg:flex w-96 border-l border-border bg-card">
          <div className="flex-1 flex flex-col">
            {/* Cart Items */}
            <div className="flex-1 overflow-hidden">
              <Cart
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onClearCart={clearCart}
                total={total}
                shopDetails={selectedShop}
                compact={false}
                onProceedToCheckout={handleProceedToCheckout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cart */}
      <MobileCart
        cart={cart}
        total={total}
        isOpen={mobileCartOpen}
        onToggle={setMobileCartOpen}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onCompleteOrder={handleCheckoutComplete}
        shopDetails={selectedShop}
        printerConnected={printerConnected}
        onPrinterToggle={setPrinterConnected}
        onPrinterChange={setPrinterDevice}
      />

      {/* Payment Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        cart={cart}
        total={total}
        shopDetails={selectedShop}
        onCompleteOrder={handleCheckoutComplete}
        printerConnected={printerConnected}
        onPrinterChange={setPrinterDevice}
        printerDevice={printerDevice}
        toast={toast}
      />
    </div>
  );
}