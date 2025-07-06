import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Building2, 
  Wallet,
  Wifi,
  QrCode,
  Radio,
  Apple,
  Zap,
  Shield,
  CheckCircle
} from 'lucide-react';
import { CartItem, Shop } from '@/types/pos';

interface ModernPaymentMethodsProps {
  cart: CartItem[];
  total: number;
  shopDetails: Shop;
  onCompleteOrder: (
    method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other' | 'nfc' | 'qr' | 'digital_wallet',
    directAmount?: number
  ) => Promise<void>;
  printerConnected: boolean;
  onRemoveItem: (itemId: string) => void;
}

const modernPaymentMethods = [
  { 
    value: 'nfc', 
    label: 'NFC/Tap', 
    icon: Radio, 
    color: 'bg-purple-100 text-purple-600',
    description: 'Tap card or phone',
    modern: true
  },
  { 
    value: 'qr', 
    label: 'QR Code', 
    icon: QrCode, 
    color: 'bg-blue-100 text-blue-600',
    description: 'Scan to pay',
    modern: true
  },
  { 
    value: 'digital_wallet', 
    label: 'Digital Wallet', 
    icon: Wallet, 
    color: 'bg-green-100 text-green-600',
    description: 'Apple/Google Pay',
    modern: true
  },
  { 
    value: 'cash', 
    label: 'Cash', 
    icon: DollarSign, 
    color: 'bg-green-100 text-green-600' 
  },
  { 
    value: 'card', 
    label: 'Card', 
    icon: CreditCard, 
    color: 'bg-blue-100 text-blue-600' 
  },
  { 
    value: 'upi', 
    label: 'UPI', 
    icon: Smartphone, 
    color: 'bg-purple-100 text-purple-600' 
  },
  { 
    value: 'bank_transfer', 
    label: 'Bank Transfer', 
    icon: Building2, 
    color: 'bg-orange-100 text-orange-600' 
  },
  { 
    value: 'other', 
    label: 'Other', 
    icon: Wallet, 
    color: 'bg-gray-100 text-gray-600' 
  },
];

export function ModernPaymentMethods({
  cart,
  total,
  shopDetails,
  onCompleteOrder,
  printerConnected,
  onRemoveItem
}: ModernPaymentMethodsProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('nfc');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');

  const tax = total * (shopDetails?.tax_rate || 0);
  const finalTotal = total + tax;

  // Check NFC support
  useEffect(() => {
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
  }, []);

  // Generate QR code data
  useEffect(() => {
    if (showQRCode) {
      const paymentData = {
        amount: finalTotal,
        shopId: shopDetails.id,
        timestamp: Date.now(),
        items: cart.map(item => ({ id: item.id, quantity: item.quantity }))
      };
      setQrCodeData(JSON.stringify(paymentData));
    }
  }, [showQRCode, finalTotal, shopDetails.id, cart]);

  const handleQuickPayment = async (method: string) => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      if (method === 'qr') {
        setShowQRCode(true);
        return;
      }
      
      await onCompleteOrder(method as any);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNFCScan = async () => {
    if (!nfcSupported) {
      alert('NFC not supported on this device');
      return;
    }

    try {
      // @ts-ignore - NDEFReader is experimental
      const ndef = new NDEFReader();
      await ndef.scan();
      
      ndef.addEventListener("reading", ({ message, serialNumber }) => {
        console.log(`NFC Payment from: ${serialNumber}`);
        handleQuickPayment('nfc');
      });
      
    } catch (error) {
      console.error('NFC scan failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Modern Payment Methods */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-600" />
          <h3 className="font-semibold text-sm">Modern Payment Methods</h3>
          <Badge variant="secondary" className="text-xs">Latest</Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {modernPaymentMethods.filter(m => m.modern).map((method) => {
            const Icon = method.icon;
            return (
              <Button
                key={method.value}
                onClick={() => {
                  if (method.value === 'nfc') {
                    handleNFCScan();
                  } else {
                    handleQuickPayment(method.value);
                  }
                }}
                disabled={isProcessing || cart.length === 0 || (method.value === 'nfc' && !nfcSupported)}
                className={`h-20 flex flex-col items-center justify-center gap-1 p-2 relative ${
                  selectedMethod === method.value 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{method.label}</span>
                <span className="text-xs opacity-75">{method.description}</span>
                {method.value === 'nfc' && !nfcSupported && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs">
                    !
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Traditional Payment Methods */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-600" />
          <h3 className="font-semibold text-sm">Traditional Methods</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {modernPaymentMethods.filter(m => !m.modern).map((method) => {
            const Icon = method.icon;
            return (
              <Button
                key={method.value}
                onClick={() => handleQuickPayment(method.value)}
                disabled={isProcessing || cart.length === 0}
                className={`h-16 flex flex-col items-center justify-center gap-1 p-2 ${
                  selectedMethod === method.value 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{method.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <Card className="p-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <QrCode className="h-4 w-4" />
              QR Code Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <div className="text-xs text-gray-600 mb-2">Scan this QR code to pay</div>
              <div className="bg-white p-2 rounded inline-block">
                {/* Placeholder for QR code - in real implementation, use a QR library */}
                <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Amount: ₹{finalTotal.toFixed(2)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowQRCode(false)} 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleQuickPayment('qr')} 
                size="sm"
                className="flex-1"
              >
                Confirm Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Order Total</span>
            <span className="font-bold text-lg">₹{finalTotal.toFixed(2)}</span>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({(shopDetails?.tax_rate || 0) * 100}%):</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>Secure payment processing</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 