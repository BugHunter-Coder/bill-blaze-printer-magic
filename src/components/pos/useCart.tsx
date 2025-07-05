import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Product, CartItem, Shop } from '@/types/pos';

export function useCart(shop: Shop | null) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);

  // Clear cart when shop changes
  useEffect(() => {
    setCart([]);
  }, [shop?.id]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const key = product.selectedVariant 
        ? `${product.id}_${product.selectedVariant.id}` 
        : product.id;
      
      const existingIndex = prev.findIndex(item => {
        const itemKey = item.selectedVariant 
          ? `${item.id}_${item.selectedVariant.id}` 
          : item.id;
        return itemKey === key;
      });

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1
        };
        return updated;
      }

      return [...prev, { ...product, quantity: 1 }];
    });

    toast({
      description: `${product.name} added to cart`,
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    setCart(prev => prev.map(item => {
      const itemKey = item.selectedVariant 
        ? `${item.id}_${item.selectedVariant.id}` 
        : item.id;
      return itemKey === id ? { ...item, quantity } : item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => {
      const itemKey = item.selectedVariant 
        ? `${item.id}_${item.selectedVariant.id}` 
        : item.id;
      return itemKey !== id;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const completeOrder = async (
    paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other',
    directAmount?: number
  ): Promise<void> => {
    if (!user || !shop) {
      toast({
        title: "Error",
        description: "Authentication or shop selection error",
        variant: "destructive",
      });
      return;
    }

    try {
      const subtotal = directAmount || total;
      const taxAmount = subtotal * (shop.tax_rate || 0);
      const totalAmount = subtotal + taxAmount;

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          shop_id: shop.id,
          cashier_id: profile?.id || user.id,
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
      if (!directAmount && cart.length > 0) {
        const transactionItems = cart.map(item => ({
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
        for (const item of cart) {
          await supabase
            .from('products')
            .update({ 
              stock_quantity: Math.max(0, (item.stock_quantity || 0) - item.quantity)
            })
            .eq('id', item.id);
        }
      }

      clearCart();
      toast({
        title: "Success",
        description: "Order completed successfully!",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete order",
        variant: "destructive",
      });
    }
  };

  return {
    cart,
    total,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    completeOrder
  };
}