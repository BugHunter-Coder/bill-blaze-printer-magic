import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CartItem, Shop } from '@/types/pos';
import { 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Building, 
  Receipt, 
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Bluetooth,
  BluetoothConnected
} from 'lucide-react';
import { printReceiptToBluetoothPrinter } from '@/lib/utils';
import { useMediaQuery } from 'react-responsive';
import React from 'react';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  shopDetails: Shop;
  onCompleteOrder: (
    method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other',
    directAmount?: number
  ) => Promise<void>;
  printerConnected: boolean;
  onPrinterChange: (device: BluetoothDevice | null) => void;
  printerDevice: BluetoothDevice | null;
  toast: (args: { title: string; description?: string; variant?: string }) => void;
  onRemoveItem: (itemId: string) => void;
}

export function PaymentCheckoutModal({
  isOpen,
  onClose,
  cart,
  total,
  shopDetails,
  onCompleteOrder,
  printerConnected,
  onPrinterChange,
  printerDevice,
  toast,
  onRemoveItem
}: PaymentCheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'bank_transfer' | 'other'>('cash');
  const [directAmount, setDirectAmount] = useState('');
  const [isDirectBilling, setIsDirectBilling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);

  const tax = total * (shopDetails?.tax_rate || 0);
  const finalTotal = total + tax;

  const handleCompleteOrder = async () => {
    if (cart.length === 0 && !isDirectBilling) return;
    if (isDirectBilling && !directAmount) return;

    setIsProcessing(true);
    try {
      await onCompleteOrder(paymentMethod, isDirectBilling ? parseFloat(directAmount) : undefined);
      // Print after payment if printer is connected and device is available
      if (printerConnected && printerDevice) {
        try {
          await printReceiptToBluetoothPrinter({
            device: printerDevice,
            cart,
            total,
            shopDetails,
            directAmount: isDirectBilling ? parseFloat(directAmount) : undefined,
            toast,
          });
        } catch (e) {
          // Already handled by toast in utility
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: DollarSign, color: 'bg-green-100 text-green-700' },
    { value: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-100 text-blue-700' },
    { value: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-purple-100 text-purple-700' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building, color: 'bg-orange-100 text-orange-700' },
    { value: 'other', label: 'Other', icon: Receipt, color: 'bg-gray-100 text-gray-700' },
  ];

  useEffect(() => {
    // On modal open or tab focus, check if device is still connected
    const checkConnection = () => {
      if (printerDevice && printerDevice.gatt) {
        if (!printerDevice.gatt.connected) {
          toast({ title: 'Printer Disconnected', variant: 'destructive' });
          onPrinterChange(null);
        }
      } else {
        onPrinterChange(null);
      }
    };
    if (isOpen) {
      window.addEventListener('visibilitychange', checkConnection);
      checkConnection();
    }
    return () => {
      window.removeEventListener('visibilitychange', checkConnection);
    };
  }, [isOpen, printerDevice]);

  // Always register gattserverdisconnected event
  useEffect(() => {
    if (printerDevice && printerDevice.gatt) {
      const handleDisconnect = () => {
        toast({ title: 'Printer Disconnected', variant: 'destructive' });
        onPrinterChange(null);
      };
      printerDevice.addEventListener('gattserverdisconnected', handleDisconnect);
      return () => {
        printerDevice.removeEventListener('gattserverdisconnected', handleDisconnect);
      };
    }
  }, [printerDevice]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="p-0 w-full max-w-lg sm:max-w-2xl md:max-w-3xl h-auto max-h-[90vh] flex flex-col items-stretch justify-stretch rounded-lg
        sm:rounded-lg sm:p-0
        !overflow-visible
        mobile:rounded-none mobile:max-w-full mobile:w-[98vw] mobile:h-[98vh] mobile:p-0 mobile:top-[1vh] mobile:left-[1vw] mobile:max-h-[98vh]"
        style={{
          borderRadius: 'var(--radius, 0.5rem)',
          padding: 0,
        }}
      >
        <DialogHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between gap-2 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <DialogTitle className="text-lg font-semibold">Payment Checkout</DialogTitle>
          </div>
          {/* Bluetooth connectivity indicator only - no toggle */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            printerConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {printerConnected ? (
              <><BluetoothConnected className="h-4 w-4 text-green-600" /> Printer Ready</>
            ) : (
              <><Bluetooth className="h-4 w-4 text-gray-400" /> No Printer</>
            )}
          </div>
        </DialogHeader>
        <div className="flex flex-col md:flex-row gap-4 h-full w-full px-2 pb-4 overflow-y-auto mobile:px-1 mobile:pb-2" style={{ maxHeight: 'calc(98vh - 56px)' }}>
          {/* Left Side - Order Summary (summary only, with expandable details) */}
          <div className="flex-1 flex flex-col min-h-0 text-sm gap-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold">Order</span>
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {cart.length} item{cart.length !== 1 && 's'}
              </Badge>
            </div>
            <div className="flex items-center justify-between cursor-pointer select-none mb-2" onClick={() => setShowDetails(v => !v)}>
              <span className="text-gray-700">{cart.length} item{cart.length !== 1 && 's'} in cart</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            {showDetails && (
              <div className="mb-2 space-y-1 max-h-32 overflow-y-auto">
                {cart.map((item) => {
                  const itemId = item.selectedVariant 
                    ? `${item.id}_${item.selectedVariant.id}`
                    : item.id;
                  return (
                    <div key={itemId} className="flex items-center gap-2 p-1 bg-gray-50 rounded">
                      <div className="w-7 h-7 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{item.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{item.name}</div>
                        {item.selectedVariant && (
                          <div className="text-xs text-gray-600">
                            {item.selectedVariant.name}: {item.selectedVariant.value}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-gray-600">
                            {item.quantity} × ₹{item.price.toFixed(2)}
                          </span>
                          <span className="font-semibold text-sm">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ml-2 text-red-500 hover:text-red-700 p-1 rounded"
                        aria-label="Remove item"
                        onClick={() => onRemoveItem(itemId)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Order Totals */}
            <Card className="bg-green-50 border-green-200 mt-1">
              <CardContent className="p-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({(shopDetails?.tax_rate || 0) * 100}%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-green-200 pt-1 mt-1">
                  <span>Total</span>
                  <span className="text-green-700">₹{finalTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Payment Options */}
          <div className="w-full md:w-80 flex flex-col gap-3 text-sm mobile:w-full">
            {/* Payment Method Selection */}
            <div>
              <div className="font-semibold mb-1">Payment</div>
              {isMobile ? (
                <div className="relative">
                  <button
                    className={`w-full p-3 rounded border text-left flex items-center gap-2 text-base border-blue-500 bg-blue-50`}
                    onClick={() => setPaymentDropdownOpen((v) => !v)}
                  >
                    <span className={`rounded ${paymentMethods.find(m => m.value === paymentMethod)?.color} p-1`}>
                      {paymentMethods.find(m => m.value === paymentMethod)?.icon &&
                        React.createElement(paymentMethods.find(m => m.value === paymentMethod)!.icon, { className: 'h-4 w-4' })}
                    </span>
                    <span className="font-medium">{paymentMethods.find(m => m.value === paymentMethod)?.label}</span>
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </button>
                  {paymentDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border rounded shadow-lg z-20">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <button
                            key={method.value}
                            onClick={() => {
                              setPaymentMethod(method.value as any);
                              setPaymentDropdownOpen(false);
                            }}
                            className={`w-full p-3 rounded border-0 text-left flex items-center gap-2 text-base hover:bg-blue-50 ${
                              paymentMethod === method.value ? 'bg-blue-50' : ''
                            }`}
                          >
                            <span className={`rounded ${method.color} p-1`}><Icon className="h-4 w-4" /></span>
                            <span className="font-medium">{method.label}</span>
                            {paymentMethod === method.value && (
                              <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value as any)}
                        className={`w-full p-3 rounded border text-left flex items-center gap-2 text-sm ${
                          paymentMethod === method.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ minHeight: 48 }}
                      >
                        <span className={`rounded ${method.color} p-1`}><Icon className="h-4 w-4" /></span>
                        <span className="font-medium">{method.label}</span>
                        {paymentMethod === method.value && (
                          <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Direct Billing Option */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={isDirectBilling}
                onChange={(e) => setIsDirectBilling(e.target.checked)}
                id="directBillingModal"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="directBillingModal" className="text-sm font-medium text-gray-700">
                Direct billing
              </label>
            </div>
            {isDirectBilling && (
              <input
                type="number"
                value={directAmount}
                onChange={(e) => setDirectAmount(e.target.value)}
                placeholder="Amount"
                className="w-full p-2 border border-gray-300 rounded text-sm mt-1"
                step="0.01"
                style={{ minHeight: 44 }}
              />
            )}
            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 w-full">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 px-2 text-base w-full"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteOrder}
                className="flex-1 h-12 px-2 bg-green-600 hover:bg-green-700 text-white text-base w-full"
                disabled={
                  isProcessing ||
                  (cart.length === 0 && !isDirectBilling) ||
                  (isDirectBilling && !directAmount)
                }
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Pay & Print
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 