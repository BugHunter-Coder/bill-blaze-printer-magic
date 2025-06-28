import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bluetooth,
  BluetoothConnected,
  Smartphone,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  History,
  Apple,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storePrinter, getStoredPrinter, clearStoredPrinter, StoredPrinter } from '@/lib/utils';

interface BluetoothPrinterNavProps {
  isConnected: boolean;
  onConnectionChange: (isConnected: boolean) => void;
  onPrinterChange: (device: BluetoothDevice | null) => void;
}

export const BluetoothPrinterNav = ({ 
  isConnected: externalIsConnected, 
  onConnectionChange: externalOnConnectionChange,
  onPrinterChange,
}: BluetoothPrinterNavProps) => {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [storedPrinter, setStoredPrinter] = useState<StoredPrinter | null>(null);

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

  const connectToStoredPrinter = async () => {
    if (!storedPrinter || !('bluetooth' in navigator)) return;
    
    setIsConnecting(true);
    try {
      // First try to get from allowed devices
      if ((navigator.bluetooth as any).getDevices) {
        try {
          const devices: BluetoothDevice[] = await (navigator.bluetooth as any).getDevices();
          const match = devices.find((d) => d.id === storedPrinter.id);
          if (match) {
            const server = await match.gatt?.connect();
            if (server) {
              setDevice(match);
              externalOnConnectionChange(true);
              onPrinterChange(match);
              toast({ title: 'Reconnected to printer', description: storedPrinter.name });
              
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
          console.log('Failed to get allowed devices, trying manual selection');
        }
      }
      
      // Fallback to manual device selection
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });
      
      const server = await device.gatt?.connect();
      if (server) {
        setDevice(device);
        externalOnConnectionChange(true);
        onPrinterChange(device);
        storePrinter(device);
        setStoredPrinter({ id: device.id, name: device.name || 'Unknown Printer', timestamp: Date.now() });
        toast({ title: 'Connected to printer', description: device.name || 'Unknown Printer' });
        
        device.addEventListener('gattserverdisconnected', () => {
          externalOnConnectionChange(false);
          setDevice(null);
          onPrinterChange(null);
          toast({ title: 'Disconnected', variant: 'destructive' });
        });
      }
    } catch (err: any) {
      console.error('Connection failed:', err);
      if (err.name === 'NotFoundError') {
        toast({ 
          title: 'Printer not found', 
          description: 'The stored printer is no longer available. Please connect to a new device.',
          variant: 'destructive' 
        });
        clearStoredPrinter();
        setStoredPrinter(null);
      } else {
        toast({ 
          title: 'Connection failed', 
          description: err.message || 'Failed to connect to printer',
          variant: 'destructive' 
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const connectToDevice = async () => {
    if (!('bluetooth' in navigator)) {
      toast({ 
        title: 'Bluetooth not supported', 
        description: 'Please use a supported browser like Chrome or Edge.',
        variant: 'destructive' 
      });
      return;
    }

    setIsConnecting(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });
      
      const server = await device.gatt?.connect();
      if (server) {
        setDevice(device);
        externalOnConnectionChange(true);
        onPrinterChange(device);
        storePrinter(device);
        setStoredPrinter({ id: device.id, name: device.name || 'Unknown Printer', timestamp: Date.now() });
        toast({ title: 'Connected to printer', description: device.name || 'Unknown Printer' });
        
        device.addEventListener('gattserverdisconnected', () => {
          externalOnConnectionChange(false);
          setDevice(null);
          onPrinterChange(null);
          toast({ title: 'Disconnected', variant: 'destructive' });
        });
      }
    } catch (err: any) {
      console.error('Connection failed:', err);
      if (err.name !== 'NotFoundError') {
        toast({ 
          title: 'Connection failed', 
          description: err.message || 'Failed to connect to printer',
          variant: 'destructive' 
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (device && device.gatt?.connected) {
      device.gatt.disconnect();
    }
    setDevice(null);
    externalOnConnectionChange(false);
    onPrinterChange(null);
    toast({ title: 'Disconnected from printer' });
  };

  const clearStoredPrinterData = () => {
    clearStoredPrinter();
    setStoredPrinter(null);
    toast({ title: 'Stored printer cleared' });
  };

  if (isIOS) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-gray-100 rounded-lg p-1">
          <Apple className="h-4 w-4 text-gray-400" />
        </div>
        <Badge variant="outline" className="text-xs">
          iOS - No Bluetooth
        </Badge>
      </div>
    );
  }

  if (!bluetoothSupported) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-red-100 rounded-lg p-1">
          <AlertCircle className="h-4 w-4 text-red-500" />
        </div>
        <Badge variant="outline" className="text-xs">
          No Bluetooth
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Connection Status */}
      <div className={`rounded-lg p-1 ${externalIsConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
        {externalIsConnected ? (
          <BluetoothConnected className="h-4 w-4 text-green-600" />
        ) : (
          <Bluetooth className="h-4 w-4 text-gray-500" />
        )}
      </div>

      {/* Status Badge */}
      <Badge 
        variant={externalIsConnected ? "default" : "outline"} 
        className={`text-xs ${externalIsConnected ? 'bg-green-600' : ''}`}
      >
        {externalIsConnected ? 'Connected' : 'Disconnected'}
      </Badge>

      {/* Connection Actions */}
      {!externalIsConnected ? (
        <div className="flex items-center space-x-1">
          {storedPrinter && (
            <Button
              onClick={connectToStoredPrinter}
              disabled={isConnecting}
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {isConnecting ? '...' : 'Reconnect'}
            </Button>
          )}
          <Button 
            onClick={connectToDevice} 
            disabled={isConnecting}
            size="sm"
            className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      ) : (
        <Button 
          onClick={disconnect} 
          variant="destructive" 
          size="sm"
          className="h-7 px-2 text-xs"
        >
          Disconnect
        </Button>
      )}

      {/* Mobile indicator */}
      {isMobile && (
        <div className="bg-blue-100 rounded-lg p-1">
          <Smartphone className="h-3 w-3 text-blue-600" />
        </div>
      )}
    </div>
  );
}; 