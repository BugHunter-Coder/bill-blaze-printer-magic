
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bluetooth, Printer, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { CartItem } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';

interface BluetoothPrinterProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
  onPrinterChange: (printer: BluetoothDevice | null) => void;
  cart: CartItem[];
  total: number;
  onOrderComplete: () => void;
}

export const BluetoothPrinter = ({
  isConnected,
  onConnectionChange,
  onPrinterChange,
  cart,
  total,
  onOrderComplete,
}: BluetoothPrinterProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const { toast } = useToast();

  const connectToPrinter = async () => {
    if (!navigator.bluetooth) {
      toast({
        title: "Bluetooth not supported",
        description: "Your browser doesn't support Web Bluetooth API",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      console.log('Requesting Bluetooth device...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Serial service
        ],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });

      console.log('Connecting to GATT server...');
      const server = await device.gatt?.connect();
      
      if (server) {
        onPrinterChange(device);
        onConnectionChange(true);
        toast({
          title: "Printer connected",
          description: `Successfully connected to ${device.name}`,
        });
        console.log('Connected to printer:', device.name);
      }
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      toast({
        title: "Connection failed",
        description: "Could not connect to printer. Make sure it's in pairing mode.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectPrinter = () => {
    onPrinterChange(null);
    onConnectionChange(false);
    toast({
      title: "Printer disconnected",
      description: "Bluetooth printer has been disconnected",
    });
  };

  const printReceipt = async () => {
    if (!isConnected || cart.length === 0) return;

    setIsPrinting(true);
    try {
      // Simulate printing process
      console.log('Printing receipt...');
      
      // Generate receipt data
      const receiptData = generateReceiptData();
      console.log('Receipt data:', receiptData);
      
      // Simulate print delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Receipt printed",
        description: "Order completed successfully!",
      });
      
      onOrderComplete();
    } catch (error) {
      console.error('Printing error:', error);
      toast({
        title: "Printing failed",
        description: "Could not print receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const generateReceiptData = () => {
    const tax = total * 0.08;
    const finalTotal = total + tax;
    const timestamp = new Date();
    
    return {
      timestamp: timestamp.toLocaleString(),
      items: cart,
      subtotal: total,
      tax: tax,
      total: finalTotal,
      orderNumber: Math.floor(Math.random() * 10000),
    };
  };

  return (
    <Card className="mt-4 mx-4 mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Printer className="h-5 w-5" />
          <span>Thermal Printer</span>
          {isConnected && (
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-3">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your Bluetooth thermal printer to print receipts.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={connectToPrinter}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Bluetooth className="h-4 w-4 mr-2" />
                  Connect Printer
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Printer is ready to print receipts.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={printReceipt}
                disabled={cart.length === 0 || isPrinting}
                className="w-full"
                size="lg"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt & Complete Order
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={disconnectPrinter}
                className="w-full"
                size="sm"
              >
                Disconnect Printer
              </Button>
            </div>
          </div>
        )}

        {cart.length === 0 && isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Add items to cart before printing a receipt.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
