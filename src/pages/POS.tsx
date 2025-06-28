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

  // Check URL parameters to auto-open management
  useEffect(() => {
    const management = searchParams.get('management');
    if (management === 'true' || management === 'sales' || management === 'products' || management === 'expenses') {
      setShowManagement(true);
    }
  }, [searchParams]);

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
            {/* Place your OrderSummary and PaymentSection components here */}
            <BluetoothPrinter
              isConnected={isPrinterConnected}
              onConnectionChange={handlePrinterConnectionChange}
              onPrinterChange={handlePrinterChange}
              cart={cartItems}
              total={cartTotal}
              onOrderComplete={async () => {
                // Clear cart after order completion
                setCartItems([]);
              }}
              shopDetails={selectedShop}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
