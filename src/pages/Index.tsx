
import { useState, useEffect } from 'react';
import { ProductCatalog } from '@/components/ProductCatalog';
import { Cart } from '@/components/Cart';
import { BluetoothPrinter } from '@/components/BluetoothPrinter';
import { Header } from '@/components/Header';
import { Product, CartItem } from '@/types/pos';

const Index = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [printer, setPrinter] = useState<BluetoothDevice | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        isBluetoothConnected={isBluetoothConnected}
        printer={printer}
      />
      
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
          />
          
          <BluetoothPrinter
            isConnected={isBluetoothConnected}
            onConnectionChange={setIsBluetoothConnected}
            onPrinterChange={setPrinter}
            cart={cart}
            total={getCartTotal()}
            onOrderComplete={clearCart}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
