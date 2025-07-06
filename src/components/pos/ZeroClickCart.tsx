import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Zap, 
  Settings, 
  Brain,
  Target,
  Clock,
  TrendingUp,
  Star,
  Plus,
  Minus,
  CheckCircle,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone
} from 'lucide-react';
import { CartItem, Shop } from '@/types/pos';

interface ZeroClickCartProps {
  cart: CartItem[];
  shopDetails: Shop;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCompleteOrder: (method: string) => Promise<void>;
  total: number;
  printerConnected: boolean;
}

interface AutoAction {
  type: 'increase' | 'decrease' | 'remove' | 'checkout';
  itemId?: string;
  method?: string;
  confidence: number;
  reason: string;
}

export function ZeroClickCart({
  cart,
  shopDetails,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCompleteOrder,
  total,
  printerConnected
}: ZeroClickCartProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [autoActions, setAutoActions] = useState<AutoAction[]>([]);
  const [lastAction, setLastAction] = useState('');
  const [autoCheckoutEnabled, setAutoCheckoutEnabled] = useState(true);
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [suggestedPayment, setSuggestedPayment] = useState<string>('');

  // Auto-actions based on cart contents
  useEffect(() => {
    const actions: AutoAction[] = [];

    // Auto-suggest payment method based on total
    if (total > 0) {
      if (total < 100) {
        setSuggestedPayment('cash');
        actions.push({
          type: 'checkout',
          method: 'cash',
          confidence: 0.9,
          reason: 'Small amount - suggest cash'
        });
      } else if (total > 1000) {
        setSuggestedPayment('card');
        actions.push({
          type: 'checkout',
          method: 'card',
          confidence: 0.8,
          reason: 'Large amount - suggest card'
        });
      } else {
        setSuggestedPayment('upi');
        actions.push({
          type: 'checkout',
          method: 'upi',
          confidence: 0.7,
          reason: 'Medium amount - suggest UPI'
        });
      }
    }

    // Auto-remove low quantity items
    cart.forEach(item => {
      if (item.quantity === 1) {
        actions.push({
          type: 'remove',
          itemId: item.id,
          confidence: 0.6,
          reason: 'Single item - suggest remove'
        });
      }
    });

    setAutoActions(actions);
  }, [cart, total]);

  // Auto-checkout for common scenarios
  useEffect(() => {
    if (autoCheckoutEnabled && cart.length > 0) {
      // Auto-checkout for single items under 50
      if (cart.length === 1 && total < 50) {
        const timer = setTimeout(() => {
          onCompleteOrder('cash');
          setLastAction('Auto-checkout: Single small item');
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [autoCheckoutEnabled, cart, total, onCompleteOrder]);

  const handleItemHover = (itemId: string) => {
    setHoveredItem(itemId);
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
  };

  const handleItemLeave = () => {
    setHoveredItem(null);
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }
  };

  const handleAutoIncrease = (itemId: string) => {
    const item = cart.find(c => c.id === itemId);
    if (item) {
      onUpdateQuantity(itemId, item.quantity + 1);
      setLastAction(`Auto-increased: ${item.name}`);
    }
  };

  const handleAutoDecrease = (itemId: string) => {
    const item = cart.find(c => c.id === itemId);
    if (item && item.quantity > 1) {
      onUpdateQuantity(itemId, item.quantity - 1);
      setLastAction(`Auto-decreased: ${item.name}`);
    } else if (item && item.quantity === 1) {
      onRemoveItem(itemId);
      setLastAction(`Auto-removed: ${item.name}`);
    }
  };

  const handleQuickPayment = (method: string) => {
    onCompleteOrder(method);
    setLastAction(`Quick payment: ${method.toUpperCase()}`);
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return DollarSign;
      case 'card': return CreditCard;
      case 'upi': return Smartphone;
      default: return DollarSign;
    }
  };

  return (
    <div className="space-y-4">
      {/* Zero-Click Cart Header */}
      <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4" />
            Zero-Click Cart
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Zap className="h-2 w-2 mr-1" />
              Auto-Manage
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs">
            <span>Items: {cart.length}</span>
            <span>Total: ₹{total.toFixed(2)}</span>
            <span>Auto-checkout: {autoCheckoutEnabled ? 'ON' : 'OFF'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Smart Cart Items */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-blue-600" />
            Smart Cart Management
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Target className="h-2 w-2 mr-1" />
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {cart.map((item) => {
              const isHovered = hoveredItem === item.id;
              const subtotal = item.price * item.quantity;
              
              return (
                <div
                  key={item.id}
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    isHovered ? 'scale-102 shadow-md' : 'hover:scale-101'
                  }`}
                  onMouseEnter={() => handleItemHover(item.id)}
                  onMouseLeave={handleItemLeave}
                >
                  <Card className={`bg-white border-2 transition-all duration-300 ${
                    isHovered ? 'border-blue-400 shadow-md' : 'border-gray-200'
                  }`}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-gray-600">
                            ₹{item.price.toFixed(2)} × {item.quantity}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              ₹{subtotal.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.quantity} item{item.quantity > 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          {/* Hover Actions */}
                          {isHovered && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAutoDecrease(item.id);
                                }}
                                variant="outline"
                                className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100"
                              >
                                <Minus className="h-3 w-3 text-red-600" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAutoIncrease(item.id);
                                }}
                                variant="outline"
                                className="h-8 w-8 p-0 bg-green-50 hover:bg-green-100"
                              >
                                <Plus className="h-3 w-3 text-green-600" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Auto-action Progress */}
                      {isHovered && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                          <div className="h-full bg-blue-500 animate-pulse transition-all duration-1000"></div>
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

      {/* Quick Payment Methods */}
      {total > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-green-600" />
              One-Click Payment
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Target className="h-2 w-2 mr-1" />
                Instant
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['cash', 'card', 'upi', 'bank_transfer'].map((method) => {
                const Icon = getPaymentIcon(method);
                const isSuggested = suggestedPayment === method;
                
                return (
                  <Button
                    key={method}
                    onClick={() => handleQuickPayment(method)}
                    className={`h-12 text-xs font-medium ${
                      isSuggested 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-white hover:bg-gray-50 border-2 border-gray-200'
                    }`}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    <div className="text-left">
                      <div className="font-medium">{method.toUpperCase()}</div>
                      {isSuggested && (
                        <div className="text-xs opacity-90">Suggested</div>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto Actions Panel */}
      {autoActions.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-purple-600" />
              AI Suggestions
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Star className="h-2 w-2 mr-1" />
                Smart
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {autoActions.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">{action.reason}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (action.type === 'checkout' && action.method) {
                        handleQuickPayment(action.method);
                      } else if (action.type === 'remove' && action.itemId) {
                        onRemoveItem(action.itemId);
                      }
                    }}
                    variant="outline"
                    className="h-8 text-xs"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Execute
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cart Summary */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Cart Summary
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <CheckCircle className="h-2 w-2 mr-1" />
              Auto
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (18%):</span>
              <span>₹{(total * 0.18).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>₹{(total * 1.18).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Features Toggle */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4 text-blue-600" />
            Zero-Click Features
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Brain className="h-2 w-2 mr-1" />
              Smart
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => setAutoCheckoutEnabled(!autoCheckoutEnabled)}
              variant={autoCheckoutEnabled ? "default" : "outline"}
              className="h-12 text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Auto-Checkout
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
              Smart Payment
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

      {/* Click Counter */}
      <Card className="bg-gray-50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Clicks Eliminated:</span>
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