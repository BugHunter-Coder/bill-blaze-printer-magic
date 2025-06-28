import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductCatalog } from './ProductCatalog';
import { Cart } from './Cart';
import { BluetoothPrinter } from './BluetoothPrinter';
import { Product, CartItem, Shop, Transaction } from '@/types/pos';

interface POSInterfaceProps {
  shopDetails: Shop;
  onOpenManagement?: () => void;
}

export const POSInterface = ({ shopDetails, onOpenManagement }: POSInterfaceProps) => {
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [printerDevice, setPrinterDevice] = useState<BluetoothDevice | null>(null);
  const { toast } = useToast();

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
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
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
      prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleOrderComplete = async (paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other', directAmount?: number) => {
    if (!user || !shopDetails?.id) {
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

      // Create transaction
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

      if (transactionError) throw transactionError;

      // Create transaction items (if not direct billing)
      if (!directAmount && cartItems.length > 0) {
        const transactionItems = cartItems.map(item => ({
          transaction_id: transaction.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('transaction_items')
          .insert(transactionItems);

        if (itemsError) throw itemsError;

        // Update product stock
        for (const item of cartItems) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ 
              stock_quantity: item.stock_quantity ? item.stock_quantity - item.quantity : 0 
            })
            .eq('id', item.id);

          if (stockError) {
            console.error('Stock update error:', stockError);
          }
        }
      }

      // Clear cart after successful transaction
      clearCart();

      toast({
        title: "Success",
        description: "Order completed successfully!",
      });

    } catch (error: any) {
      console.error('Order completion error:', error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-140px)]">
      {/* Left Panel - Products */}
      <div className="flex-1 lg:flex-[2] p-4 bg-white border-r">
        <ProductCatalog onAddToCart={addToCart} shopId={shopDetails.id} onOpenManagement={handleAddProduct} />
      </div>

      {/* Right Panel - Cart and Checkout */}
      <div className="w-full lg:w-96 flex flex-col bg-gray-50">
        <Cart
          items={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          total={calculateTotal()}
          shopDetails={shopDetails}
        />
        
        <BluetoothPrinter
          isConnected={isConnected}
          onConnectionChange={setIsConnected}
          onPrinterChange={setPrinterDevice}
          cart={cartItems}
          total={calculateTotal()}
          onOrderComplete={handleOrderComplete}
          shopDetails={shopDetails}
        />
      </div>
    </div>
  );
};
