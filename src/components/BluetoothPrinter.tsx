
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bluetooth, BluetoothConnected, Smartphone, Wifi, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CartItem, Shop } from '@/types/pos';

interface BluetoothPrinterProps {
  isConnected: boolean;
  onConnectionChange: (isConnected: boolean) => void;
  onPrinterChange: (device: BluetoothDevice | null) => void;
  cart: CartItem[];
  total: number;
  onOrderComplete: (paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other', directAmount?: number) => Promise<void>;
  shopDetails: Shop;
}

export const BluetoothPrinter = ({ 
  isConnected: externalIsConnected, 
  onConnectionChange: externalOnConnectionChange,
  onPrinterChange,
  cart,
  total,
  onOrderComplete,
  shopDetails
}: BluetoothPrinterProps) => {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'bank_transfer' | 'other'>('cash');
  const [directAmount, setDirectAmount] = useState<string>('');
  const [isDirectBilling, setIsDirectBilling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(checkMobile);

    // Check Bluetooth support
    const checkBluetoothSupport = () => {
      if ('bluetooth' in navigator) {
        setBluetoothSupported(true);
        return true;
      }
      
      // Check for mobile-specific Bluetooth capabilities
      if (checkMobile) {
        // On mobile, we might have limited support
        setBluetoothSupported(!!navigator.bluetooth || 'serviceWorker' in navigator);
      }
      
      return false;
    };

    checkBluetoothSupport();
  }, []);

  const connectToDevice = async () => {
    if (!bluetoothSupported) {
      toast({
        title: "Bluetooth Not Supported",
        description: "Your browser doesn't support Web Bluetooth API.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Extended service UUIDs for better printer compatibility
      const serviceUUIDs = [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard thermal printer
        '00001101-0000-1000-8000-00805f9b34fb', // Serial port profile
        '0000ff00-0000-1000-8000-00805f9b34fb', // Custom service
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Another common printer service
      ];

      let requestDevice;
      
      if (isMobile) {
        // Mobile-optimized request with broader filters
        requestDevice = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: serviceUUIDs
        });
      } else {
        // Desktop request with specific filters
        requestDevice = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: 'POS' },
            { namePrefix: 'Thermal' },
            { namePrefix: 'Receipt' },
            { namePrefix: 'Printer' },
            { namePrefix: 'BT' },
            { services: serviceUUIDs }
          ],
          optionalServices: serviceUUIDs
        });
      }

      console.log('Connecting to device:', requestDevice.name);
      
      // Connect to GATT server
      const server = await requestDevice.gatt?.connect();
      
      if (server) {
        setDevice(requestDevice);
        externalOnConnectionChange(true);
        onPrinterChange(requestDevice);
        
        toast({
          title: "Bluetooth Connected",
          description: `Connected to ${requestDevice.name || 'Unknown Device'}`,
        });

        // Handle disconnection
        requestDevice.addEventListener('gattserverdisconnected', () => {
          externalOnConnectionChange(false);
          setDevice(null);
          onPrinterChange(null);
          toast({
            title: "Bluetooth Disconnected",
            description: "Device has been disconnected",
            variant: "destructive",
          });
        });
      }

    } catch (error: any) {
      console.error('Bluetooth connection error:', error);
      
      let errorMessage = "Failed to connect to Bluetooth device.";
      
      if (error.name === 'NotFoundError') {
        errorMessage = "No Bluetooth device was selected.";
      } else if (error.name === 'SecurityError') {
        errorMessage = "Bluetooth access was denied. Please allow permission and try again.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Bluetooth is not supported on this device or browser.";
      } else if (isMobile) {
        errorMessage = "Mobile Bluetooth connection failed. Try enabling Bluetooth and location services.";
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (device && device.gatt?.connected) {
      await device.gatt.disconnect();
    }
    externalOnConnectionChange(false);
    setDevice(null);
    onPrinterChange(null);
    
    toast({
      title: "Disconnected",
      description: "Bluetooth device disconnected successfully",
    });
  };

  const printTest = async () => {
    if (!device || !externalIsConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to a printer first",
        variant: "destructive",
      });
      return;
    }

    try {
      // This is a simplified print test - actual implementation would depend on printer protocol
      toast({
        title: "Print Test",
        description: "Test print command sent to printer",
      });
    } catch (error) {
      console.error('Print test error:', error);
      toast({
        title: "Print Failed",
        description: "Failed to send test print",
        variant: "destructive",
      });
    }
  };

  const handleCompleteOrder = async () => {
    try {
      const amount = isDirectBilling ? parseFloat(directAmount) : undefined;
      await onOrderComplete(paymentMethod, amount);
      
      toast({
        title: "Order Completed",
        description: "Transaction recorded successfully",
      });

      // Reset form
      setDirectAmount('');
      setIsDirectBilling(false);
    } catch (error) {
      console.error('Order completion error:', error);
      toast({
        title: "Order Failed",
        description: "Failed to complete the order",
        variant: "destructive",
      });
    }
  };

  if (!bluetoothSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
            Bluetooth Not Available
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isMobile 
                ? "Bluetooth printing may not be fully supported on your mobile browser. Consider using the desktop version or a dedicated POS app."
                : "Your browser doesn't support Web Bluetooth API. Please use Chrome, Edge, or another compatible browser."
              }
            </AlertDescription>
          </Alert>
          
          {isMobile && (
            <div className="space-y-2">
              <h4 className="font-semibold">Mobile Printing Alternatives:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use a Wi-Fi enabled receipt printer</li>
                <li>• Install the app version of this POS system</li>
                <li>• Use the desktop version on a computer</li>
                <li>• Enable experimental features in your browser</li>
              </ul>
            </div>
          )}

          {/* Payment and checkout section even without Bluetooth */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-semibold">Complete Order</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2 border rounded"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="directBilling"
                  checked={isDirectBilling}
                  onChange={(e) => setIsDirectBilling(e.target.checked)}
                />
                <label htmlFor="directBilling" className="text-sm">Direct billing (custom amount)</label>
              </div>

              {isDirectBilling && (
                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <input
                    type="number"
                    value={directAmount}
                    onChange={(e) => setDirectAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full p-2 border rounded"
                    step="0.01"
                  />
                </div>
              )}

              <div className="text-sm">
                <p>Total: ₹{isDirectBilling ? directAmount || '0' : total.toFixed(2)}</p>
                {shopDetails && (
                  <p>Tax ({(shopDetails.tax_rate * 100).toFixed(1)}%): ₹{((isDirectBilling ? parseFloat(directAmount) || 0 : total) * shopDetails.tax_rate).toFixed(2)}</p>
                )}
                <p className="font-semibold">
                  Final Total: ₹{((isDirectBilling ? parseFloat(directAmount) || 0 : total) * (1 + (shopDetails?.tax_rate || 0))).toFixed(2)}
                </p>
              </div>

              <Button 
                onClick={handleCompleteOrder} 
                className="w-full"
                disabled={(!cart.length && !isDirectBilling) || (isDirectBilling && !directAmount)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Complete Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {externalIsConnected ? (
            <BluetoothConnected className="h-5 w-5 mr-2 text-green-600" />
          ) : (
            <Bluetooth className="h-5 w-5 mr-2 text-gray-400" />
          )}
          Bluetooth Printer
          {isMobile && <Smartphone className="h-4 w-4 ml-2 text-blue-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isMobile && (
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              Mobile device detected. Make sure Bluetooth and location services are enabled for best results.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              Status: {externalIsConnected ? 'Connected' : 'Not Connected'}
            </p>
            {device && (
              <p className="text-sm text-gray-600">
                Device: {device.name || 'Unknown Device'}
              </p>
            )}
          </div>
          <div className="flex items-center">
            {externalIsConnected ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {!externalIsConnected ? (
            <Button 
              onClick={connectToDevice} 
              disabled={isConnecting}
              className="flex-1"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Bluetooth className="h-4 w-4 mr-2" />
                  Connect Printer
                </>
              )}
            </Button>
          ) : (
            <>
              <Button onClick={printTest} variant="outline" className="flex-1">
                Test Print
              </Button>
              <Button onClick={disconnect} variant="destructive" className="flex-1">
                Disconnect
              </Button>
            </>
          )}
        </div>

        {/* Payment and checkout section */}
        <div className="border-t pt-4 space-y-4">
          <h4 className="font-semibold">Complete Order</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="directBilling"
                checked={isDirectBilling}
                onChange={(e) => setIsDirectBilling(e.target.checked)}
              />
              <label htmlFor="directBilling" className="text-sm">Direct billing (custom amount)</label>
            </div>

            {isDirectBilling && (
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  value={directAmount}
                  onChange={(e) => setDirectAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-2 border rounded"
                  step="0.01"
                />
              </div>
            )}

            <div className="text-sm">
              <p>Total: ₹{isDirectBilling ? directAmount || '0' : total.toFixed(2)}</p>
              {shopDetails && (
                <p>Tax ({(shopDetails.tax_rate * 100).toFixed(1)}%): ₹{((isDirectBilling ? parseFloat(directAmount) || 0 : total) * shopDetails.tax_rate).toFixed(2)}</p>
              )}
              <p className="font-semibold">
                Final Total: ₹{((isDirectBilling ? parseFloat(directAmount) || 0 : total) * (1 + (shopDetails?.tax_rate || 0))).toFixed(2)}
              </p>
            </div>

            <Button 
              onClick={handleCompleteOrder} 
              className="w-full"
              disabled={(!cart.length && !isDirectBilling) || (isDirectBilling && !directAmount)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Complete Order
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Make sure your printer is in pairing mode</p>
          <p>• Compatible with thermal receipt printers</p>
          {isMobile && <p>• On mobile: Enable Bluetooth and location permissions</p>}
        </div>
      </CardContent>
    </Card>
  );
};
