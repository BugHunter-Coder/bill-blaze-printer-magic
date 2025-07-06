import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { Navigate, useNavigate } from 'react-router-dom';
import { ProductGrid } from './ProductGrid';
import { POSHeader } from './POSHeader';
import { useCart } from '@/hooks/useCart';
import { usePOSState } from '@/hooks/usePOSState';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { Cart } from '@/components/Cart';
import { Loader2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { thermalPrinter } from '@/lib/ThermalPrinter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export default function POSLayout() {
  const { user, loading } = useAuth();
  const { selectedShop, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const isPageVisible = usePageVisibility();
  const { toast } = useToast();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  
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
    setPrinterConnected,
  } = usePOSState(selectedShop?.id);

  // Local state for printer device (can't be serialized)
  const [printerDevice, setPrinterDevice] = useState<BluetoothDevice | null>(null);
  const [testPrintLoading, setTestPrintLoading] = useState(false);

  // Sync printerDevice with thermalPrinter singleton
  useEffect(() => {
    if (printerDevice) {
      thermalPrinter.setDevice(printerDevice);
    }
  }, [printerDevice]);

  // On mount, always set printerConnected to false and printerDevice to null
  useEffect(() => {
    setPrinterConnected(false);
    setPrinterDevice(null);
  }, []);

  // On mount and when page becomes visible, check if printer is still connected
  useEffect(() => {
    if (printerDevice && (!printerDevice.gatt || !printerDevice.gatt.connected)) {
      setPrinterConnected(false);
      setPrinterDevice(null);
    }
  }, [isPageVisible]);

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

  const handleTestPrint = async () => {
    setTestPrintLoading(true);
    try {
      // Load bill style from localStorage for this shop
      let billSettings = {
        paperWidth: 35,
        headerAlign: 'center',
        footerAlign: 'center',
        shopName: selectedShop.name,
        address: selectedShop.address || '',
        phone: selectedShop.phone || '',
        thankYou: 'Thank you for your business!',
        visitAgain: 'Visit us again soon.',
        boldShopName: true,
        boldTotal: true,
      };
      let template = 'classic';
      let logoUrl = null;
      const styleKey = `bill_print_style_${selectedShop.id}`;
      const saved = localStorage.getItem(styleKey);
      if (saved) {
        try {
          const style = JSON.parse(saved);
          billSettings = { ...billSettings, ...style };
          template = style.template || 'classic';
          logoUrl = style.logoUrl || null;
        } catch {}
      }
      await thermalPrinter.printReceipt({
        cart: [
          { name: 'Test Item', quantity: 1, price: 10.0 }
        ],
        total: 10.0,
        shopDetails: {
          name: billSettings.shopName,
          address: billSettings.address,
          phone: billSettings.phone,
          tax_rate: 0.05
        },
        template,
        logoUrl
      }, {
        showToast: true,
        autoCut: true,
        paperWidth: billSettings.paperWidth
      });
    } catch (err) {
      // Error will be shown via toast/logs
    } finally {
      setTestPrintLoading(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    // Cart is always visible now, no modal needed
  };

  const handleCheckoutComplete = async (
    method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other',
    directAmount?: number
  ) => {
    try {
      console.log('🛒 Starting checkout process...', { cartLength: cart.length, method, directAmount });
      
      // Calculate amounts
      const subtotal = directAmount || total;
      const taxAmount = subtotal * (selectedShop?.tax_rate || 0);
      const totalAmount = subtotal + taxAmount;

      console.log('🛒 Calculated amounts:', { subtotal, taxAmount, totalAmount });

      // Insert transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          shop_id: selectedShop.id,
          cashier_id: user.id,
          type: 'sale',
          subtotal,
          tax_amount: taxAmount,
          discount_amount: 0,
          total_amount: totalAmount,
          payment_method: method,
          is_direct_billing: !!directAmount,
        })
        .select()
        .single();

      if (transactionError) {
        console.error('❌ Transaction failed:', transactionError);
        toast({ title: 'Transaction Failed', description: transactionError.message, variant: 'destructive' });
        return;
      }

      console.log('✅ Transaction created:', transaction.id);

      // Insert transaction items
      if (!directAmount && cart.length > 0) {
        const transactionItems = cart.map(item => ({
          transaction_id: transaction.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }));
        
        console.log('🛒 Inserting transaction items:', transactionItems.length);
        
        const { error: itemsError } = await supabase
          .from('transaction_items')
          .insert(transactionItems);
          
        if (itemsError) {
          console.error('❌ Transaction items failed:', itemsError);
          toast({ title: 'Transaction Items Failed', description: itemsError.message, variant: 'destructive' });
          return;
        }

        console.log('✅ Transaction items inserted');

        // Update product stock
        for (const item of cart) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ stock_quantity: item.stock_quantity ? item.stock_quantity - item.quantity : 0 })
            .eq('id', item.id);
          if (stockError) {
            console.error('⚠️ Stock update failed for item:', item.id, stockError);
            toast({ title: 'Stock Update Failed', description: stockError.message, variant: 'destructive' });
          }
        }
      }

      console.log('✅ All database operations completed successfully');

      // Clear cart after successful transaction
      console.log('🛒 Clearing cart...', { cartLength: cart.length });
      clearCart();
      console.log('🛒 Cart cleared, closing modal');
      setCartModalOpen(false);
      
      // Force a small delay to ensure state updates
      setTimeout(() => {
        console.log('🛒 Final cart state check:', { cartLength: cart.length });
      }, 100);
      
      toast({ title: 'Order Completed', description: 'Payment processed and cart cleared!' });
    } catch (err: any) {
      console.error('❌ Checkout failed:', err);
      toast({ title: 'Order Failed', description: err.message || String(err), variant: 'destructive' });
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Printer not connected banner */}
      {!printerConnected && (
        <div className="bg-red-50 border-b border-red-200 text-red-800 px-4 py-2 flex items-center gap-2 justify-between">
          <span>
            <b>Bluetooth printer not connected.</b> Please reconnect your printer using the printer icon in the header.
          </span>
          <span className="text-xs text-red-500">(Refreshes or tab changes require reconnection for security.)</span>
        </div>
      )}
      {/* POS Header */}
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

        {/* Cart Sidebar - Desktop only */}
        <div className="hidden lg:flex w-96 border-l border-border bg-card flex-shrink-0">
          <div className="flex-1 flex flex-col h-full">
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
                singleClickMode={true}
                onCompleteOrder={handleCheckoutComplete}
                printerConnected={printerConnected}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button & Modal - Mobile only */}
      <div className="lg:hidden">
        <Button
          size="lg"
          className={`fixed bottom-4 right-4 rounded-full shadow-lg z-[100] h-14 w-14 sm:h-16 sm:w-16 p-0 transition-all duration-300 ${
            cart.length > 0 
              ? 'bg-blue-600 hover:bg-blue-700 scale-110 shadow-xl' 
              : 'bg-gray-400 cursor-not-allowed scale-100'
          }`}
          disabled={cart.length === 0}
          onClick={() => setCartModalOpen((v) => !v)}
          style={{ pointerEvents: cartModalOpen ? 'auto' : 'auto' }}
        >
          <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          {cart.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 sm:h-7 sm:w-7 rounded-full p-0 flex items-center justify-center text-xs font-bold animate-pulse"
            >
              {cart.length}
            </Badge>
          )}
        </Button>

        {/* Cart Modal */}
        <Dialog open={cartModalOpen} onOpenChange={setCartModalOpen}>
          <DialogContent className="w-[95vw] sm:w-[80vw] md:w-[70vw] lg:w-[50vw] xl:w-[40vw] max-w-2xl max-h-[90vh] flex flex-col p-0 z-[99]">
            <DialogHeader className="px-4 pt-4 pb-2 border-b">
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                Cart ({cart.length} items)
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto min-h-0 pb-24">
              <Cart
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onClearCart={clearCart}
                total={total}
                shopDetails={selectedShop}
                compact={true}
                onProceedToCheckout={() => {}}
                singleClickMode={true}
                onCompleteOrder={handleCheckoutComplete}
                printerConnected={printerConnected}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}