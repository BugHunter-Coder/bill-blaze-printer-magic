import { toast } from '@/hooks/use-toast';

// Types
export interface StoredPrinter {
  id: string;
  name: string;
  timestamp: number;
}

export interface ReceiptData {
  cart: any[];
  total: number;
  shopDetails: any;
  directAmount?: number;
  template?: string;
  logoUrl?: string | null;
  headerLines?: string[];
  footerLines?: string[];
  headerAlign?: string;
  footerAlign?: string;
  paperWidth?: number;
}

export interface PrintOptions {
  showToast?: boolean;
  autoCut?: boolean;
  paperWidth?: number;
}

// Thermal printer service UUIDs
const THERMAL_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer service
  '00001101-0000-1000-8000-00805f9b34fb', // Serial port profile
  '0000fee7-0000-1000-8000-00805f9b34fb', // Another common service
];

// Storage utilities
const PRINTER_STORAGE_KEY = 'bluetooth_printer_device';

export class ThermalPrinter {
  private device: BluetoothDevice | null = null;
  private isConnecting: boolean = false;
  private connectionListeners: Array<(connected: boolean) => void> = [];
  private deviceListeners: Array<(device: BluetoothDevice | null) => void> = [];

  // Singleton pattern
  private static instance: ThermalPrinter;
  
  static getInstance(): ThermalPrinter {
    if (!ThermalPrinter.instance) {
      ThermalPrinter.instance = new ThermalPrinter();
    }
    return ThermalPrinter.instance;
  }

  // Device management
  setDevice(device: BluetoothDevice | null) {
    this.device = device;
    (window as any).printerDevice = device;
    this.notifyDeviceListeners(device);
    console.log('ThermalPrinter: Device set', device?.name);
  }

  getDevice(): BluetoothDevice | null {
    return this.device || (window as any).printerDevice || null;
  }

  isConnected(): boolean {
    const device = this.getDevice();
    return !!(device && device.gatt?.connected);
  }

  // Connection management
  async connect(): Promise<BluetoothDevice> {
    if (this.isConnecting) {
      console.warn('[ThermalPrinter] Connection already in progress');
      throw new Error('Connection already in progress');
    }
    if (!this.isBluetoothSupported()) {
      console.error('[ThermalPrinter] Bluetooth not supported');
      throw new Error('Bluetooth not supported on this device/browser');
    }
    this.isConnecting = true;
    try {
      console.log('[ThermalPrinter] Requesting Bluetooth device...');
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: THERMAL_PRINTER_SERVICES,
      });
      console.log('[ThermalPrinter] Device selected:', device);
      const server = await device.gatt?.connect();
      if (!server) {
        console.error('[ThermalPrinter] Failed to connect to GATT server');
        throw new Error('Failed to connect to GATT server');
      }
      this.setDevice(device);
      this.notifyConnectionListeners(true);
      this.setupDisconnectListener(device);
      this.storePrinter(device);
      console.log('[ThermalPrinter] Connected and device stored:', device);
      return device;
    } catch (error: any) {
      console.error('[ThermalPrinter] Connection failed', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async connectToStored(): Promise<BluetoothDevice | null> {
    const stored = this.getStoredPrinter();
    if (!stored) {
      return null;
    }

    if (!this.isBluetoothSupported()) {
      throw new Error('Bluetooth not supported on this device/browser');
    }

    this.isConnecting = true;

    try {
      // Try to get from previously allowed devices
      if ((navigator.bluetooth as any).getDevices) {
        try {
          const devices: BluetoothDevice[] = await (navigator.bluetooth as any).getDevices();
          const match = devices.find((d) => d.id === stored.id);
          if (match) {
            const server = await match.gatt?.connect();
            if (server) {
              this.setDevice(match);
              this.notifyConnectionListeners(true);
              this.setupDisconnectListener(match);
              return match;
            }
          }
        } catch (err) {
          console.log('Failed to get allowed devices, trying manual selection');
        }
      }

      // Fallback to manual device selection
      toast({
        title: 'Select Printer',
        description: `Please select ${stored.name} from the device list`
      });

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: THERMAL_PRINTER_SERVICES,
      });

      if (device.id === stored.id) {
        const server = await device.gatt?.connect();
        if (server) {
          this.setDevice(device);
          this.notifyConnectionListeners(true);
          this.setupDisconnectListener(device);
          this.storePrinter(device);
          return device;
        }
      } else {
        throw new Error('Selected device is not the previously connected printer');
      }

      return null;
    } catch (error: any) {
      console.error('ThermalPrinter: Reconnection failed', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    const device = this.getDevice();
    if (device?.gatt?.connected) {
      await device.gatt.disconnect();
    }
    this.setDevice(null);
    this.notifyConnectionListeners(false);
  }

  // Printing functionality
  async printReceipt(data: ReceiptData, options: PrintOptions = {}): Promise<void> {
    const device = this.getDevice();
    if (!device) {
      const error = 'No printer connected';
      if (options.showToast) {
        toast({ title: 'No Printer', description: error, variant: 'destructive' });
      }
      console.error('[ThermalPrinter] No printer connected');
      throw new Error(error);
    }
    if (!device.gatt?.connected) {
      const error = 'Printer not connected';
      if (options.showToast) {
        toast({ title: 'Printer Disconnected', description: 'Please reconnect your printer.', variant: 'destructive' });
      }
      console.error('[ThermalPrinter] Printer not connected');
      throw new Error(error);
    }
    try {
      console.log('[ThermalPrinter] Starting printReceipt with data:', data);
      const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
      if (!server) {
        console.error('[ThermalPrinter] GATT connection failed');
        throw new Error('GATT connection failed');
      }
      const writeChar = await this.findWritableCharacteristic(server);
      if (!writeChar) {
        console.error('[ThermalPrinter] No writable characteristic found');
        throw new Error('No writable characteristic found');
      }
      console.log('[ThermalPrinter] Found writable characteristic:', writeChar);
      await this.initializePrinter(writeChar);
      console.log('[ThermalPrinter] Printer initialized');

      // Print logo if present and template is modern
      if (data.template === 'modern' && data.logoUrl) {
        try {
          // Always use GS v 0 for Epson compatibility
          const logoBytes = await this.convertImageToEscPos(data.logoUrl, options.paperWidth || 35, 'GSv0');
          if (logoBytes) {
            await this.sendDataInChunks(writeChar, logoBytes, 20);
            console.log('[ThermalPrinter] Logo image sent to printer (GS v 0)');
          } else {
            throw new Error('Logo image conversion failed');
          }
        } catch (e) {
          console.error('[ThermalPrinter] Logo print failed:', e);
          if (options.showToast) {
            toast({ title: 'Logo Print Failed', description: String(e), variant: 'destructive' });
          }
        }
      }

      const receipt = this.generateReceipt(data, options.paperWidth || 35);
      console.log('[ThermalPrinter] Generated receipt:', receipt);
      await this.sendReceipt(writeChar, receipt);
      console.log('[ThermalPrinter] Receipt sent to printer');
      if (options.autoCut !== false) {
        await this.cutPaper(writeChar);
        console.log('[ThermalPrinter] Cut command sent');
      }
      if (options.showToast) {
        toast({ title: 'Printed Successfully', description: 'Receipt sent to thermal printer ✅' });
      }
    } catch (error: any) {
      console.error('[ThermalPrinter] Print error', error);
      if (options.showToast) {
        toast({
          title: 'Print Failed',
          description: `Printing error: ${error.message}. Make sure the thermal printer is connected and has paper.`,
          variant: 'destructive',
        });
      }
      throw error;
    }
  }

  // Receipt generation
  private generateReceipt(data: ReceiptData, width: number = 35): string {
    const { cart, total, shopDetails, directAmount, headerAlign = 'center', footerAlign = 'center', headerLines = [], footerLines = [] } = data;
    const divider = '-'.repeat(width);
    const sub = directAmount || total;
    const tax = sub * (shopDetails?.tax_rate || 0);
    const grand = sub + tax;

    let receipt = `\n${this.alignText(shopDetails?.name || 'POS SYSTEM', width, headerAlign)}\n`;
    
    if (shopDetails?.address) {
      receipt += this.alignText(shopDetails.address, width, headerAlign) + '\n';
    }
    if (shopDetails?.phone) {
      receipt += this.alignText(shopDetails.phone, width, headerAlign) + '\n';
    }
    
    // Add custom header lines
    headerLines.forEach(line => {
      if (line.trim()) {
        receipt += this.alignText(line.trim(), width, headerAlign) + '\n';
      }
    });
    
    receipt += `\nDate : ${new Date().toLocaleString()}\n`;
    receipt += `Bill#: ${Date.now()}\n`;
    receipt += `Cashier: Staff\n\n`;

    receipt += `Item             QTY   Price    Total\n${divider}\n`;
    
    cart.forEach((item) => {
      const name = item.name.padEnd(16).slice(0, 16);
      const qty = String(item.quantity).padStart(3);
      const price = item.price.toFixed(2).padStart(7);
      const tot = (item.price * item.quantity).toFixed(2).padStart(7);
      receipt += `${name}${qty} ${price} ${tot}\n`;
    });

    receipt += `${divider}\n`;
    receipt += `Subtotal : ₹${sub.toFixed(2).padStart(10)}\n`;
    receipt += `Tax ${((shopDetails?.tax_rate || 0) * 100).toFixed(1).padStart(3)}% : ₹${tax.toFixed(2).padStart(8)}\n`;
    receipt += `${divider}\n`;
    receipt += `TOTAL    : ₹${grand.toFixed(2).padStart(10)}\n\n`;
    
    // Add custom footer lines
    footerLines.forEach(line => {
      if (line.trim()) {
        receipt += this.alignText(line.trim(), width, footerAlign) + '\n';
      }
    });
    
    receipt += `${this.alignText('Thank you for your business!', width, footerAlign)}\n`;
    receipt += `${this.alignText('Visit us again soon.', width, footerAlign)}\n`;

    return this.sanitizeForPrinter(receipt);
  }

  // Utility methods
  private alignText(text: string, width: number, alignment: string = 'center'): string {
    if (alignment === 'left') return text;
    if (alignment === 'right') {
      const pad = Math.max(0, width - text.length);
      return ' '.repeat(pad) + text;
    }
    // center (default)
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(pad) + text;
  }

  private center(text: string, width: number): string {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(pad) + text;
  }

  private sanitizeForPrinter(text: string): string {
    return text
      .replace(/₹/g, 'Rs')
      .normalize('NFKD')
      .replace(/[^\x00-\x7F]/g, '');
  }

  private async findWritableCharacteristic(server: BluetoothRemoteGATTServer): Promise<BluetoothRemoteGATTCharacteristic | null> {
    // Try known thermal printer services first
    for (const serviceUuid of THERMAL_PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const chars = await service.getCharacteristics();
        const writeChar = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse) || null;
        if (writeChar) {
          console.log('Found thermal printer service:', serviceUuid);
          return writeChar;
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback to all services
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const chars = await service.getCharacteristics();
      const writeChar = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse) || null;
      if (writeChar) {
        return writeChar;
      }
    }

    return null;
  }

  private async initializePrinter(characteristic: BluetoothRemoteGATTCharacteristic): Promise<void> {
    const initCommands = new Uint8Array([
      0x1B, 0x40, // ESC @ - Initialize printer
      0x1D, 0x21, 0x00, // GS ! - Normal size
    ]);
    await characteristic.writeValue(initCommands);
  }

  private async sendReceipt(characteristic: BluetoothRemoteGATTCharacteristic, receipt: string): Promise<void> {
    const payload = receipt.replace(/\n/g, '\r\n') + '\r\n\r\n\r\n';
    const bytes = new TextEncoder().encode(payload);
    await this.sendDataInChunks(characteristic, bytes, 20);
  }

  private async sendDataInChunks(
    characteristic: BluetoothRemoteGATTCharacteristic,
    data: Uint8Array,
    chunkSize: number = 100
  ): Promise<void> {
    for (let i = 0; i < data.length; i += chunkSize) {
      await characteristic.writeValue(data.slice(i, i + chunkSize));
    }
  }

  private async cutPaper(characteristic: BluetoothRemoteGATTCharacteristic): Promise<void> {
    const cutCommands = new Uint8Array([
      0x1D, 0x56, 0x41, 0x0A, // GS V A - Full cut
    ]);
    await characteristic.writeValue(cutCommands);
  }

  private setupDisconnectListener(device: BluetoothDevice): void {
    device.addEventListener('gattserverdisconnected', () => {
      this.setDevice(null);
      this.notifyConnectionListeners(false);
      toast({ title: 'Printer Disconnected', variant: 'destructive' });
    });
  }

  // Storage methods
  private storePrinter(device: BluetoothDevice): void {
    try {
      const printerData: StoredPrinter = {
        id: device.id,
        name: device.name || 'Unknown Printer',
        timestamp: Date.now()
      };
      localStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(printerData));
    } catch (error) {
      console.error('Failed to store printer data:', error);
    }
  }

  getStoredPrinter(): StoredPrinter | null {
    try {
      const stored = localStorage.getItem(PRINTER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get stored printer data:', error);
      return null;
    }
  }

  clearStoredPrinter(): void {
    try {
      localStorage.removeItem(PRINTER_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stored printer data:', error);
    }
  }

  // System checks
  isBluetoothSupported(): boolean {
    return 'bluetooth' in navigator && !this.isIOS();
  }

  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Event listeners
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  onDeviceChange(callback: (device: BluetoothDevice | null) => void): () => void {
    this.deviceListeners.push(callback);
    return () => {
      const index = this.deviceListeners.indexOf(callback);
      if (index > -1) {
        this.deviceListeners.splice(index, 1);
      }
    };
  }

  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(callback => callback(connected));
  }

  private notifyDeviceListeners(device: BluetoothDevice | null): void {
    this.deviceListeners.forEach(callback => callback(device));
  }

  // Auto-reconnection
  startAutoReconnect(pollInterval: number = 15000): () => void {
    const interval = setInterval(async () => {
      const stored = this.getStoredPrinter();
      if (stored && this.isBluetoothSupported() && !this.isConnected()) {
        try {
          await this.connectToStored();
        } catch (error) {
          console.log('Auto-reconnect failed, will retry later:', error);
        }
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }

  // Utility: Convert base64 image to ESC/POS raster format (monochrome) - OPTIMIZED FOR SPEED
  private async convertImageToEscPos(base64: string, paperWidth: number, mode: 'ESC*' | 'GSv0' = 'ESC*'): Promise<Uint8Array | null> {
    // Increase max pixels for bigger logo
    const maxPx = Math.min(300, paperWidth * 10);
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        // Create larger canvas for bigger logo
        const canvas = document.createElement('canvas');
        const scale = Math.min(0.8, maxPx / img.width); // Force larger scale for bigger logo
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        
        // Use faster image smoothing
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Darker monochrome conversion - more aggressive threshold
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const bw = new Uint8Array(canvas.width * canvas.height);
        const data = imageData.data;
        
        // More aggressive threshold - make logo darker
        for (let i = 0; i < bw.length; i++) {
          const idx = i * 4;
          const avg = (data[idx] + data[idx+1] + data[idx+2]) / 3;
          bw[i] = avg < 160 ? 1 : 0; // More aggressive threshold for darker logo
        }
        
        const bytes: number[] = [];
        const widthBytes = Math.ceil(canvas.width / 8);
        
        if (mode === 'GSv0') {
          // GS v 0 (raster bit image) - faster for Epson
          bytes.push(0x1D, 0x76, 0x30, 0x00, widthBytes & 0xFF, (widthBytes >> 8) & 0xFF, canvas.height & 0xFF, (canvas.height >> 8) & 0xFF);
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < widthBytes; x++) {
              let b = 0;
              for (let bit = 0; bit < 8; bit++) {
                const px = x * 8 + bit;
                if (px < canvas.width && bw[y * canvas.width + px]) {
                  b |= (0x80 >> bit);
                }
              }
              bytes.push(b);
            }
          }
        }
        
        resolve(new Uint8Array(bytes));
      };
      img.onerror = (e) => reject(e);
      img.src = base64;
    });
  }
}

// Export singleton instance
export const thermalPrinter = ThermalPrinter.getInstance(); 