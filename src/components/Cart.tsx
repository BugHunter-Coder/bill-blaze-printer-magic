import { ShoppingCart, Trash2, Plus, Minus, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CartItem, ShopDetails } from '@/types/pos';
import { Package } from 'lucide-react';
import { useState } from 'react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  total: number;
  shopDetails: ShopDetails;
  compact?: boolean;
  onProceedToCheckout?: () => void;
}

export const Cart = ({ items, onUpdateQuantity, onRemoveItem, onClearCart, total, shopDetails, compact = false, onProceedToCheckout }: CartProps) => {
  const tax = total * shopDetails.tax_rate;
  const finalTotal = total + tax;
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);

  // Debug logging
  console.log('Cart render - items:', items.map(item => ({
    id: item.id,
    name: item.name,
    selectedVariant: item.selectedVariant,
    itemId: item.selectedVariant ? `${item.id}_${item.selectedVariant.id}` : item.id,
    quantity: item.quantity,
    price: item.price
  })));

  return (
    <Card className="flex-1 h-full flex flex-col bg-white border-0 shadow-none">
      <CardContent className="flex-1 h-full flex flex-col p-3 lg:p-4 overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8 lg:py-12 flex-1 flex flex-col items-center justify-center">
            <div className="bg-gray-100 rounded-full w-16 h-16 lg:w-20 lg:h-20 mb-4 lg:mb-6 flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 lg:h-10 lg:w-10 text-gray-400" />
            </div>
            <h3 className="text-lg lg:text-xl font-medium text-gray-900 mb-2 lg:mb-3">Your cart is empty</h3>
            <p className="text-gray-600 mb-4 lg:mb-6 max-w-sm text-sm lg:text-base">
              Start adding products to begin your sale
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 lg:p-4 text-sm lg:text-base text-blue-800">
              <div className="flex items-center mb-2 lg:mb-3">
                <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Quick Tips</span>
              </div>
              <ul className="text-sm lg:text-base space-y-1 lg:space-y-1.5 text-left">
                <li>• Search products using the search bar</li>
                <li>• Click "Add to Cart" on any product</li>
                <li>• Use variants for different options</li>
                <li>• Complete the sale when ready</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Items (scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 lg:space-y-2.5">
              {items.map((item) => {
                const itemId = item.selectedVariant 
                  ? `${item.id}_${item.selectedVariant.id}`
                  : item.id;
                return (
                <div key={itemId} className="bg-white border border-gray-200 rounded-lg p-2 lg:p-2.5 hover:shadow-md transition-shadow duration-200 flex items-start gap-2">
                  {/* Product Image/Icon */}
                  <div className="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                    )}
                  </div>
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 text-xs lg:text-sm truncate">
                        {item.name}
                      </h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          onRemoveItem(itemId);
                        }}
                        className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 ml-1"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    {/* Variant Info */}
                    {item.selectedVariant && (
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="outline" className="text-[10px] px-1 py-0.5 bg-blue-50 border-blue-200 text-blue-700">
                          {item.selectedVariant.name}: {item.selectedVariant.value}
                        </Badge>
                        {item.selectedVariant.price_modifier !== 0 && (
                          <span className="text-[10px] text-gray-500 font-medium">
                            {item.selectedVariant.price_modifier > 0 ? '+' : ''}₹{item.selectedVariant.price_modifier.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Price and Quantity */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <p className="text-xs lg:text-sm font-bold text-gray-900">
                          ₹{item.price.toFixed(2)}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Unit price
                        </p>
                      </div>
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            onUpdateQuantity(itemId, item.quantity - 1);
                          }}
                          className="h-5 w-5 p-0 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-6 text-center">
                          <span className="text-xs lg:text-sm font-bold text-gray-900">
                            {item.quantity}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            onUpdateQuantity(itemId, item.quantity + 1);
                          }}
                          className="h-5 w-5 p-0 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {/* Total for this item */}
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-gray-100">
                      <span className="text-[10px] text-gray-600">Total:</span>
                      <span className="text-xs lg:text-sm font-bold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
            {/* Order Summary & Payment (always at bottom, never moves) */}
            <div className="flex-shrink-0 pt-1 pb-1 bg-white">
              {/* Compact Order Summary for Desktop */}
              <div className="hidden lg:block">
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-base">₹{finalTotal.toFixed(2)}</span>
                    <span className="text-xs bg-green-100 text-green-700 rounded px-2 ml-2">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={onClearCart} className="text-red-600 border-red-200 px-2 py-1 h-7">Clear</Button>
                    <Button variant="outline" size="sm" className="px-2 py-1 h-7">Hold</Button>
                    {onProceedToCheckout && (
                      <Button 
                        size="sm" 
                        onClick={onProceedToCheckout}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 h-7"
                      >
                        Checkout
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-xs px-1 mb-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs px-1 mb-1">
                  <span className="text-gray-600">Tax ({(shopDetails.tax_rate * 100).toFixed(1)}%)</span>
                  <span className="font-medium">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm px-1 font-bold border-t pt-1 mt-1">
                  <span>Total</span>
                  <span className="text-green-700">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              {/* Compact Order Summary for Mobile/Tablet (unchanged) */}
              <div className="block lg:hidden">
                <div
                  className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-2 cursor-pointer"
                  onClick={() => setShowSummaryDetails((v) => !v)}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-bold text-base">₹{finalTotal.toFixed(2)}</span>
                    <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 ml-2">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                  </div>
                  <button className="ml-2 text-green-700 focus:outline-none">
                    <svg className={`w-5 h-5 transition-transform ${showSummaryDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {showSummaryDetails && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3 mb-2 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                        Order Summary
                      </h3>
                      <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">₹{total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax ({(shopDetails.tax_rate * 100).toFixed(1)}%)</span>
                        <span className="font-medium">₹{tax.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-green-200 pt-2">
                        <div className="flex justify-between text-base font-bold text-gray-900">
                          <span>Total Amount</span>
                          <span className="text-green-700">₹{finalTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3 pt-3">
                      <Button variant="outline" size="sm" onClick={onClearCart} className="text-red-600 border-red-200">Clear All</Button>
                      <Button variant="outline" size="sm">Hold</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
