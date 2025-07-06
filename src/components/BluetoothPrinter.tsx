import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bluetooth,
  BluetoothConnected,
  Smartphone,
  AlertCircle,
  CheckCircle,
  CreditCard,
  Share,
  Download,
  Apple,
  History,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CartItem, Shop } from '@/types/pos';
import { thermalPrinter, type StoredPrinter } from '@/lib/ThermalPrinter';
import printerManager from '@/lib/PrinterManager';

/* 🔤 Swap ₹→Rs + strip non-ASCII */
const sanitizeForPrinter = (txt: string) =>
  txt
    .replace(/₹/g, 'Rs')
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '');

interface BluetoothPrinterProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  onPrinterChange: (device: BluetoothDevice | null) => void;
  cart: CartItem[];
  total: number;
  onOrderComplete: () => void;
  shopDetails: Shop | null;
}

export const BluetoothPrinter = ({ 
  isConnected: externalIsConnected, 
  onConnectionChange: externalOnConnectionChange,
  onPrinterChange,
  cart,
  total,
  onOrderComplete,
  shopDetails,
}: BluetoothPrinterProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [storedPrinter, setStoredPrinter] = useState<StoredPrinter | null>(null);

  const [paymentMethod, setPaymentMethod] =
    useState<'cash' | 'card' | 'upi' | 'bank_transfer' | 'other'>('cash');
  const [directAmount, setDirectAmount] = useState('');
  const [isDirectBilling, setIsDirectBilling] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Set up system checks
    setIsMobile(thermalPrinter.isMobile());
    setIsIOS(thermalPrinter.isIOS());
    setBluetoothSupported(thermalPrinter.isBluetoothSupported());
    
    // Load stored printer
    const stored = thermalPrinter.getStoredPrinter();
    setStoredPrinter(stored);

    // Set up connection listeners
    const unsubscribeConnection = thermalPrinter.onConnectionChange((connected) => {
      externalOnConnectionChange(connected);
    });

    const unsubscribeDevice = thermalPrinter.onDeviceChange((device) => {
      onPrinterChange(device);
    });

    // Start auto-reconnection
    const stopAutoReconnect = thermalPrinter.startAutoReconnect(15000);

    return () => {
      unsubscribeConnection();
      unsubscribeDevice();
      stopAutoReconnect();
    };
  }, [externalOnConnectionChange, onPrinterChange]);

  const connectToStoredPrinter = async () => {
    if (!storedPrinter || !bluetoothSupported) return;
    
    setIsConnecting(true);
    try {
      const device = await thermalPrinter.connectToStored();
      if (device) {
        toast({ 
          title: 'Reconnected', 
          description: `Connected to ${device.name || storedPrinter.name}` 
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotFoundError') {
        toast({
          title: 'Printer Not Found',
          description: 'The previously connected printer is not available. Make sure it\'s turned on and in range.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Reconnection Failed',
          description: err.message || 'Could not reconnect to stored printer',
          variant: 'destructive',
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const connectToDevice = async () => {
    if (!bluetoothSupported) {
      return toast({
        title: 'Bluetooth Not Supported',
        description: 'Use a compatible browser or device.',
        variant: 'destructive',
      });
    }
    setIsConnecting(true);
    try {
      const device = await thermalPrinter.connect();
      toast({ title: 'Bluetooth Connected', description: device.name || '' });
      
      // Update stored printer state
      const stored = thermalPrinter.getStoredPrinter();
      setStoredPrinter(stored);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Connection Failed',
        description:
          err.message ||
          "Make sure you're on HTTPS, have location permission (Android), and printer is ready.",
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    await thermalPrinter.disconnect();
    toast({ title: 'Disconnected' });
  };

  const printReceipt = async () => {
    if (!externalIsConnected) {
      return toast({ title: 'Not Connected', variant: 'destructive' });
    }
    
    try {
      await printerManager.printReceipt({
        cart,
        total,
        shopDetails,
        directAmount: isDirectBilling ? parseFloat(directAmount) || 0 : undefined,
        toast,
      });
    } catch (error) {
      // Error handling is done inside PrinterManager
      console.error('Print error:', error);
    }
  };

  const shareReceipt = async () => {
    const receipt = generateReceiptText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Receipt from ' + (shopDetails?.name || 'POS'),
          text: receipt,
        });
        toast({ title: 'Receipt Shared' });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          toast({ title: 'Share Failed', variant: 'destructive' });
        }
      }
    } else {
      // Fallback to copy to clipboard
      try {
        await navigator.clipboard.writeText(receipt);
        toast({ title: 'Receipt Copied to Clipboard' });
      } catch (err) {
        toast({ title: 'Copy Failed', variant: 'destructive' });
      }
    }
  };

  const downloadReceipt = () => {
    const receipt = generateReceiptText();
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Receipt Downloaded' });
  };

  const generateReceiptText = () => {
    const WIDTH = 35;
    const divider = '-'.repeat(WIDTH);
    const sub = isDirectBilling ? parseFloat(directAmount) || 0 : total;
    const tax = sub * (shopDetails?.tax_rate || 0);
    const grand = sub + tax;

    let txt = `\n${center(shopDetails?.name || 'POS SYSTEM', WIDTH)}\n`;
    if (shopDetails?.address) txt += center(shopDetails.address, WIDTH) + '\n';
    if (shopDetails?.phone) txt += center(shopDetails.phone, WIDTH) + '\n';
    txt += `\nDate : ${new Date().toLocaleString()}\n`;
    txt += `Bill#: ${Date.now()}\n`;
    txt += `Cashier: Staff\n\n`;

    txt += `Item             QTY   Price    Total\n${divider}\n`;
    cart.forEach((i) => {
      const name = i.name.padEnd(16).slice(0, 16);
      const qty = String(i.quantity).padStart(3);
      const price = i.price.toFixed(2).padStart(7);
      const tot = (i.price * i.quantity).toFixed(2).padStart(7);
      txt += `${name}${qty} ${price} ${tot}\n`;
    });

    txt += `${divider}\n`;
    txt += `Subtotal : ₹${sub.toFixed(2).padStart(10)}\n`;
    txt += `Tax ${((shopDetails?.tax_rate || 0) * 100)
      .toFixed(1)
      .padStart(3)}% : ₹${tax.toFixed(2).padStart(8)}\n`;
    txt += `${divider}\n`;
    txt += `TOTAL    : ₹${grand.toFixed(2).padStart(10)}\n\n`;
    txt += `${center('Thank you for your business!', WIDTH)}\n`;
    txt += `${center('Visit us again soon.', WIDTH)}\n`;

    return txt;
  };

  const center = (txt: string, w: number) => {
    const pad = Math.max(0, Math.floor((w - txt.length) / 2));
    return ' '.repeat(pad) + txt;
  };

  const clearStoredPrinterData = () => {
    thermalPrinter.clearStoredPrinter();
    setStoredPrinter(null);
    toast({ title: 'Stored Printer Cleared' });
  };

  const handleOrderComplete = async () => {
    if (externalIsConnected) {
      await printReceipt();
    }
    onOrderComplete();
  };

  // iOS-specific UI
  if (isIOS) {
    return (
      <Card className="m-2 mt-1 h-full flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="flex items-center text-sm">
            <Apple className="h-4 w-4 mr-2 text-gray-400" />
            iOS Printing
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-3 p-3">
          <Alert className="py-2 flex-shrink-0">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              Web Bluetooth isn't supported on iOS—use Share/Download below.
            </AlertDescription>
          </Alert>
          <div className="grid gap-2 flex-shrink-0">
            <Button onClick={shareReceipt} className="h-8 text-xs">Share Receipt</Button>
            <Button onClick={downloadReceipt} className="h-8 text-xs">Download Receipt</Button>
          </div>
          
          {/* Payment Section */}
          <div className="flex-1 flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Payment Method</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'card', 'upi', 'bank_transfer'] as const).map((method) => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod(method)}
                  className="h-8 text-xs"
                >
                  {method.toUpperCase()}
                </Button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="direct-billing"
                checked={isDirectBilling}
                onChange={(e) => setIsDirectBilling(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="direct-billing" className="text-sm text-gray-700">
                Direct Billing
              </label>
            </div>

            {isDirectBilling && (
              <input
                type="number"
                value={directAmount}
                onChange={(e) => setDirectAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                step="0.01"
              />
            )}

            <Button 
              onClick={handleOrderComplete}
              className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Complete Order
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Bluetooth not supported UI
  if (!bluetoothSupported) {
    return (
      <Card className="m-2 mt-1 h-full flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="flex items-center text-sm">
            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
            Bluetooth Not Available
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-3 p-3">
          <Alert className="py-2 flex-shrink-0">
            <AlertCircle className="h-3 w-3" />
            <AlertDescription className="text-xs">
              Switch to Chrome/Edge or use Share/Download.
            </AlertDescription>
          </Alert>
          <div className="grid gap-2 flex-shrink-0">
            <Button onClick={shareReceipt} className="h-8 text-xs">Share Receipt</Button>
            <Button onClick={downloadReceipt} className="h-8 text-xs">Download Receipt</Button>
          </div>
          
          {/* Payment Section */}
          <div className="flex-1 flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Payment Method</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'card', 'upi', 'bank_transfer'] as const).map((method) => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod(method)}
                  className="h-8 text-xs"
                >
                  {method.toUpperCase()}
                </Button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="direct-billing-2"
                checked={isDirectBilling}
                onChange={(e) => setIsDirectBilling(e.target.checked)}
                className="h-4 w-4 text-blue-600"
              />
              <label htmlFor="direct-billing-2" className="text-sm text-gray-700">
                Direct Billing
              </label>
            </div>

            {isDirectBilling && (
              <input
                type="number"
                value={directAmount}
                onChange={(e) => setDirectAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full p-2 border border-gray-300 rounded text-sm"
                step="0.01"
              />
            )}

            <Button 
              onClick={handleOrderComplete}
              className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              Complete Order
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main UI
  return (
    <Card className="w-full h-full flex flex-col bg-white border border-gray-200 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 lg:pb-3 flex-shrink-0 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <CardTitle className="flex items-center text-sm lg:text-base">
          <div className="bg-white/20 rounded-full p-1 lg:p-1.5 mr-2 lg:mr-3">
            <CreditCard className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm lg:text-base">Payment & Checkout</div>
            <div className="text-xs lg:text-sm text-green-200">
              {externalIsConnected ? 'Thermal printer ready' : 'Connect thermal printer'}
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-3 lg:p-4 space-y-3 lg:space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-2 lg:p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {externalIsConnected ? (
              <BluetoothConnected className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
            ) : (
              <Bluetooth className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
            )}
            <span className="text-sm lg:text-base font-medium text-gray-700">
              {externalIsConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          {externalIsConnected && (
            <Button
              onClick={disconnect}
              variant="outline"
              size="sm"
              className="h-6 lg:h-8 text-xs lg:text-sm"
            >
              Disconnect
            </Button>
          )}
        </div>

        {/* Connection and Test Print Buttons */}
        {!externalIsConnected && (
          <Button 
            onClick={async () => {
              if (storedPrinter) {
                await connectToStoredPrinter();
              } else {
                await connectToDevice();
              }
            }}
            disabled={isConnecting}
            className="w-full h-10 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConnecting ? 'Connecting...' : '🔗 Connect Bluetooth Printer'}
          </Button>
        )}
        
        {/* Test Print Button */}
        {externalIsConnected && (
          <Button 
            onClick={printReceipt}
            className="w-full h-10 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white"
          >
            🖨️ Test Print Receipt
          </Button>
        )}

        {/* Payment Method Selection */}
        <div className="space-y-2 lg:space-y-3">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span className="text-sm lg:text-base font-medium text-gray-700">Payment Method</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 lg:gap-3">
            {(['cash', 'card', 'upi', 'bank_transfer'] as const).map((method) => (
              <Button
                key={method}
                variant={paymentMethod === method ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPaymentMethod(method)}
                className="h-8 lg:h-10 text-xs lg:text-sm"
              >
                {method.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Direct Billing Option */}
        <div className="space-y-2 lg:space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="direct-billing-main"
              checked={isDirectBilling}
              onChange={(e) => setIsDirectBilling(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="direct-billing-main" className="text-sm lg:text-base text-gray-700">
              Direct Billing
            </label>
          </div>

          {isDirectBilling && (
            <div className="flex-shrink-0">
              <label className="block text-sm lg:text-base font-medium text-gray-700 mb-1 lg:mb-2">Custom Amount</label>
              <input
                type="number"
                value={directAmount}
                onChange={(e) => setDirectAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full p-2 lg:p-3 border border-gray-300 rounded-lg text-sm lg:text-base focus:border-green-500 focus:ring-green-500"
                step="0.01"
              />
            </div>
          )}
        </div>

        {/* Complete Order Button - Enhanced and Always Visible */}
        <div className="flex-1 flex items-end pt-2 lg:pt-3">
          <div className="w-full space-y-2">
            <Button 
              onClick={handleOrderComplete}
              className="w-full h-12 lg:h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-base lg:text-lg rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              💳 Complete Order & Print Receipt
            </Button>
            
            {/* Alternative Actions */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={shareReceipt}
                variant="outline"
                size="sm"
                className="h-8 lg:h-10 text-xs lg:text-sm"
              >
                <Share className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                Share
              </Button>
              <Button 
                onClick={downloadReceipt}
                variant="outline"
                size="sm"
                className="h-8 lg:h-10 text-xs lg:text-sm"
              >
                <Download className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* Stored Printer Management */}
        {storedPrinter && (
          <div className="pt-2 lg:pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                <span className="text-xs lg:text-sm text-gray-600">
                  Stored: {storedPrinter.name}
                </span>
              </div>
              <Button
                onClick={clearStoredPrinterData}
                variant="ghost"
                size="sm"
                className="h-6 lg:h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
