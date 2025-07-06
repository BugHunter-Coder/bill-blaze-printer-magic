import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MousePointer, 
  Zap, 
  Settings, 
  Brain,
  Target,
  Clock,
  TrendingUp,
  Star,
  Plus,
  CheckCircle,
  Eye,
  Bolt
} from 'lucide-react';
import { Product, CartItem } from '@/types/pos';

interface SingleClickProductSelectionProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  shopId?: string;
}

export function SingleClickProductSelection({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  shopId
}: SingleClickProductSelectionProps) {
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);
  const [instantMode, setInstantMode] = useState(true);
  const [frequentProducts, setFrequentProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);

  // Single-click product addition
  const handleSingleClickAdd = (product: Product) => {
    onAddToCart(product);
    setLastAddedProduct(product);
    setShowFeedback(true);
    
    // Hide feedback after 2 seconds
    setTimeout(() => {
      setShowFeedback(false);
      setLastAddedProduct(null);
    }, 2000);
  };

  // Smart product suggestions
  useEffect(() => {
    if (cart.length === 0) {
      // Show most popular products when cart is empty
      setSuggestions(products.slice(0, 8));
    } else {
      // Show related products based on cart
      const cartCategories = cart.map(item => item.category).filter(Boolean);
      const related = products.filter(product => 
        cartCategories.includes(product.category) && 
        !cart.some(item => item.id === product.id)
      );
      setSuggestions(related.slice(0, 6));
    }
  }, [cart, products]);

  // Get cart quantity for a product
  const getCartQuantity = (productId: string) => {
    const item = cart.find(item => item.id === productId);
    return item?.quantity || 0;
  };

  return (
    <div className="space-y-4">
      {/* Single-Click Mode Header */}
      <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MousePointer className="h-4 w-4" />
            Single-Click Product Selection
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Zap className="h-2 w-2 mr-1" />
              Instant Add
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs">
            <span>Single-click: {instantMode ? 'ON' : 'OFF'}</span>
            <span>Products: {products.length}</span>
            <span>Cart items: {cart.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Instant Product Grid */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bolt className="h-4 w-4 text-blue-600" />
            Instant Product Selection
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Target className="h-2 w-2 mr-1" />
              One Click
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {suggestions.map((product) => {
              const cartQuantity = getCartQuantity(product.id);
              const isRecentlyAdded = lastAddedProduct?.id === product.id;
              
              return (
                <div
                  key={product.id}
                  className={`relative group cursor-pointer transition-all duration-200 ${
                    isRecentlyAdded ? 'scale-105 shadow-lg ring-2 ring-green-400' : 'hover:scale-102'
                  }`}
                  onClick={() => handleSingleClickAdd(product)}
                >
                  <Card className={`h-32 bg-white border-2 transition-all duration-200 ${
                    isRecentlyAdded 
                      ? 'border-green-400 shadow-lg bg-green-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}>
                    <CardContent className="p-3 h-full flex flex-col justify-between">
                      <div className="text-center">
                        <div className="font-medium text-sm truncate mb-1">
                          {product.name}
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          ₹{product.price.toFixed(0)}
                        </div>
                      </div>
                      
                      {/* Click to Add Indicator */}
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">
                          Click to add
                        </div>
                        <div className="flex items-center justify-center">
                          <Plus className="h-4 w-4 text-blue-500" />
                        </div>
                      </div>

                      {/* Cart Quantity Badge */}
                      {cartQuantity > 0 && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500 text-white text-xs">
                            <CheckCircle className="h-2 w-2 mr-1" />
                            {cartQuantity}
                          </Badge>
                        </div>
                      )}

                      {/* Recently Added Animation */}
                      {isRecentlyAdded && (
                        <div className="absolute inset-0 bg-green-100/50 rounded-lg flex items-center justify-center">
                          <div className="text-center text-green-700">
                            <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                            <div className="text-xs font-medium">Added!</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Buttons */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-purple-600" />
            Smart Quick Add
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Eye className="h-2 w-2 mr-1" />
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {frequentProducts.slice(0, 4).map((product) => (
              <Button
                key={product.id}
                onClick={() => handleSingleClickAdd(product)}
                variant="outline"
                className="h-12 text-xs bg-white hover:bg-purple-50"
              >
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className="truncate">{product.name}</span>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instant Add Feedback */}
      {showFeedback && lastAddedProduct && (
        <Card className="bg-green-50 border-green-200 animate-in slide-in-from-bottom-2">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>Instantly added: {lastAddedProduct.name}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single-Click Features */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4 text-blue-600" />
            Single-Click Features
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <MousePointer className="h-2 w-2 mr-1" />
              Instant
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => setInstantMode(!instantMode)}
              variant={instantMode ? "default" : "outline"}
              className="h-12 text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Instant Mode
            </Button>
            <Button
              variant="outline"
              className="h-12 text-xs"
            >
              <Target className="h-3 w-3 mr-1" />
              One Click
            </Button>
            <Button
              variant="outline"
              className="h-12 text-xs"
            >
              <Brain className="h-3 w-3 mr-1" />
              Smart Add
            </Button>
            <Button
              variant="outline"
              className="h-12 text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Quick Access
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Click Counter */}
      <Card className="bg-gray-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Clicks Required:</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Target className="h-3 w-3 mr-1" />
              Single Click Only
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 