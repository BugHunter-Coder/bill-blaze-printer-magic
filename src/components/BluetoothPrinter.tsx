
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bluetooth, Printer, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
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
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [gattServer, setGattServer] = useState<BluetoothRemoteGATTServer | null>(null);
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
        setConnectedDevice(device);
        setGattServer(server);
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
    if (gattServer) {
      gattServer.disconnect();
    }
    setConnectedDevice(null);
    setGattServer(null);
    onPrinterChange(null);
    onConnectionChange(false);
    toast({
      title: "Printer disconnected",
      description: "Bluetooth printer has been disconnected",
    });
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

  const createESCPOSCommands = (receiptData: any) => {
    const ESC = '\x1B';
    const GS = '\x1D';
    
    let commands = '';
    
    // Initialize printer
    commands += ESC + '@';
    
    // Center align
    commands += ESC + 'a' + '\x01';
    
    // Store header
    commands += ESC + '!' + '\x18'; // Double height and width
    commands += 'Bill Blaze POS\n';
    commands += ESC + '!' + '\x00'; // Normal size
    commands += '================================\n';
    
    // Order details
    commands += ESC + 'a' + '\x00'; // Left align
    commands += `Order #: ${receiptData.orderNumber}\n`;
    commands += `Date: ${receiptData.timestamp}\n`;
    commands += '================================\n';
    
    // Items
    receiptData.items.forEach((item: CartItem) => {
      commands += `${item.name}\n`;
      commands += `  ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}\n`;
    });
    
    commands += '================================\n';
    
    // Totals
    commands += ESC + 'a' + '\x02'; // Right align
    commands += `Subtotal: $${receiptData.subtotal.toFixed(2)}\n`;
    commands += `Tax (8%): $${receiptData.tax.toFixed(2)}\n`;
    commands += ESC + '!' + '\x08'; // Emphasized
    commands += `TOTAL: $${receiptData.total.toFixed(2)}\n`;
    commands += ESC + '!' + '\x00'; // Normal
    
    // Footer
    commands += ESC + 'a' + '\x01'; // Center align
    commands += '================================\n';
    commands += 'Thank you for your business!\n';
    commands += 'Visit us again soon!\n\n\n';
    
    // Cut paper
    commands += GS + 'V' + '\x41' + '\x03';
    
    return new TextEncoder().encode(commands);
  };

  const printReceipt = async () => {
    if (!isConnected || cart.length === 0 || !gattServer) return;

    setIsPrinting(true);
    try {
      console.log('Printing receipt...');
      
      // Generate receipt data
      const receiptData = generateReceiptData();
      console.log('Receipt data:', receiptData);
      
      // Get service and characteristic for printing
      const service = await gattServer.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      
      // Create ESC/POS commands
      const printData = createESCPOSCommands(receiptData);
      
      // Send data to printer in chunks
      const chunkSize = 20; // Small chunks for better compatibility
      for (let i = 0; i < printData.length; i += chunkSize) {
        const chunk = printData.slice(i, i + chunkSize);
        await characteristic.writeValue(chunk);
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between chunks
      }
      
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

  const ReceiptPreview = () => {
    const receiptData = generateReceiptData();
    
    return (
      <div className="max-w-sm mx-auto bg-white p-4 font-mono text-sm">
        <div className="text-center border-b-2 border-dashed pb-2 mb-2">
          <h2 className="font-bold text-lg">Bill Blaze POS</h2>
          <p className="text-xs">================================</p>
        </div>
        
        <div className="mb-2">
          <p>Order #: {receiptData.orderNumber}</p>
          <p>Date: {receiptData.timestamp}</p>
          <p className="text-xs">================================</p>
        </div>
        
        <div className="mb-2">
          {receiptData.items.map((item, index) => (
            <div key={index} className="mb-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-xs">
                {item.quantity} x ${item.price.toFixed(2)} = ${(item.quantity * item.price).toFixed(2)}
              </p>
            </div>
          ))}
          <p className="text-xs">================================</p>
        </div>
        
        <div className="text-right mb-2">
          <p>Subtotal: ${receiptData.subtotal.toFixed(2)}</p>
          <p>Tax (8%): ${receiptData.tax.toFixed(2)}</p>
          <p className="font-bold text-lg">TOTAL: ${receiptData.total.toFixed(2)}</p>
        </div>
        
        <div className="text-center border-t-2 border-dashed pt-2">
          <p className="text-xs">================================</p>
          <p className="text-xs">Thank you for your business!</p>
          <p className="text-xs">Visit us again soon!</p>
        </div>
      </div>
    );
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
              {cart.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" size="lg">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Receipt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Receipt Preview</DialogTitle>
                    </DialogHeader>
                    <ReceiptPreview />
                  </DialogContent>
                </Dialog>
              )}
              
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
