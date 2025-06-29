import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { useToast } from '@/hooks/use-toast';
import { POSInterface } from '@/components/POSInterface';
import { ShopManagement } from '@/components/ShopManagement';
import { Button } from '@/components/ui/button';
import { Settings, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { ProductCatalog } from '@/components/ProductCatalog';
import { Cart } from '@/components/Cart';
import { BluetoothPrinter } from '@/components/BluetoothPrinter';
import { Product, CartItem } from '@/types/pos';
import Header from '@/components/Header';

type Shop = Database['public']['Tables']['shops']['Row'];

const POS = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const { selectedShop, loading: shopLoading } = useShop();
  const [showManagement, setShowManagement] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Printer state management
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [printerDevice, setPrinterDevice] = useState<BluetoothDevice | null>(null);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Add to cart handler
  const handleAddToCart = (product: Product) => {
    console.log('Adding to cart:', product); // Debug log
    setCartItems(prev => {
      // Create a unique ID for the cart item (product + variant combination)
      const cartItemId = product.selectedVariant
        ? `${product.id}_${product.selectedVariant.id}`
        : product.id;
      
      console.log('Cart item ID:', cartItemId); // Debug log
      
      // Check if this exact product+variant combination already exists
      const existingItem = prev.find(item => {
        const itemId = item.selectedVariant
          ? `${item.id}_${item.selectedVariant.id}`
          : item.id;
        return itemId === cartItemId;
      });
      
      if (existingItem) {
        // Update quantity of existing item
        return prev.map(item => {
          const itemId = item.selectedVariant
            ? `${item.id}_${item.selectedVariant.id}`
            : item.id;
          return itemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item;
        });
      } else {
        // Add new item to cart
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  // Update quantity handler
  const handleUpdateQuantity = (id: string, quantity: number) => {
    console.log('Updating quantity for ID:', id, 'to:', quantity); // Debug log
    if (quantity <= 0) {
      handleRemoveItem(id);
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

  // Remove item handler
  const handleRemoveItem = (id: string) => {
    console.log('Removing item with ID:', id); // Debug log
    setCartItems(prev => prev.filter(item => {
      const itemId = item.selectedVariant
        ? `${item.id}_${item.selectedVariant.id}`
        : item.id;
      return itemId !== id;
    }));
  };

  // Clear cart handler
  const handleClearCart = () => setCartItems([]);

  // Calculate total
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Handle order completion - save to database
  const handleOrderComplete = async (paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other', directAmount?: number) => {
    console.log('🔍 DEBUG: POS handleOrderComplete called with:', { paymentMethod, directAmount });
    console.log('🔍 DEBUG: User state:', { user: !!user, userId: user?.id });
    console.log('🔍 DEBUG: Profile state:', { profile: !!profile, profileId: profile?.id, profileData: profile });
    console.log('🔍 DEBUG: Shop state:', { shopId: selectedShop?.id, shopName: selectedShop?.name });
    console.log('🔍 DEBUG: Cart state:', { cartItems: cartItems.length, cartTotal });

    if (!user) {
      console.error('❌ DEBUG: Order failed - no user');
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    if (!selectedShop?.id) {
      console.error('❌ DEBUG: Order failed - no shop selected');
      toast({
        title: "Error",
        description: "No shop selected",
        variant: "destructive",
      });
      return;
    }

    // Use profile.id if available, otherwise use user.id as fallback
    const cashierId = profile?.id || user.id;
    console.log('🔍 DEBUG: Using cashier_id:', cashierId, 'from profile:', !!profile);

    try {
      const subtotal = directAmount || cartTotal;
      const taxAmount = subtotal * (selectedShop.tax_rate || 0);
      const totalAmount = subtotal + taxAmount;

      console.log('🔍 DEBUG: Calculated amounts:', { subtotal, taxAmount, totalAmount, taxRate: selectedShop.tax_rate });

      // Create transaction
      console.log('🔍 DEBUG: Creating transaction...');
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          shop_id: selectedShop.id,
          cashier_id: cashierId, // Use the determined cashier_id
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
      setCartItems([]);

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

  // Check URL parameters to auto-open management
  useEffect(() => {
    const management = searchParams.get('management');
    if (management === 'true' || management === 'sales' || management === 'products' || management === 'expenses') {
      setShowManagement(true);
    }
  }, [searchParams]);

  // Ensure profile is loaded and debug profile state
  useEffect(() => {
    console.log('🔍 DEBUG: Profile state changed:', { 
      user: !!user, 
      profile: !!profile, 
      profileId: profile?.id,
      profileData: profile 
    });
    
    if (user && !profile) {
      console.log('🔍 DEBUG: User exists but profile is missing, this might indicate an issue');
    }
  }, [user, profile]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ description: "Logout successful!" });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to logout: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async (data: any) => {
    try {
      await updateProfile(data);
      toast({ description: "Profile updated successfully!" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenManagement = () => setShowManagement(true);
  const handlePrinterConnectionChange = (isConnected: boolean) => setIsPrinterConnected(isConnected);
  const handlePrinterChange = (device: BluetoothDevice | null) => setPrinterDevice(device);

  // Test database connection and permissions
  const testDatabaseConnection = async () => {
    console.log('🧪 DEBUG: Testing database connection...');
    try {
      // Test 1: Check if we can read from profiles table
      const { data: profileTest, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', user?.id)
        .single();
      
      console.log('🔍 DEBUG: Profile test result:', { profileTest, profileError });
      
      // Test 2: Check if we can read from shops table
      const { data: shopTest, error: shopError } = await supabase
        .from('shops')
        .select('id, name')
        .eq('id', selectedShop?.id)
        .single();
      
      console.log('🔍 DEBUG: Shop test result:', { shopTest, shopError });
      
      // Test 3: Check if we can read from transactions table
      const { data: transactionTest, error: transactionError } = await supabase
        .from('transactions')
        .select('id, total_amount')
        .eq('shop_id', selectedShop?.id)
        .limit(1);
      
      console.log('🔍 DEBUG: Transaction test result:', { transactionTest, transactionError });
      
      toast({ 
        title: 'Database Test Complete', 
        description: 'Check console for results' 
      });
      
    } catch (error) {
      console.error('❌ DEBUG: Database test failed:', error);
      toast({ 
        title: 'Database Test Failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  if (loading || shopLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!selectedShop) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No company selected</p>
          <p className="text-sm text-gray-500 mb-4">Please select a company from the header to use the POS system.</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  // --- REDESIGNED POS LAYOUT ---
  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navbar/Header */}
      <Header
        user={user}
        onLogout={handleLogout}
        onProfileUpdate={handleProfileUpdate}
        onOpenManagement={handleOpenManagement}
        isPrinterConnected={isPrinterConnected}
        onPrinterConnectionChange={handlePrinterConnectionChange}
        onPrinterChange={handlePrinterChange}
      />
      {/* Main POS Layout */}
      <div className="flex-1 flex flex-row min-h-0">
        {/* Product Grid */}
        <div className="flex-1 h-full overflow-y-auto p-4">
          <ProductCatalog onAddToCart={handleAddToCart} onAddProduct={() => {}} />
        </div>
        {/* Cart/Payment Sidebar */}
        <div className="w-[350px] xl:w-[420px] h-full flex flex-col bg-white border-l shadow-xl">
          {/* Cart Items (scrollable) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
            <Cart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              total={cartTotal}
              shopDetails={selectedShop}
            />
          </div>
          {/* Order Summary & Payment (always visible) */}
          <div className="flex-shrink-0 bg-white p-3 border-t">
            {/* Debug Test Button */}
            <Button 
              onClick={testDatabaseConnection}
              variant="outline"
              size="sm"
              className="w-full mb-2 text-xs"
            >
              🧪 Test Database Connection
            </Button>
            
            {/* Place your OrderSummary and PaymentSection components here */}
            <BluetoothPrinter
              isConnected={isPrinterConnected}
              onConnectionChange={handlePrinterConnectionChange}
              onPrinterChange={handlePrinterChange}
              cart={cartItems}
              total={cartTotal}
              onOrderComplete={handleOrderComplete}
              shopDetails={selectedShop}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
