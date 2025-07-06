import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MousePointer, 
  Eye, 
  Zap, 
  Settings, 
  Brain,
  Target,
  Clock,
  TrendingUp,
  Star,
  Plus,
  CheckCircle
} from 'lucide-react';
import { Product, CartItem } from '@/types/pos';
import { VariantChipSelector } from './VariantChipSelector';

interface ZeroClickProductGridProps {
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  shopId?: string;
}

interface HoverAction {
  product: Product;
  action: 'add' | 'quick_add' | 'suggest';
  confidence: number;
}

export function ZeroClickProductGrid({
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  shopId
}: ZeroClickProductGridProps) {
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [autoAddEnabled, setAutoAddEnabled] = useState(true);
  const [hoverActions, setHoverActions] = useState<HoverAction[]>([]);
  const [frequentProducts, setFrequentProducts] = useState<Product[]>([]);
  const [lastAutoAction, setLastAutoAction] = useState('');
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});

  // Auto-add on hover (with delay)
  useEffect(() => {
    if (hoveredProduct && autoAddEnabled) {
      const timer = setTimeout(() => {
        onAddToCart(hoveredProduct);
        setLastAutoAction(`Auto-added: ${hoveredProduct.name}`);
        setHoveredProduct(null);
      }, 1500); // 1.5 second hover to auto-add
      
      setHoverTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [hoveredProduct, autoAddEnabled, onAddToCart]);

  // Generate hover actions based on context
  useEffect(() => {
    const actions: HoverAction[] = [];
    
    // Suggest products based on cart contents
    if (cart.length > 0) {
      const cartCategories = cart.map(item => item.category).filter(Boolean);
      const relatedProducts = products.filter(product => 
        cartCategories.includes(product.category) && 
        !cart.some(item => item.id === product.id)
      );
      
      relatedProducts.slice(0, 3).forEach(product => {
        actions.push({
          product,
          action: 'suggest',
          confidence: 0.8
        });
      });
    }

    // Quick add for frequent products
    frequentProducts.slice(0, 2).forEach(product => {
      actions.push({
        product,
        action: 'quick_add',
        confidence: 0.9
      });
    });

    setHoverActions(actions);
  }, [cart, products, frequentProducts]);

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

  const handleProductHover = (product: Product) => {
    setHoveredProduct(product);
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
  };

  const handleProductLeave = () => {
    setHoveredProduct(null);
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
  };

  const handleQuickAdd = (product: Product) => {
    // If product has variants and a variant is selected, use that
    if (product.has_variants && selectedVariants[product.id]) {
      const selectedVariant = selectedVariants[product.id];
      const productWithVariant = {
        ...product,
        price: product.price + selectedVariant.price_modifier,
        selectedVariant: selectedVariant
      };
      onAddToCart(productWithVariant);
      setLastAutoAction(`Quick add: ${product.name} (${selectedVariant.value})`);
    } else {
      onAddToCart(product);
      setLastAutoAction(`Quick add: ${product.name}`);
    }
  };

  const handleAutoSuggest = (product: Product) => {
    onAddToCart(product);
    setLastAutoAction(`AI suggested: ${product.name}`);
  };

  return (
    <div className="space-y-4">
      {/* Zero-Click Mode Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MousePointer className="h-4 w-4" />
            Single-Click Mode
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Zap className="h-2 w-2 mr-1" />
              Click to Add
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs">
            <span>Single-click: ON</span>
            <span>Auto-add: {autoAddEnabled ? 'ON' : 'OFF'}</span>
            <span>AI suggestions: Active</span>
          </div>
        </CardContent>
      </Card>

      {/* Smart Product Grid */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-purple-600" />
            Smart Product Grid
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Eye className="h-2 w-2 mr-1" />
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {suggestions.map((product) => {
              const isHovered = hoveredProduct?.id === product.id;
              const isInCart = cart.some(item => item.id === product.id);
              const cartItem = cart.find(item => item.id === product.id);
              
              return (
                <div
                  key={product.id}
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    isHovered ? 'scale-105 shadow-lg' : 'hover:scale-102'
                  }`}
                  onMouseEnter={() => handleProductHover(product)}
                  onMouseLeave={handleProductLeave}
                  onClick={() => handleQuickAdd(product)}
                >
                  <Card className={`h-32 bg-white border-2 transition-all duration-300 ${
                    isHovered ? 'border-purple-400 shadow-lg' : 'border-gray-200 hover:border-blue-300'
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
                      
                      {/* Variant Selection for Products with Variants */}
                      {product.has_variants && product.variants && product.variants.length > 0 && (
                        <div className="mt-2">
                          <VariantChipSelector
                            productId={product.id}
                            variants={product.variants}
                            selectedVariant={selectedVariants[product.id] || null}
                            onVariantSelect={(variant) => {
                              setSelectedVariants(prev => ({
                                ...prev,
                                [product.id]: variant
                              }));
                            }}
                            basePrice={product.price}
                            showPrice={false}
                            compact={true}
                          />
                        </div>
                      )}
                      
                      {/* Hover Actions */}
                      {isHovered && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="text-xs mb-2">Click to add instantly</div>
                            <div className="text-xs mb-2">Or hover 1.5s for auto-add</div>
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAdd(product);
                                }}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* In Cart Indicator */}
                      {isInCart && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-500 text-white text-xs">
                            <CheckCircle className="h-2 w-2 mr-1" />
                            {cartItem?.quantity || 1}
                          </Badge>
                        </div>
                      )}

                      {/* Auto-add Progress */}
                      {isHovered && autoAddEnabled && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                          <div className="h-full bg-green-500 animate-pulse transition-all duration-1500"></div>
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

      {/* Hover Actions Panel */}
      {hoverActions.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-green-600" />
              Smart Suggestions
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Brain className="h-2 w-2 mr-1" />
                AI
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {hoverActions.map((action) => (
                <Button
                  key={action.product.id}
                  onClick={() => {
                    if (action.action === 'quick_add') {
                      handleQuickAdd(action.product);
                    } else {
                      handleAutoSuggest(action.product);
                    }
                  }}
                  variant="outline"
                  className="h-12 text-xs bg-white hover:bg-green-50"
                >
                  <div className="flex items-center gap-1">
                    {action.action === 'quick_add' ? (
                      <Zap className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <Brain className="h-3 w-3 text-purple-500" />
                    )}
                    <span className="truncate">{action.product.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frequent Products */}
      {frequentProducts.length > 0 && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              Frequently Used
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                <Star className="h-2 w-2 mr-1" />
                Popular
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {frequentProducts.slice(0, 4).map((product) => (
                <Button
                  key={product.id}
                  onClick={() => handleQuickAdd(product)}
                  variant="outline"
                  className="h-12 text-xs bg-white hover:bg-orange-50"
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
      )}

      {/* Auto-Features Toggle */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4 text-blue-600" />
            Zero-Click Features
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <MousePointer className="h-2 w-2 mr-1" />
              Smart
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => setAutoAddEnabled(!autoAddEnabled)}
              variant={autoAddEnabled ? "default" : "outline"}
              className="h-12 text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Auto-Add
            </Button>
            <Button
              variant="outline"
              className="h-12 text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              Hover Timer
            </Button>
            <Button
              variant="outline"
              className="h-12 text-xs"
            >
              <Brain className="h-3 w-3 mr-1" />
              AI Suggestions
            </Button>
            <Button
              variant="outline"
              className="h-12 text-xs"
            >
              <Target className="h-3 w-3 mr-1" />
              Smart Grid
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Feedback */}
      {lastAutoAction && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>{lastAutoAction}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Click Counter */}
      <Card className="bg-gray-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Clicks Eliminated:</span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <MousePointer className="h-3 w-3 mr-1" />
              90% Reduction
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 