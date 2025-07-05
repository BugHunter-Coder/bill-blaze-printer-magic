import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  Settings, 
  Printer, 
  Store,
  Bluetooth,
  BluetoothConnected
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { storePrinter, getStoredPrinter, clearStoredPrinter, StoredPrinter } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface POSHeaderProps {
  shopName: string;
  user: User;
  printerConnected: boolean;
  onPrinterToggle: (connected: boolean) => void;
  onPrinterChange: (device: BluetoothDevice | null) => void;
  printerDevice: BluetoothDevice | null;
}

export function POSHeader({ 
  shopName, 
  user, 
  printerConnected, 
  onPrinterToggle,
  onPrinterChange,
  printerDevice
}: POSHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [storedPrinter, setStoredPrinter] = useState<StoredPrinter | null>(null);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);

  useEffect(() => {
    // Check Bluetooth support
    setBluetoothSupported('bluetooth' in navigator);
    
    // Load stored printer
    const stored = getStoredPrinter();
    setStoredPrinter(stored);
    // On mount or tab focus, check if device is still connected
    const checkConnection = () => {
      if (printerDevice && printerDevice.gatt) {
        if (!printerDevice.gatt.connected) {
          onPrinterToggle(false);
          onPrinterChange(null);
        }
      } else {
        onPrinterToggle(false);
        onPrinterChange(null);
      }
    };
    window.addEventListener('visibilitychange', checkConnection);
    checkConnection();
    return () => {
      window.removeEventListener('visibilitychange', checkConnection);
    };
  }, [printerDevice]);

  // Always register gattserverdisconnected event
  useEffect(() => {
    if (printerDevice && printerDevice.gatt) {
      const handleDisconnect = () => {
        onPrinterToggle(false);
        onPrinterChange(null);
        toast({ title: 'Printer Disconnected', variant: 'destructive' });
      };
      printerDevice.addEventListener('gattserverdisconnected', handleDisconnect);
      return () => {
        printerDevice.removeEventListener('gattserverdisconnected', handleDisconnect);
      };
    }
  }, [printerDevice]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
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
              onPrinterChange(match);
              onPrinterToggle(true);
              toast({ 
                title: 'Reconnected', 
                description: `Connected to ${storedPrinter.name}` 
              });
              
              match.addEventListener('gattserverdisconnected', () => {
                onPrinterToggle(false);
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
          onPrinterChange(dev);
          onPrinterToggle(true);
          
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
            onPrinterToggle(false);
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

  const setupNewPrinter = async () => {
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
        onPrinterChange(dev);
        onPrinterToggle(true);
        
        // Store the connected printer
        storePrinter(dev);
        setStoredPrinter({
          id: dev.id,
          name: dev.name || 'Unknown Printer',
          timestamp: Date.now()
        });
        
        toast({ title: 'Bluetooth Connected', description: dev.name || '' });
        dev.addEventListener('gattserverdisconnected', () => {
          onPrinterToggle(false);
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

  const disconnectPrinter = async () => {
    if (printerDevice?.gatt?.connected) await printerDevice.gatt.disconnect();
    onPrinterToggle(false);
    onPrinterChange(null);
    toast({ title: 'Disconnected' });
  };

  const clearStoredPrinterData = () => {
    clearStoredPrinter();
    setStoredPrinter(null);
    onPrinterToggle(false);
    onPrinterChange(null);
    toast({ title: 'Stored Printer Cleared' });
  };

  const handlePrinterAction = () => {
    if (printerConnected) {
      disconnectPrinter();
    } else if (storedPrinter) {
      connectToStoredPrinter();
    } else {
      setupNewPrinter();
    }
  };

  return (
    <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Store className="h-5 w-5 text-primary" />
        <div>
          <h1 className="font-semibold text-card-foreground">{shopName}</h1>
          <p className="text-xs text-muted-foreground">Point of Sale</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Printer Management */}
        <div className="flex items-center gap-2">
          <Button
            variant={printerConnected ? "default" : "outline"}
            size="sm"
            onClick={handlePrinterAction}
            disabled={isConnecting}
            className="hidden sm:flex"
          >
            {printerConnected ? (
              <BluetoothConnected className="h-4 w-4 mr-2" />
            ) : (
              <Bluetooth className="h-4 w-4 mr-2" />
            )}
            {isConnecting ? 'Connecting...' : storedPrinter ? storedPrinter.name : 'Setup Printer'}
            <Badge 
              variant={printerConnected ? "secondary" : "destructive"}
              className="ml-2 text-xs"
            >
              {printerConnected ? 'ON' : 'OFF'}
            </Badge>
          </Button>

          {/* Printer Management Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Printer className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {storedPrinter && (
                <DropdownMenuItem onClick={connectToStoredPrinter} disabled={isConnecting}>
                  <BluetoothConnected className="h-4 w-4 mr-2" />
                  Reconnect to {storedPrinter.name}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={setupNewPrinter} disabled={isConnecting}>
                <Bluetooth className="h-4 w-4 mr-2" />
                Setup New Printer
              </DropdownMenuItem>
              {storedPrinter && (
                <DropdownMenuItem onClick={clearStoredPrinterData} className="text-destructive">
                  <Printer className="h-4 w-4 mr-2" />
                  Clear Stored Printer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <span className="hidden sm:inline">{user.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/dashboard')}>
              <Settings className="h-4 w-4 mr-2" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}