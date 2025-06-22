
import { useState, useEffect } from 'react';
import { ProductCatalog } from '@/components/ProductCatalog';
import { Cart } from '@/components/Cart';
import { BluetoothPrinter } from '@/components/BluetoothPrinter';
import { Header } from '@/components/Header';
import { ShopManagement } from '@/components/ShopManagement';
import { Button } from '@/components/ui/button';
import { Product, CartItem, ShopDetails, Expense, Transaction } from '@/types/pos';
import { Store, ShoppingCart } from 'lucide-react';

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [printer, setPrinter] = useState<BluetoothDevice | null>(null);
  const [currentView, setCurrentView] = useState<'pos' | 'management'>('pos');
  const [shopDetails, setShopDetails] = useState<ShopDetails>({
    name: 'Bill Blaze POS',
    address: '123 Main Street, City, State 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@billblaze.com',
    taxId: 'TAX123456789',
    currency: 'USD',
    taxRate: 0.08,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const savedShopDetails = localStorage.getItem('shopDetails');
    if (savedShopDetails) {
      setShopDetails(JSON.parse(savedShopDetails));
    }

    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  }, []);

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

  const handleOrderComplete = () => {
    const total = getCartTotal();
    const tax = total * shopDetails.taxRate;
    const finalTotal = total + tax;

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'sale',
      amount: finalTotal,
      date: new Date(),
      description: `Sale - ${cart.length} items`,
      items: cart,
    };

    const updatedTransactions = [...transactions, transaction];
    setTransactions(updatedTransactions);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    
    clearCart();
  };

  const handleShopDetailsUpdate = (details: ShopDetails) => {
    setShopDetails(details);
  };

  const handleAddExpense = (expense: Expense) => {
    const transaction: Transaction = {
      id: expense.id,
      type: 'expense',
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      category: expense.category,
    };

    const updatedTransactions = [...transactions, transaction];
    setTransactions(updatedTransactions);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
  };

  if (currentView === 'management') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Store className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{shopDetails.name}</h1>
          </div>
          <Button onClick={() => setCurrentView('pos')} variant="outline">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Back to POS
          </Button>
        </header>
        
        <ShopManagement 
          onShopDetailsUpdate={handleShopDetailsUpdate}
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
          shopDetails={shopDetails}
        />
        <Button onClick={() => setCurrentView('management')} variant="outline">
          <Store className="h-4 w-4 mr-2" />
          Shop Management
        </Button>
      </header>
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Product Catalog - Left Side */}
        <div className="flex-1 p-6 overflow-y-auto">
          <ProductCatalog onAddToCart={addToCart} />
        </div>

        {/* Cart and Printer - Right Side */}
        <div className="w-96 bg-white shadow-lg border-l border-gray-200 flex flex-col">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            total={getCartTotal()}
            shopDetails={shopDetails}
          />
          
          <BluetoothPrinter
            isConnected={isBluetoothConnected}
            onConnectionChange={setIsBluetoothConnected}
            onPrinterChange={setPrinter}
            cart={cart}
            total={getCartTotal()}
            onOrderComplete={handleOrderComplete}
            shopDetails={shopDetails}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
