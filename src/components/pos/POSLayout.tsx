import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { Navigate, useNavigate } from 'react-router-dom';
import { ProductGrid } from './ProductGrid';
import { CartPanel } from './CartPanel';
import { MobileCart } from './MobileCart';
import { POSHeader } from './POSHeader';
import { useCart } from './useCart';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function POSLayout() {
  const { user, loading } = useAuth();
  const { selectedShop, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  
  const {
    cart,
    total,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    completeOrder
  } = useCart(selectedShop);

  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);

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

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <POSHeader 
        shopName={selectedShop.name}
        user={user}
        printerConnected={printerConnected}
        onPrinterToggle={setPrinterConnected}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Product Grid */}
        <div className="flex-1 overflow-auto">
          <ProductGrid onAddToCart={addToCart} />
        </div>

        {/* Desktop Cart Panel */}
        <div className="hidden lg:block w-96 border-l border-border bg-card">
          <CartPanel
            cart={cart}
            total={total}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            onCompleteOrder={completeOrder}
            shopDetails={selectedShop}
            printerConnected={printerConnected}
            onPrinterToggle={setPrinterConnected}
          />
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
        onCompleteOrder={completeOrder}
        shopDetails={selectedShop}
        printerConnected={printerConnected}
        onPrinterToggle={setPrinterConnected}
      />
    </div>
  );
}