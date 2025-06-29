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
import { storePrinter, getStoredPrinter, clearStoredPrinter, StoredPrinter } from '@/lib/utils';

/* 🔤 Swap ₹→Rs + strip non-ASCII */
const sanitizeForPrinter = (txt: string) =>
  txt
    .replace(/₹/g, 'Rs')
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '');

interface BluetoothPrinterProps {
  isConnected: boolean;
  onConnectionChange: (isConnected: boolean) => void;
  onPrinterChange: (device: BluetoothDevice | null) => void;
  cart: CartItem[];
  total: number;
  onOrderComplete: (
    method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other',
    directAmount?: number
  ) => Promise<void>;
  shopDetails: Shop;
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
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
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
    const ua = navigator.userAgent;
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      ua
    );
    const iOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsMobile(mobile);
    setIsIOS(iOS);
    setBluetoothSupported('bluetooth' in navigator && !iOS);
    
    // Load stored printer on component mount
    const stored = getStoredPrinter();
    setStoredPrinter(stored);

    // Attempt auto-reconnect if possible
    let pollingInterval: NodeJS.Timeout | null = null;
    const tryAutoConnect = async () => {
      if (stored && 'bluetooth' in navigator && (navigator.bluetooth as any).getDevices && !externalIsConnected) {
        try {
          const devices: BluetoothDevice[] = await (navigator.bluetooth as any).getDevices();
          const match = devices.find((d) => d.id === stored.id);
          if (match && !match.gatt?.connected) {
            console.log('Attempting auto-reconnect to:', stored.name);
            const srv = await match.gatt?.connect();
            if (srv) {
              setDevice(match);
              externalOnConnectionChange(true);
              onPrinterChange(match);
              toast({ title: 'Auto-connected to printer', description: stored.name });
              match.addEventListener('gattserverdisconnected', () => {
                externalOnConnectionChange(false);
                setDevice(null);
                onPrinterChange(null);
                toast({ title: 'Disconnected', variant: 'destructive' });
              });
            }
          }
        } catch (err: any) {
          // Silent fail, fallback to next poll
          console.log('Auto-reconnect failed, will retry later:', err.message);
        }
      }
    };

    if (stored && 'bluetooth' in navigator && (navigator.bluetooth as any).getDevices) {
      tryAutoConnect(); // initial attempt
      pollingInterval = setInterval(tryAutoConnect, 15000); // poll every 15s
    }

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  const center = (txt: string, w: number) => {
    const pad = Math.max(0, Math.floor((w - txt.length) / 2));
    return ' '.repeat(pad) + txt;
  };

  const generateReceipt = (asciiOnly = false) => {
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

    return asciiOnly ? sanitizeForPrinter(txt) : txt;
  };

  const sendDataInChunks = async (
    ch: BluetoothRemoteGATTCharacteristic,
    data: Uint8Array,
    chunk = 40
  ) => {
    console.log('🔍 DEBUG: Sending data in chunks, total size:', data.length, 'chunk size:', chunk);
    for (let i = 0; i < data.length; i += chunk) {
      const chunkData = data.slice(i, i + chunk);
      console.log('🔍 DEBUG: Sending chunk', Math.floor(i/chunk) + 1, 'of', Math.ceil(data.length/chunk), 'size:', chunkData.length);
      await ch.writeValue(chunkData);
      // Small delay between chunks to prevent buffer overflow
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    console.log('✅ DEBUG: All chunks sent successfully');
  };

  const forceEnglish = async (ch: BluetoothRemoteGATTCharacteristic) => {
    const enc = new TextEncoder();
    console.log('🔍 DEBUG: Sending printer initialization commands');
    await ch.writeValue(enc.encode('\x1B@\x1BM\x01')); // init + Font B
    console.log('✅ DEBUG: Printer initialization sent');
  };

  const resetFont = async (ch: BluetoothRemoteGATTCharacteristic) => {
    const enc = new TextEncoder();
    console.log('🔍 DEBUG: Resetting font');
    await ch.writeValue(enc.encode('\x1BM\x00')); // Font A
    console.log('✅ DEBUG: Font reset sent');
  };

  const printReceipt = async () => {
    console.log('🔍 DEBUG: printReceipt called');
    console.log('🔍 DEBUG: Device state:', { device: !!device, deviceName: device?.name });
    console.log('🔍 DEBUG: Connection state:', { externalIsConnected, deviceConnected: device?.gatt?.connected });
    
    if (!device || !externalIsConnected) {
      console.error('❌ DEBUG: Print failed - not connected:', { device: !!device, externalIsConnected });
      return toast({ title: 'Not Connected', variant: 'destructive' });
    }
    
    try {
      const ascii = generateReceipt(true);
      console.log('🔍 DEBUG: Generated receipt:', ascii);

      console.log('🔍 DEBUG: Connecting to GATT server...');
      const server = await device.gatt?.connect();
      if (!server) {
        console.error('❌ DEBUG: GATT connect failed');
        throw new Error('GATT connect failed');
      }
      console.log('✅ DEBUG: GATT server connected');

      console.log('🔍 DEBUG: Getting primary services...');
      const services = await server.getPrimaryServices();
      console.log('🔍 DEBUG: Found services:', services.length);
      
      let writeChar: BluetoothRemoteGATTCharacteristic | null = null;
      for (const svc of services) {
        console.log('🔍 DEBUG: Checking service:', svc.uuid);
        const chars = await svc.getCharacteristics();
        console.log('🔍 DEBUG: Service characteristics:', chars.length);
        
        writeChar =
          chars.find((c) => c.properties.write || c.properties.writeWithoutResponse) ||
          null;
        if (writeChar) {
          console.log('✅ DEBUG: Found writable characteristic:', writeChar.uuid);
          break;
        }
      }
      
      if (!writeChar) {
        console.error('❌ DEBUG: No writable characteristic found');
        throw new Error('No writable characteristic');
      }

      // Init printer, small font
      console.log('🔍 DEBUG: Initializing printer...');
      await forceEnglish(writeChar);
      console.log('✅ DEBUG: Printer initialized');

      const payload = ascii.replace(/\n/g, '\r\n') + '\n\n\n'; // lines
      console.log('🔍 DEBUG: Sending payload:', payload);

      const bytes = new TextEncoder().encode(payload);
      console.log('🔍 DEBUG: Sending data in chunks, total bytes:', bytes.length);
      await sendDataInChunks(writeChar, bytes);
      console.log('✅ DEBUG: Data sent successfully');

      // back to normal font & cut
      console.log('🔍 DEBUG: Resetting font and cutting...');
      await resetFont(writeChar);
      await writeChar.writeValue(new TextEncoder().encode('\x1DVA\x0A'));
      console.log('✅ DEBUG: Font reset and cut command sent');

      console.log('✅ DEBUG: Print completed successfully');
      toast({ title: 'Printed', description: 'Receipt sent ✅' });
    } catch (e: any) {
      console.error('❌ DEBUG: Print failed:', e);
      console.error('❌ DEBUG: Error details:', { message: e.message, name: e.name, stack: e.stack });
      toast({
        title: 'Print Failed',
        description: e.message || 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const connectToStoredPrinter = async () => {
    if (!storedPrinter || !bluetoothSupported) return;
    
    setIsConnecting(true);
    try {
      const svcUUIDs = [
        '000018f0-0000-1000-8000-00805f9b34fb', // Common printer service
        '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile
        '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10/HM-11 service
        '0000ffe1-0000-1000-8000-00805f9b34fb', // HM-10/HM-11 characteristic
        '0000ff00-0000-1000-8000-00805f9b34fb', // Generic printer service
        '0000ff01-0000-1000-8000-00805f9b34fb', // Generic printer characteristic
      ];
      
      // First try to get the device from previously allowed devices
      if ((navigator.bluetooth as any).getDevices) {
        try {
          const devices: BluetoothDevice[] = await (navigator.bluetooth as any).getDevices();
          const match = devices.find((d) => d.id === storedPrinter.id);
          if (match) {
            const srv = await match.gatt?.connect();
            if (srv) {
              setDevice(match);
              externalOnConnectionChange(true);
              onPrinterChange(match);
              toast({ 
                title: 'Reconnected', 
                description: `Connected to ${storedPrinter.name}` 
              });
              
              match.addEventListener('gattserverdisconnected', () => {
                externalOnConnectionChange(false);
                setDevice(null);
                onPrinterChange(null);
                toast({ title: 'Disconnected', variant: 'destructive' });
              });
              return;
            }
          }
        } catch (err) {
          console.log('Device not found in allowed devices, trying manual connection');
        }
      }
      
      // Fallback to manual device selection
      toast({
        title: 'Select Printer', 
        description: `Please select ${storedPrinter.name} from the device list` 
      });
      
      const dev = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: svcUUIDs,
      });
      
      // Check if this is the stored device
      if (dev.id === storedPrinter.id) {
        const srv = await dev.gatt?.connect();
        if (srv) {
          setDevice(dev);
          externalOnConnectionChange(true);
          onPrinterChange(dev);
          
          // Update stored printer with fresh data
          storePrinter(dev);
          setStoredPrinter({
            id: dev.id,
            name: dev.name || storedPrinter.name,
            timestamp: Date.now()
          });
    
    toast({
            title: 'Reconnected', 
            description: `Connected to ${dev.name || storedPrinter.name}` 
          });
          
          dev.addEventListener('gattserverdisconnected', () => {
            externalOnConnectionChange(false);
            setDevice(null);
            onPrinterChange(null);
            toast({ title: 'Disconnected', variant: 'destructive' });
          });
        }
      } else {
        toast({
          title: 'Device Mismatch',
          description: 'Selected device is not the previously connected printer',
          variant: 'destructive',
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
    console.log('🔍 DEBUG: connectToDevice called');
    console.log('🔍 DEBUG: Bluetooth support:', { bluetoothSupported, hasBluetooth: 'bluetooth' in navigator });
    
    if (!bluetoothSupported) {
      console.error('❌ DEBUG: Bluetooth not supported');
      return toast({
        title: 'Bluetooth Not Supported',
        description: 'Use a compatible browser or device.',
        variant: 'destructive',
      });
    }
    
    setIsConnecting(true);
    try {
      const svcUUIDs = [
        '000018f0-0000-1000-8000-00805f9b34fb', // Common printer service
        '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile
        '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10/HM-11 service
        '0000ffe1-0000-1000-8000-00805f9b34fb', // HM-10/HM-11 characteristic
        '0000ff00-0000-1000-8000-00805f9b34fb', // Generic printer service
        '0000ff01-0000-1000-8000-00805f9b34fb', // Generic printer characteristic
      ];
      console.log('🔍 DEBUG: Requesting device with UUIDs:', svcUUIDs);
      
      const dev = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: svcUUIDs,
      });
      console.log('✅ DEBUG: Device selected:', { id: dev.id, name: dev.name });
      
      console.log('🔍 DEBUG: Connecting to GATT server...');
      const srv = await dev.gatt?.connect();
      if (srv) {
        console.log('✅ DEBUG: GATT server connected');
        setDevice(dev);
        externalOnConnectionChange(true);
        onPrinterChange(dev);
        
        // Store the connected printer
        storePrinter(dev);
        setStoredPrinter({
          id: dev.id,
          name: dev.name || 'Unknown Printer',
          timestamp: Date.now()
        });
        
        console.log('✅ DEBUG: Printer connected and stored');
        toast({ title: 'Bluetooth Connected', description: dev.name || '' });
        
        dev.addEventListener('gattserverdisconnected', () => {
          console.log('🔍 DEBUG: Device disconnected');
          externalOnConnectionChange(false);
          setDevice(null);
          onPrinterChange(null);
          toast({ title: 'Disconnected', variant: 'destructive' });
        });
      } else {
        console.error('❌ DEBUG: GATT server connection failed');
      }
    } catch (err: any) {
      console.error('❌ DEBUG: Connection failed:', err);
      console.error('❌ DEBUG: Error details:', { message: err.message, name: err.name });
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
    if (device?.gatt?.connected) await device.gatt.disconnect();
    externalOnConnectionChange(false);
    setDevice(null);
    onPrinterChange(null);
    toast({ title: 'Disconnected' });
  };

  const clearStoredPrinterData = () => {
    clearStoredPrinter();
    setStoredPrinter(null);
    toast({ title: 'Stored Printer Cleared' });
  };

  const shareReceipt = async () => {
    const txt = generateReceipt();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Receipt', text: txt });
        toast({ title: 'Shared' });
      } catch {
        navigator.clipboard.writeText(txt);
        toast({ title: 'Copied' });
      }
    } else {
      navigator.clipboard.writeText(txt);
      toast({ title: 'Copied' });
    }
  };

  const downloadReceipt = () => {
    const txt = generateReceipt();
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded' });
  };

  const handleCompleteOrder = async () => {
    console.log('🔍 DEBUG: handleCompleteOrder called');
    console.log('🔍 DEBUG: Connection state:', { externalIsConnected, device: !!device });
    console.log('🔍 DEBUG: Cart state:', { cartLength: cart.length, total });
    console.log('🔍 DEBUG: Direct billing:', { isDirectBilling, directAmount });
    
    if (!externalIsConnected) {
      console.error('❌ DEBUG: Order failed - printer not connected');
      toast({ title: 'Printer Not Connected', description: 'Please connect your Bluetooth printer before completing the order.', variant: 'destructive' });
      return;
    }
    
    try {
      console.log('🔍 DEBUG: Calling onOrderComplete...');
      const amt = isDirectBilling ? parseFloat(directAmount) : undefined;
      await onOrderComplete(paymentMethod, amt);
      console.log('✅ DEBUG: Order completed successfully');
      
      toast({ title: 'Order Completed' });
      setDirectAmount('');
      setIsDirectBilling(false);
      
      if (externalIsConnected) {
        console.log('🔍 DEBUG: Starting print process...');
        await printReceipt();
      } else {
        console.log('❌ DEBUG: Skipping print - not connected');
      }
    } catch (error) {
      console.error('❌ DEBUG: Order completion failed:', error);
      toast({ title: 'Order Failed', variant: 'destructive' });
    }
  };

  // Simple test print function
  const testPrint = async () => {
    console.log('🧪 DEBUG: testPrint called');
    if (!device || !externalIsConnected) {
      console.error('❌ DEBUG: Test print failed - not connected');
      return toast({ title: 'Not Connected', variant: 'destructive' });
    }
    
    try {
      console.log('🔍 DEBUG: Starting test print...');
      const server = await device.gatt?.connect();
      if (!server) {
        console.error('❌ DEBUG: GATT connect failed for test print');
        throw new Error('GATT connect failed');
      }
      console.log('✅ DEBUG: GATT server connected for test print');

      const services = await server.getPrimaryServices();
      console.log('🔍 DEBUG: Found services for test print:', services.length);
      
      let writeChar: BluetoothRemoteGATTCharacteristic | null = null;
      for (const svc of services) {
        console.log('🔍 DEBUG: Checking service for test print:', svc.uuid);
        const chars = await svc.getCharacteristics();
        console.log('🔍 DEBUG: Service characteristics for test print:', chars.length);
        
        writeChar = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse) || null;
        if (writeChar) {
          console.log('✅ DEBUG: Found writable characteristic for test print:', writeChar.uuid);
          break;
        }
      }
      
      if (!writeChar) {
        console.error('❌ DEBUG: No writable characteristic found for test print');
        throw new Error('No writable characteristic');
      }

      // Send simple test text
      const testText = '\n\n\n=== TEST PRINT ===\n\nHello World!\n\nThis is a test print.\n\nDate: ' + new Date().toLocaleString() + '\n\n\n\n\n';
      console.log('🔍 DEBUG: Test text to send:', testText);
      
      const bytes = new TextEncoder().encode(testText);
      console.log('🔍 DEBUG: Test data bytes:', bytes.length);
      
      await sendDataInChunks(writeChar, bytes);
      console.log('✅ DEBUG: Test print completed successfully');
      
      toast({ title: 'Test Print Sent', description: 'Check your printer for test output' });
    } catch (e: any) {
      console.error('❌ DEBUG: Test print failed:', e);
      toast({
        title: 'Test Print Failed',
        description: e.message || 'Unknown error',
        variant: 'destructive',
      });
    }
  };

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
          <div className="border-t pt-3 space-y-2 flex-1 flex flex-col min-h-0">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <input
                type="checkbox"
                checked={isDirectBilling}
                onChange={(e) => setIsDirectBilling(e.target.checked)}
                id="directBillingIOS"
              />
              <label htmlFor="directBillingIOS" className="text-xs">
                Direct billing
              </label>
            </div>

            {isDirectBilling && (
              <input
                type="number"
                value={directAmount}
                onChange={(e) => setDirectAmount(e.target.value)}
                placeholder="Custom amount"
                className="w-full p-2 border rounded text-xs flex-shrink-0"
                step="0.01"
              />
            )}

            <div className="flex-1 flex items-end">
              <Button 
                onClick={handleCompleteOrder} 
                className="w-full h-12 md:h-14 text-base md:text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                disabled={
                  (!cart.length && !isDirectBilling) ||
                  (isDirectBilling && !directAmount) ||
                  !externalIsConnected
                }
              >
                <CreditCard className="h-5 w-5 md:h-6 md:w-6 mr-2" /> 
                {cart.length > 0 ? `Complete Order - ₹${(total + (total * (shopDetails?.tax_rate || 0))).toFixed(2)}` : 'Complete Order'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          <div className="border-t pt-3 space-y-2 flex-1 flex flex-col min-h-0">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <input
                type="checkbox"
                checked={isDirectBilling}
                onChange={(e) => setIsDirectBilling(e.target.checked)}
                id="directBillingNoBT"
              />
              <label htmlFor="directBillingNoBT" className="text-xs">
                Direct billing
              </label>
            </div>

            {isDirectBilling && (
              <input
                type="number"
                value={directAmount}
                onChange={(e) => setDirectAmount(e.target.value)}
                placeholder="Custom amount"
                className="w-full p-2 border rounded text-xs flex-shrink-0"
                step="0.01"
              />
            )}

            <div className="flex-1 flex items-end">
              <Button 
                onClick={handleCompleteOrder} 
                className="w-full h-12 md:h-14 text-base md:text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                disabled={
                  (!cart.length && !isDirectBilling) ||
                  (isDirectBilling && !directAmount) ||
                  !externalIsConnected
                }
              >
                <CreditCard className="h-5 w-5 md:h-6 md:w-6 mr-2" /> 
                {cart.length > 0 ? `Complete Order - ₹${(total + (total * (shopDetails?.tax_rate || 0))).toFixed(2)}` : 'Complete Order'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="m-2 lg:m-3 h-full flex flex-col bg-white border-0 shadow-none">
      <CardHeader className="pb-2 lg:pb-3 flex-shrink-0 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center text-sm lg:text-base">
          <div className="bg-white/20 rounded-full p-1 lg:p-1.5 mr-2 lg:mr-3">
            <CreditCard className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm lg:text-base">Payment & Checkout</div>
            <div className="text-xs lg:text-sm text-green-200">
              Complete your order
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-3 lg:space-y-4 p-3 lg:p-4 overflow-hidden">
        {/* Payment Section */}
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-3 lg:p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-base lg:text-lg font-bold text-gray-900 flex items-center">
              <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-1 lg:mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Payment Details
            </h3>
            <div className="bg-green-100 text-green-800 px-2 lg:px-3 py-1 lg:py-2 rounded-full text-xs lg:text-sm font-medium">
              Secure Payment
            </div>
          </div>

          <div className="space-y-3 lg:space-y-4 flex-1 flex flex-col">
            {/* Payment Method */}
            <div className="flex-shrink-0">
              <label className="block text-sm lg:text-base font-medium text-gray-700 mb-1 lg:mb-2">Payment Method</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2 lg:p-3 border border-gray-300 rounded-lg text-sm lg:text-base focus:border-green-500 focus:ring-green-500 bg-white"
              >
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="upi">📱 UPI</option>
                <option value="bank_transfer">🏦 Bank Transfer</option>
                <option value="other">📋 Other</option>
              </select>
            </div>

            {/* Direct Billing Option */}
            <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
              <input
                type="checkbox"
                checked={isDirectBilling}
                onChange={(e) => setIsDirectBilling(e.target.checked)}
                id="directBilling"
                className="w-4 h-4 lg:w-5 lg:h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="directBilling" className="text-sm lg:text-base font-medium text-gray-700">
                Direct billing (custom amount)
              </label>
            </div>

            {/* Custom Amount Input */}
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

            {/* Complete Order Button - Enhanced and Always Visible */}
            <div className="flex-1 flex items-end pt-2 lg:pt-3">
              <Button 
                onClick={handleCompleteOrder} 
                className="w-full h-12 lg:h-14 text-base lg:text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                disabled={
                  (!cart.length && !isDirectBilling) ||
                  (isDirectBilling && !directAmount) ||
                  !externalIsConnected
                }
              >
                <CreditCard className="h-5 w-5 lg:h-6 lg:w-6 mr-2 lg:mr-3" /> 
                {cart.length > 0 ? `Complete Order - ₹${(total + (total * (shopDetails?.tax_rate || 0))).toFixed(2)}` : 'Complete Order'}
              </Button>
            </div>
          </div>
        </div>

        {/* Test Buttons for Debugging */}
        <div className="space-y-2 flex-shrink-0 border-t pt-3">
          <div className="text-xs font-medium text-gray-600 mb-2">Debug Tools:</div>
          <Button 
            onClick={async () => {
              console.log('🧪 DEBUG: Testing sales capture...');
              try {
                await onOrderComplete('cash', 100);
                console.log('✅ DEBUG: Sales test successful');
                toast({ title: 'Sales Test', description: 'Sales capture working ✅' });
              } catch (error) {
                console.error('❌ DEBUG: Sales test failed:', error);
                toast({ title: 'Sales Test Failed', description: error.message, variant: 'destructive' });
              }
            }}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            🧪 Test Sales Capture
          </Button>
          
          <Button 
            onClick={async () => {
              console.log('🧪 DEBUG: Testing print...');
              try {
                await printReceipt();
                console.log('✅ DEBUG: Print test successful');
              } catch (error) {
                console.error('❌ DEBUG: Print test failed:', error);
              }
            }}
            variant="outline"
            size="sm"
            className="w-full text-xs"
            disabled={!externalIsConnected}
          >
            🧪 Test Print (Connected Only)
          </Button>
          
          <Button 
            onClick={async () => {
              console.log('🧪 DEBUG: Testing simple print...');
              try {
                await testPrint();
                console.log('✅ DEBUG: Simple print test successful');
              } catch (error) {
                console.error('❌ DEBUG: Simple print test failed:', error);
              }
            }}
            variant="outline"
            size="sm"
            className="w-full text-xs"
            disabled={!externalIsConnected}
          >
            🧪 Simple Test Print
          </Button>
          
          <Button 
            onClick={() => {
              console.log('🧪 DEBUG: Connection status:', {
                externalIsConnected,
                device: !!device,
                deviceName: device?.name,
                deviceConnected: device?.gatt?.connected,
                bluetoothSupported
              });
              toast({ 
                title: 'Connection Status', 
                description: `Connected: ${externalIsConnected}, Device: ${device?.name || 'None'}` 
              });
            }}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            🔍 Check Connection
          </Button>
        </div>

        <div className="space-y-3 lg:space-y-4 flex-1 flex flex-col">
        </div>
      </CardContent>
    </Card>
  );
};
