import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ProductCatalog } from '@/components/ProductCatalog';
import { Cart } from '@/components/Cart';
import { BluetoothPrinter } from '@/components/BluetoothPrinter';
import { Header } from '@/components/Header';
import { ShopManagement } from '@/components/ShopManagement';
import ShopSetup from '@/components/ShopSetup';
import { InventorySetupPrompt } from '@/components/InventorySetupPrompt';
import { Button } from '@/components/ui/button';
import { Product, CartItem, Shop, Expense, Transaction } from '@/types/pos';
import { Store, ShoppingCart } from 'lucide-react';

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [printer, setPrinter] = useState<BluetoothDevice | null>(null);
  const [currentView, setCurrentView] = useState<'pos' | 'management'>('pos');
  const [shop, setShop] = useState<Shop | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shopLoading, setShopLoading] = useState(true);
  const [showInventorySetup, setShowInventorySetup] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  useEffect(() => {
    if (profile?.shop_id) {
      fetchShopDetails();
      fetchTransactions();
      checkInventoryStatus();
    } else {
      setShopLoading(false);
      setInventoryLoading(false);
    }
  }, [profile]);

  const checkInventoryStatus = async () => {
    if (!profile?.shop_id) {
      setInventoryLoading(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', profile.shop_id)
        .eq('is_active', true);

      if (error) throw error;

      // Show inventory setup if no products exist
      if (!count || count === 0) {
        setShowInventorySetup(true);
      }
    } catch (error) {
      console.error('Error checking inventory status:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchShopDetails = async () => {
    if (!profile?.shop_id) return;
    
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', profile.shop_id)
        .single();
      
      if (error) throw error;
      setShop(data);
    } catch (error) {
      console.error('Error fetching shop details:', error);
    } finally {
      setShopLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!profile?.shop_id) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
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

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleOrderComplete = async (paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other', directAmount?: number) => {
    if (!profile?.shop_id) return;
    
    try {
      const total = directAmount || getCartTotal();
      const tax = total * shop.tax_rate;
      const finalTotal = total + tax;

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          shop_id: profile.shop_id,
          cashier_id: profile.id,
          type: 'sale' as const,
          subtotal: total,
          tax_amount: tax,
          total_amount: finalTotal,
          payment_method: paymentMethod,
          is_direct_billing: !!directAmount,
          invoice_number: `INV-${Date.now()}`,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items if not direct billing
      if (!directAmount && cart.length > 0) {
        const items = cart.map(item => ({
          transaction_id: transaction.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from('transaction_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      await fetchTransactions();
      clearCart();
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  const handleAddExpense = async (expense: Expense) => {
    if (!profile?.shop_id) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          shop_id: profile.shop_id,
          created_by: profile.id,
        });

      if (error) throw error;
      await fetchTransactions();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  if (loading || shopLoading || inventoryLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile?.shop_id) {
    return <ShopSetup onShopCreated={fetchShopDetails} />;
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Shop not found</h2>
          <p className="text-gray-600">Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  // Show inventory setup if no products exist
  if (showInventorySetup) {
    return (
      <InventorySetupPrompt
        onSetupComplete={() => {
          setShowInventorySetup(false);
          setCurrentView('management');
        }}
        onProceedAnyway={() => setShowInventorySetup(false)}
      />
    );
  }

  if (currentView === 'management') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Store className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
          </div>
          <Button onClick={() => setCurrentView('pos')} variant="outline">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Back to POS
          </Button>
        </header>
        
        <ShopManagement 
          shopDetails={shop}
          onShopUpdate={fetchShopDetails}
          transactions={transactions}
          onAddExpense={handleAddExpense}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
        <Header 
          isBluetoothConnected={isBluetoothConnected}
          printer={printer}
          shop={shop}
        />
        <Button onClick={() => setCurrentView('management')} variant="outline">
          <Store className="h-4 w-4 mr-2" />
          Shop Management
        </Button>
      </header>
      
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="flex-1 p-6 overflow-y-auto">
          <ProductCatalog onAddToCart={addToCart} />
        </div>

        <div className="w-96 bg-white shadow-lg border-l border-gray-200 flex flex-col">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            total={getCartTotal()}
            shopDetails={shop}
          />
          
          <BluetoothPrinter
            isConnected={isBluetoothConnected}
            onConnectionChange={setIsBluetoothConnected}
            onPrinterChange={setPrinter}
            cart={cart}
            total={getCartTotal()}
            onOrderComplete={handleOrderComplete}
            shopDetails={shop}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
