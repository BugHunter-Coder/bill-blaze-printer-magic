import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductCatalog } from './ProductCatalog';
import { Cart } from './Cart';
import { BluetoothPrinter } from './BluetoothPrinter';
import { Product, CartItem, Shop, Transaction } from '@/types/pos';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, ShoppingCart } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';

interface POSInterfaceProps {
  shopDetails: Shop;
  onOpenManagement?: () => void;
  isPrinterConnected?: boolean;
  onPrinterConnectionChange?: (isConnected: boolean) => void;
  onPrinterChange?: (device: BluetoothDevice | null) => void;
  printerDevice?: BluetoothDevice | null;
}

export const POSInterface = ({ 
  shopDetails, 
  onOpenManagement,
  isPrinterConnected = false,
  onPrinterConnectionChange,
  onPrinterChange,
  printerDevice,
}: POSInterfaceProps) => {
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Clear cart when shop changes
  useEffect(() => {
    setCartItems([]);
  }, [shopDetails.id]);

  const handleAddProduct = () => {
    if (onOpenManagement) {
      onOpenManagement();
    }
  };

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      // Create a unique identifier for the cart item
      // If product has a selected variant, use product_id + variant_id
      // Otherwise, just use the product_id
      const cartItemId = product.selectedVariant 
        ? `${product.id}_${product.selectedVariant.id}`
        : product.id;
      
      const existingItem = prev.find(item => {
        const itemId = item.selectedVariant 
          ? `${item.id}_${item.selectedVariant.id}`
          : item.id;
        return itemId === cartItemId;
      });
      
      if (existingItem) {
        return prev.map(item => {
          const itemId = item.selectedVariant 
            ? `${item.id}_${item.selectedVariant.id}`
            : item.id;
          return itemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item;
        });
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(prev =>
      prev.map(item => {
        const itemId = item.selectedVariant 
          ? `${item.id}_${item.selectedVariant.id}`
          : item.id;
        return itemId === id ? { ...item, quantity } : item;
      })
    );
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => {
      const itemId = item.selectedVariant 
        ? `${item.id}_${item.selectedVariant.id}`
        : item.id;
      return itemId !== id;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleOrderComplete = async (paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other', directAmount?: number) => {
    console.log('🔍 DEBUG: handleOrderComplete called with:', { paymentMethod, directAmount });
    console.log('🔍 DEBUG: User state:', { user: !!user, userId: user?.id });
    console.log('🔍 DEBUG: Shop state:', { shopId: shopDetails?.id, shopName: shopDetails?.name });
    console.log('🔍 DEBUG: Cart state:', { cartItems: cartItems.length, cartTotal: calculateTotal() });

    if (!user || !shopDetails?.id) {
      console.error('❌ DEBUG: Order failed - missing user or shop:', { user: !!user, shopId: shopDetails?.id });
      toast({
        title: "Error",
        description: "User not authenticated or no shop selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const subtotal = directAmount || calculateTotal();
      const taxAmount = subtotal * (shopDetails.tax_rate || 0);
      const totalAmount = subtotal + taxAmount;

      console.log('🔍 DEBUG: Calculated amounts:', { subtotal, taxAmount, totalAmount, taxRate: shopDetails.tax_rate });

      // Create transaction
      console.log('🔍 DEBUG: Creating transaction...');
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          shop_id: shopDetails.id,
          cashier_id: user.id,
          type: 'sale',
          subtotal,
          tax_amount: taxAmount,
          discount_amount: 0,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          is_direct_billing: !!directAmount,
        })
        .select()
        .single();

      if (transactionError) {
        console.error('❌ DEBUG: Transaction creation failed:', transactionError);
        throw transactionError;
      }

      console.log('✅ DEBUG: Transaction created successfully:', transaction);

      // Create transaction items (if not direct billing)
      if (!directAmount && cartItems.length > 0) {
        console.log('🔍 DEBUG: Creating transaction items...');
        const transactionItems = cartItems.map(item => ({
          transaction_id: transaction.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }));

        console.log('🔍 DEBUG: Transaction items to insert:', transactionItems);

        const { error: itemsError } = await supabase
          .from('transaction_items')
          .insert(transactionItems);

        if (itemsError) {
          console.error('❌ DEBUG: Transaction items creation failed:', itemsError);
          throw itemsError;
        }

        console.log('✅ DEBUG: Transaction items created successfully');

        // Update product stock
        console.log('🔍 DEBUG: Updating product stock...');
        for (const item of cartItems) {
          console.log('🔍 DEBUG: Updating stock for item:', { id: item.id, name: item.name, currentStock: item.stock_quantity, quantity: item.quantity });
          const { error: stockError } = await supabase
            .from('products')
            .update({ 
              stock_quantity: item.stock_quantity ? item.stock_quantity - item.quantity : 0 
            })
            .eq('id', item.id);

          if (stockError) {
            console.error('❌ DEBUG: Stock update error for item', item.id, ':', stockError);
          } else {
            console.log('✅ DEBUG: Stock updated for item:', item.id);
          }
        }
      }

      // Clear cart after successful transaction
      console.log('🔍 DEBUG: Clearing cart...');
      clearCart();

      console.log('✅ DEBUG: Order completed successfully!');
      toast({
        title: "Success",
        description: "Order completed successfully!",
      });

    } catch (error: any) {
      console.error('❌ DEBUG: Order completion error:', error);
      console.error('❌ DEBUG: Error details:', { message: error.message, code: error.code, details: error.details });
      throw error;
    }
  };

  return (
    <div className="relative h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-hidden">
      {/* Main Responsive Layout */}
      <div className="flex flex-col-reverse md:flex-row h-screen w-full min-w-0 overflow-x-hidden">
        {/* Product Catalog - always visible */}
        <div className="flex-1 min-w-0 h-full">
          <ProductCatalog onAddToCart={addToCart} onAddProduct={handleAddProduct} />
        </div>

        {/* Cart & Payment - Desktop/Tablet */}
        <div className="hidden md:flex flex-col h-screen w-full md:w-64 lg:w-80 xl:w-96 2xl:w-[420px] bg-white border-l border-gray-200 shadow-xl min-w-0">
          <Cart
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            total={calculateTotal()}
            shopDetails={shopDetails}
          />
          <div className="flex-shrink-0">
            <BluetoothPrinter
              isConnected={isPrinterConnected}
              onConnectionChange={onPrinterConnectionChange}
              onPrinterChange={onPrinterChange}
              cart={cartItems}
              total={calculateTotal()}
              onOrderComplete={handleOrderComplete}
              shopDetails={shopDetails}
            />
          </div>
        </div>
      </div>

      {/* Mobile Cart/Payment Drawer */}
      <Drawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
        <DrawerTrigger asChild>
          <button
            className="fixed bottom-5 right-5 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg p-4 flex items-center md:hidden"
            aria-label="Open Cart"
            onClick={() => setCartDrawerOpen(true)}
          >
            <ShoppingCart className="h-6 w-6 mr-2" />
            <span className="font-bold">Cart</span>
            {cartItems.length > 0 && (
              <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">{cartItems.length}</span>
            )}
          </button>
        </DrawerTrigger>
        <DrawerContent className="md:hidden max-h-[90vh] rounded-t-2xl p-0 overflow-y-auto">
          <div className="p-2">
            <Cart
              items={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onClearCart={clearCart}
              total={calculateTotal()}
              shopDetails={shopDetails}
            />
            <div className="mt-2">
              <BluetoothPrinter
                isConnected={isPrinterConnected}
                onConnectionChange={onPrinterConnectionChange}
                onPrinterChange={onPrinterChange}
                cart={cartItems}
                total={calculateTotal()}
                onOrderComplete={handleOrderComplete}
                shopDetails={shopDetails}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
