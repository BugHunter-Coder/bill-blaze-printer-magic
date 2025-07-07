import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, CreditCard, DollarSign, Smartphone, Building2, Wallet } from 'lucide-react';
import { CartItem, Shop } from '@/types/pos';
import PrinterManager from '@/lib/PrinterManager';
import { useToast } from '@/hooks/use-toast';

interface SingleClickPaymentProps {
  cart: CartItem[];
  total: number;
  shopDetails: Shop;
  onCompleteOrder: (
    method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other',
    directAmount?: number
  ) => Promise<void>;
  printerConnected: boolean;
  onRemoveItem: (itemId: string) => void;
}

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: DollarSign, color: 'bg-green-100 text-green-600' },
  { value: 'card', label: 'Card', icon: CreditCard, color: 'bg-blue-100 text-blue-600' },
  { value: 'upi', label: 'UPI', icon: Smartphone, color: 'bg-purple-100 text-purple-600' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2, color: 'bg-orange-100 text-orange-600' },
  { value: 'other', label: 'Other', icon: Wallet, color: 'bg-gray-100 text-gray-600' },
];

export function SingleClickPayment({
  cart,
  total,
  shopDetails,
  onCompleteOrder,
  printerConnected,
  onRemoveItem
}: SingleClickPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'card' | 'upi' | 'bank_transfer' | 'other'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDirectBilling, setShowDirectBilling] = useState(false);
  const [directAmount, setDirectAmount] = useState('');
  const { toast } = useToast();

  const tax = total * (shopDetails?.tax_rate || 0);
  const finalTotal = total + tax;

  const handleQuickPayment = async (method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other') => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    try {
      // Complete the order
      await onCompleteOrder(method);
      
      // Print receipt using PrinterManager
      if (PrinterManager.isPrinterConnected()) {
        try {
          await PrinterManager.printReceipt({
            cart,
            total,
            shopDetails,
            toast
          });
        } catch (printError) {
          console.error('Print failed:', printError);
          // Don't fail the order if print fails
        }
      }
      
      toast({
        title: 'Payment Successful',
        description: `Order completed via ${method.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Payment failed:', error);
      toast({
        title: 'Payment Failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectBilling = async () => {
    if (!directAmount || parseFloat(directAmount) <= 0) return;
    
    setIsProcessing(true);
    try {
      await onCompleteOrder(selectedMethod, parseFloat(directAmount));
      
      // Print receipt using PrinterManager
      if (PrinterManager.isPrinterConnected()) {
        try {
          await PrinterManager.printReceipt({
            cart,
            total,
            shopDetails,
            directAmount: parseFloat(directAmount),
            toast
          });
        } catch (printError) {
          console.error('Print failed:', printError);
          // Don't fail the order if print fails
        }
      }
      
      toast({
        title: 'Direct Billing Successful',
        description: `Billed ₹${directAmount}`,
      });
    } catch (error) {
      console.error('Direct billing failed:', error);
      toast({
        title: 'Direct Billing Failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Payment Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <Button
              key={method.value}
              onClick={() => handleQuickPayment(method.value as any)}
              disabled={isProcessing || cart.length === 0}
              className={`h-16 flex flex-col items-center justify-center gap-1 p-2 border-2 transition-colors duration-150
                ${selectedMethod === method.value 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{method.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Order Summary */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-bold text-lg">₹{finalTotal.toFixed(2)}</span>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              {cart.length} item{cart.length !== 1 && 's'}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax ({(shopDetails?.tax_rate || 0) * 100}%)</span>
              <span className="font-medium">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-green-200 pt-1">
              <span>Total</span>
              <span className="text-green-700">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-700">Processing payment...</span>
        </div>
      )}
    </div>
  );
} 