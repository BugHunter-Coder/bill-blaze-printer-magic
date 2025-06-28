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
    for (let i = 0; i < data.length; i += chunk) {
      await ch.writeValue(data.slice(i, i + chunk));
    }
  };

  const forceEnglish = async (ch: BluetoothRemoteGATTCharacteristic) => {
    const enc = new TextEncoder();
    await ch.writeValue(enc.encode('\x1B@\x1BM\x01')); // init + Font B
  };

  const resetFont = async (ch: BluetoothRemoteGATTCharacteristic) => {
    const enc = new TextEncoder();
    await ch.writeValue(enc.encode('\x1BM\x00')); // Font A
  };

  const printReceipt = async () => {
    if (!device || !externalIsConnected) {
      return toast({ title: 'Not Connected', variant: 'destructive' });
    }
    try {
      const ascii = generateReceipt(true);
      console.log('Receipt:', ascii);

      const server = await device.gatt?.connect();
      if (!server) throw new Error('GATT connect failed');

      const services = await server.getPrimaryServices();
      let writeChar: BluetoothRemoteGATTCharacteristic | null = null;
      for (const svc of services) {
        const chars = await svc.getCharacteristics();
        writeChar =
          chars.find((c) => c.properties.write || c.properties.writeWithoutResponse) ||
          null;
        if (writeChar) break;
      }
      if (!writeChar) throw new Error('No writable characteristic');

      // Init printer, small font
      await forceEnglish(writeChar);

      const payload =
        ascii.replace(/\n/g, '\r\n') + '\n\n\n'; // lines

      const bytes = new TextEncoder().encode(payload);
      await sendDataInChunks(writeChar, bytes);

      // back to normal font & cut
      await resetFont(writeChar);
      await writeChar.writeValue(new TextEncoder().encode('\x1DVA\x0A'));

      toast({ title: 'Printed', description: 'Receipt sent ✅' });
    } catch (e: any) {
      console.error(e);
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
        '000018f0-0000-1000-8000-00805f9b34fb',
        '00001101-0000-1000-8000-00805f9b34fb',
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
    if (!bluetoothSupported) {
      return toast({
        title: 'Bluetooth Not Supported',
        description: 'Use a compatible browser or device.',
        variant: 'destructive',
      });
    }
    setIsConnecting(true);
    try {
      const svcUUIDs = [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '00001101-0000-1000-8000-00805f9b34fb',
      ];
      const dev = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: svcUUIDs,
      });
      const srv = await dev.gatt?.connect();
      if (srv) {
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
        
        toast({ title: 'Bluetooth Connected', description: dev.name || '' });
        dev.addEventListener('gattserverdisconnected', () => {
          externalOnConnectionChange(false);
          setDevice(null);
          onPrinterChange(null);
          toast({ title: 'Disconnected', variant: 'destructive' });
        });
      }
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
    try {
      const amt = isDirectBilling ? parseFloat(directAmount) : undefined;
      await onOrderComplete(paymentMethod, amt);
      toast({ title: 'Order Completed' });
      setDirectAmount('');
      setIsDirectBilling(false);
      if (externalIsConnected) await printReceipt();
    } catch {
      toast({ title: 'Order Failed', variant: 'destructive' });
    }
  };

  if (isIOS) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Apple className="h-5 w-5 mr-2 text-gray-400" />
            iOS Printing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Web Bluetooth isn't supported on iOS—use Share/Download below.
            </AlertDescription>
          </Alert>
          <div className="grid gap-2">
            <Button onClick={shareReceipt}>Share Receipt</Button>
            <Button onClick={downloadReceipt}>Download Receipt</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

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
              Switch to Chrome/Edge or use Share/Download.
            </AlertDescription>
          </Alert>
          <div className="grid gap-2">
            <Button onClick={shareReceipt}>Share Receipt</Button>
            <Button onClick={downloadReceipt}>Download Receipt</Button>
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
        <div className="flex items-center justify-between">
          <p className="font-medium">
            Status: {externalIsConnected ? 'Connected' : 'Not Connected'}
          </p>
          {externalIsConnected ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Stored Printer Info */}
        {storedPrinter && !externalIsConnected && (
          <Alert>
            <History className="h-4 w-4" />
            <AlertDescription>
              Previously connected: <strong>{storedPrinter.name}</strong>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {!externalIsConnected ? (
            <>
              {storedPrinter && (
                <Button
                  onClick={connectToStoredPrinter}
                  disabled={isConnecting}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isConnecting ? 'Reconnecting…' : 'Reconnect'}
                </Button>
              )}
              <Button
                onClick={connectToDevice}
                disabled={isConnecting}
                className="flex-1"
              >
                {isConnecting ? 'Connecting…' : 'Connect New'}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={printReceipt} className="flex-1">
                Print Receipt
              </Button>
              <Button onClick={disconnect} variant="destructive" className="flex-1">
                Disconnect
              </Button>
            </>
          )}
        </div>

        {/* Clear stored printer button */}
        {storedPrinter && !externalIsConnected && (
          <Button
            onClick={clearStoredPrinterData}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            Clear Stored Printer
          </Button>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Button onClick={shareReceipt} variant="outline" size="sm">
            <Share className="h-4 w-4 mr-1" /> Share
          </Button>
          <Button onClick={downloadReceipt} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Download
          </Button>
          <Button
            onClick={() => navigator.clipboard.writeText(generateReceipt())}
            variant="outline"
            size="sm"
          >
            Copy
          </Button>
        </div>

        <div className="border-t pt-4 space-y-3">
          <label className="block text-sm font-medium">Payment Method</label>
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isDirectBilling}
              onChange={(e) => setIsDirectBilling(e.target.checked)}
              id="directBilling"
            />
            <label htmlFor="directBilling" className="text-sm">
              Direct billing
            </label>
          </div>

          {isDirectBilling && (
            <input
              type="number"
              value={directAmount}
              onChange={(e) => setDirectAmount(e.target.value)}
              placeholder="Custom amount"
              className="w-full p-2 border rounded"
              step="0.01"
            />
          )}

          <Button
            onClick={handleCompleteOrder}
            className="w-full"
            disabled={
              (!cart.length && !isDirectBilling) ||
              (isDirectBilling && !directAmount)
            }
          >
            <CreditCard className="h-4 w-4 mr-2" /> Complete Order
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
