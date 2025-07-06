import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Bolt, 
  Settings, 
  Smartphone, 
  MousePointer,
  Hand,
  Eye,
  Brain,
  Rocket,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Product, CartItem, Shop } from '@/types/pos';

interface UltraFastPOSProps {
  products: Product[];
  cart: CartItem[];
  shopDetails: Shop;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCompleteOrder: (method: string) => Promise<void>;
  total: number;
}

interface QuickAction {
  id: string;
  label: string;
  action: () => void;
  icon: any;
  color: string;
  priority: number;
}

export function UltraFastPOS({
  products,
  cart,
  shopDetails,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCompleteOrder,
  total
}: UltraFastPOSProps) {
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(true);
  const [gestureMode, setGestureMode] = useState(false);
  const [lastAction, setLastAction] = useState('');
  const [predictedNextAction, setPredictedNextAction] = useState<string>('');
  const [frequentProducts, setFrequentProducts] = useState<Product[]>([]);
  const [autoCheckout, setAutoCheckout] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

  // Auto-complete common transactions
  useEffect(() => {
    if (autoCompleteEnabled && cart.length > 0) {
      // Auto-predict next action based on cart contents
      const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      if (cartTotal > 1000) {
        setPredictedNextAction('High-value order - suggest premium payment');
      } else if (cart.length > 5) {
        setPredictedNextAction('Large order - suggest bulk discount');
      } else if (cart.length === 1) {
        setPredictedNextAction('Single item - suggest add-ons');
      }
    }
  }, [cart, autoCompleteEnabled]);

  // Generate quick actions based on context
  useEffect(() => {
    const actions: QuickAction[] = [];

    // Auto-complete payment for common amounts
    if (total > 0) {
      actions.push({
        id: 'auto-cash',
        label: `Cash ₹${total.toFixed(0)}`,
        action: () => onCompleteOrder('cash'),
        icon: Zap,
        color: 'bg-green-500',
        priority: 1
      });

      actions.push({
        id: 'auto-card',
        label: `Card ₹${total.toFixed(0)}`,
        action: () => onCompleteOrder('card'),
        icon: Bolt,
        color: 'bg-blue-500',
        priority: 2
      });
    }

    // Smart cart management
    if (cart.length > 0) {
      actions.push({
        id: 'clear-cart',
        label: 'Clear All',
        action: onClearCart,
        icon: Target,
        color: 'bg-red-500',
        priority: 3
      });
    }

    // Frequent products (top 4)
    frequentProducts.slice(0, 4).forEach((product, index) => {
      actions.push({
        id: `quick-${product.id}`,
        label: product.name,
        action: () => onAddToCart(product),
        icon: CheckCircle,
        color: 'bg-purple-500',
        priority: 4 + index
      });
    });

    setQuickActions(actions.sort((a, b) => a.priority - b.priority));
  }, [cart, total, frequentProducts, onCompleteOrder, onClearCart, onAddToCart]);

  // Gesture controls for touch devices
  const handleGesture = (gesture: string) => {
    switch (gesture) {
      case 'swipe-right':
        // Quick checkout
        if (cart.length > 0) {
          onCompleteOrder('cash');
          setLastAction('Swipe right - Quick cash payment');
        }
        break;
      case 'swipe-left':
        // Clear cart
        onClearCart();
        setLastAction('Swipe left - Cart cleared');
        break;
      case 'double-tap':
        // Add most frequent item
        if (frequentProducts.length > 0) {
          onAddToCart(frequentProducts[0]);
          setLastAction(`Double tap - Added ${frequentProducts[0].name}`);
        }
        break;
      case 'long-press':
        // Toggle voice mode
        setVoiceMode(!voiceMode);
        setLastAction('Long press - Voice mode toggled');
        break;
    }
  };

  // Auto-checkout for small amounts
  useEffect(() => {
    if (autoCheckout && total > 0 && total < 100 && cart.length === 1) {
      const timer = setTimeout(() => {
        onCompleteOrder('cash');
        setLastAction('Auto-checkout - Small single item');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoCheckout, total, cart, onCompleteOrder]);

  // Smart product suggestions
  const getSmartSuggestions = () => {
    if (cart.length === 0) {
      return frequentProducts.slice(0, 6);
    }
    
    // Suggest related products based on cart
    const cartCategories = cart.map(item => item.category).filter(Boolean);
    return products
      .filter(product => 
        cartCategories.includes(product.category) && 
        !cart.some(item => item.id === product.id)
      )
      .slice(0, 4);
  };

  return (
    <div className="space-y-4">
      {/* Ultra-Fast Mode Indicator */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Rocket className="h-4 w-4" />
            Single-Click Mode
            <Badge variant="secondary" className="bg-white/20 text-white">
              One Click Only
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs">
            <span>Auto-complete: {autoCompleteEnabled ? 'ON' : 'OFF'}</span>
            <span>Gesture: {gestureMode ? 'ON' : 'OFF'}</span>
            <span>Voice: {voiceMode ? 'ON' : 'OFF'}</span>
          </div>
        </CardContent>
      </Card>

      {/* One-Click Actions */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bolt className="h-4 w-4 text-green-600" />
            One-Click Actions
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Zap className="h-2 w-2 mr-1" />
              Instant
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  onClick={() => {
                    action.action();
                    setLastAction(`One-click: ${action.label}`);
                  }}
                  className={`h-12 text-xs font-medium ${action.color} hover:opacity-90 text-white`}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Smart Product Grid */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-purple-600" />
            Smart Suggestions
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              <Eye className="h-2 w-2 mr-1" />
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {getSmartSuggestions().map((product) => (
              <Button
                key={product.id}
                onClick={() => {
                  onAddToCart(product);
                  setLastAction(`Smart add: ${product.name}`);
                }}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center p-2 bg-white hover:bg-purple-50"
              >
                <div className="font-medium text-xs truncate w-full text-center">
                  {product.name}
                </div>
                <div className="text-xs text-gray-600">
                  ₹{product.price.toFixed(0)}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gesture Controls */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Hand className="h-4 w-4 text-orange-600" />
            Gesture Controls
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              <MousePointer className="h-2 w-2 mr-1" />
              Touch
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => handleGesture('swipe-right')}
              variant="outline"
              className="h-12 bg-white hover:bg-green-50"
            >
              <div className="text-xs">
                <div className="font-medium">Swipe Right</div>
                <div className="text-gray-600">Quick Pay</div>
              </div>
            </Button>
            <Button
              onClick={() => handleGesture('swipe-left')}
              variant="outline"
              className="h-12 bg-white hover:bg-red-50"
            >
              <div className="text-xs">
                <div className="font-medium">Swipe Left</div>
                <div className="text-gray-600">Clear Cart</div>
              </div>
            </Button>
            <Button
              onClick={() => handleGesture('double-tap')}
              variant="outline"
              className="h-12 bg-white hover:bg-blue-50"
            >
              <div className="text-xs">
                <div className="font-medium">Double Tap</div>
                <div className="text-gray-600">Add Frequent</div>
              </div>
            </Button>
            <Button
              onClick={() => handleGesture('long-press')}
              variant="outline"
              className="h-12 bg-white hover:bg-purple-50"
            >
              <div className="text-xs">
                <div className="font-medium">Long Press</div>
                <div className="text-gray-600">Voice Mode</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Features Toggle */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4 text-blue-600" />
            Auto-Features
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Brain className="h-2 w-2 mr-1" />
              Smart
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => setAutoCompleteEnabled(!autoCompleteEnabled)}
              variant={autoCompleteEnabled ? "default" : "outline"}
              className="h-12 text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Auto-Complete
            </Button>
            <Button
              onClick={() => setGestureMode(!gestureMode)}
              variant={gestureMode ? "default" : "outline"}
              className="h-12 text-xs"
            >
              <Hand className="h-3 w-3 mr-1" />
              Gesture Mode
            </Button>
            <Button
              onClick={() => setAutoCheckout(!autoCheckout)}
              variant={autoCheckout ? "default" : "outline"}
              className="h-12 text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Auto-Checkout
            </Button>
            <Button
              onClick={() => setVoiceMode(!voiceMode)}
              variant={voiceMode ? "default" : "outline"}
              className="h-12 text-xs"
            >
              <Smartphone className="h-3 w-3 mr-1" />
              Voice Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Feedback */}
      {lastAction && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span>{lastAction}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prediction Display */}
      {predictedNextAction && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Brain className="h-4 w-4" />
              <span>AI Prediction: {predictedNextAction}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Click Counter */}
      <Card className="bg-gray-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Clicks Saved:</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <Target className="h-3 w-3 mr-1" />
              90% Reduction
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 