import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Product, CartItem, Shop } from '@/types/pos';

const CART_STORAGE_KEY = 'pos_cart';

export function useCart(shop: Shop | null) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const previousShopId = useRef<string | null>(null);

  // Load cart from localStorage on mount and handle shop changes
  useEffect(() => {
    console.log('🛒 useCart: Shop changed to:', shop?.id, 'Previous shop:', previousShopId.current);
    
    if (shop?.id) {
      const storedCart = localStorage.getItem(`${CART_STORAGE_KEY}_${shop.id}`);
      console.log('🛒 useCart: Stored cart for shop', shop.id, ':', storedCart);
      
      // If shop changed, clear cart first
      if (previousShopId.current && previousShopId.current !== shop.id) {
        console.log('🛒 useCart: Shop changed, clearing cart');
        setCart([]);
      }
      
      // Load cart from storage
      if (storedCart) {
        try {
          const parsedCart = JSON.parse(storedCart);
          console.log('🛒 useCart: Loading cart from storage:', parsedCart);
          setCart(parsedCart);
        } catch (error) {
          console.error('Error parsing stored cart:', error);
          localStorage.removeItem(`${CART_STORAGE_KEY}_${shop.id}`);
          setCart([]);
        }
      } else {
        // No stored cart for this shop, start with empty cart
        console.log('🛒 useCart: No stored cart found, starting with empty cart');
        setCart([]);
      }
      
      // Update previous shop ID
      previousShopId.current = shop.id;
    } else {
      // No shop selected, clear cart
      console.log('🛒 useCart: No shop selected, clearing cart');
      setCart([]);
      previousShopId.current = null;
    }
  }, [shop?.id]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log('🛒 useCart: Cart changed, saving to localStorage. Shop:', shop?.id, 'Cart length:', cart.length);
    
    if (shop?.id && cart.length > 0) {
      localStorage.setItem(`${CART_STORAGE_KEY}_${shop.id}`, JSON.stringify(cart));
      console.log('🛒 useCart: Saved cart to localStorage:', cart);
    } else if (shop?.id && cart.length === 0) {
      // Remove empty cart from storage
      localStorage.removeItem(`${CART_STORAGE_KEY}_${shop.id}`);
      console.log('🛒 useCart: Removed empty cart from localStorage');
    }
  }, [cart, shop?.id]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(CART_STORAGE_KEY) && shop?.id) {
        const cartShopId = e.key.replace(`${CART_STORAGE_KEY}_`, '');
        if (cartShopId === shop.id) {
          if (e.newValue) {
            try {
              const newCart = JSON.parse(e.newValue);
              setCart(newCart);
            } catch (error) {
              console.error('Error parsing cart from storage event:', error);
            }
          } else {
            // Cart was cleared in another tab
            setCart([]);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
    if (shop?.id) {
      localStorage.removeItem(`${CART_STORAGE_KEY}_${shop.id}`);
    }
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