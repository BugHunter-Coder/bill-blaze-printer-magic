import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toFixed(2)}`;
  }
  return `${currency}${amount.toFixed(2)}`;
}

// Bluetooth printer storage utilities
export interface StoredPrinter {
  id: string;
  name: string;
  timestamp: number;
}

const PRINTER_STORAGE_KEY = 'bluetooth_printer_device';

export const storePrinter = (device: BluetoothDevice): void => {
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
};

export const getStoredPrinter = (): StoredPrinter | null => {
  try {
    const stored = localStorage.getItem(PRINTER_STORAGE_KEY);
    if (!stored) return null;
    
    const printerData: StoredPrinter = JSON.parse(stored);
    
    // Check if stored data is less than 30 days old
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    if (printerData.timestamp < thirtyDaysAgo) {
      localStorage.removeItem(PRINTER_STORAGE_KEY);
      return null;
    }
    
    return printerData;
  } catch (error) {
    console.error('Failed to retrieve printer data:', error);
    return null;
  }
};

export const clearStoredPrinter = (): void => {
  try {
    localStorage.removeItem(PRINTER_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear printer data:', error);
  }
};

export const isPrinterStored = (deviceId: string): boolean => {
  const stored = getStoredPrinter();
  return stored?.id === deviceId;
};

export async function printReceiptToBluetoothPrinter({
  device,
  cart,
  total,
  shopDetails,
  directAmount,
  toast,
}: {
  device: BluetoothDevice,
  cart: any[],
  total: number,
  shopDetails: any,
  directAmount?: number,
  toast?: (args: any) => void,
}) {
  // Helper functions
  const center = (txt: string, w: number) => {
    const pad = Math.max(0, Math.floor((w - txt.length) / 2));
    return ' '.repeat(pad) + txt;
  };
  const sanitizeForPrinter = (txt: string) =>
    txt.replace(/₹/g, 'Rs').normalize('NFKD').replace(/[^ -\u007F]/g, '');
  const generateReceipt = () => {
    const WIDTH = 35;
    const divider = '-'.repeat(WIDTH);
    const sub = directAmount || total;
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
    txt += `Tax ${((shopDetails?.tax_rate || 0) * 100).toFixed(1).padStart(3)}% : ₹${tax.toFixed(2).padStart(8)}\n`;
    txt += `${divider}\n`;
    txt += `TOTAL    : ₹${grand.toFixed(2).padStart(10)}\n\n`;
    txt += `${center('Thank you for your business!', WIDTH)}\n`;
    txt += `${center('Visit us again soon.', WIDTH)}\n`;
    return sanitizeForPrinter(txt);
  };
  const sendDataInChunks = async (
    ch: BluetoothRemoteGATTCharacteristic,
    data: Uint8Array,
    chunk = 20
  ) => {
    for (let i = 0; i < data.length; i += chunk) {
      await ch.writeValue(data.slice(i, i + chunk));
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };
  try {
    // Always check and reconnect before printing
    if (!device.gatt?.connected) {
      try {
        await device.gatt?.connect();
      } catch (e) {
        if (toast) toast({ title: 'Printer Disconnected', description: 'Could not reconnect to printer. Please reconnect and try again.', variant: 'destructive' });
        throw new Error('Could not reconnect to printer');
      }
    }
    const server = device.gatt;
    if (!server) throw new Error('GATT connection failed');
    const services = await server.getPrimaryServices();
    let writeChar: BluetoothRemoteGATTCharacteristic | null = null;
    const thermalPrinterServices = [
      '000018f0-0000-1000-8000-00805f9b34fb',
      '00001101-0000-1000-8000-00805f9b34fb',
      '0000fee7-0000-1000-8000-00805f9b34fb',
    ];
    for (const serviceUuid of thermalPrinterServices) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const chars = await service.getCharacteristics();
        writeChar = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse) || null;
        if (writeChar) break;
      } catch (e) { continue; }
    }
    if (!writeChar) {
      for (const svc of services) {
        const chars = await svc.getCharacteristics();
        writeChar = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse) || null;
        if (writeChar) break;
      }
    }
    if (!writeChar) throw new Error('No writable characteristic found');
    const initCommands = new Uint8Array([
      0x1B, 0x40, 0x1B, 0x21, 0x00, 0x1B, 0x61, 0x00, 0x1D, 0x21, 0x00,
    ]);
    await writeChar.writeValue(initCommands);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const ascii = generateReceipt();
    const payload = ascii.replace(/\n/g, '\r\n') + '\r\n\r\n\r\n';
    const bytes = new TextEncoder().encode(payload);
    await sendDataInChunks(writeChar, bytes, 20);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const cutCommands = new Uint8Array([0x1D, 0x56, 0x41, 0x0A]);
    await writeChar.writeValue(cutCommands);
    if (toast) toast({ title: 'Printed Successfully', description: 'Receipt sent to thermal printer ✅' });
  } catch (e: any) {
    console.error('Bluetooth print error:', e);
    if (toast) toast({ title: 'Print Failed', description: e.message || String(e), variant: 'destructive' });
    throw e;
  }
}
