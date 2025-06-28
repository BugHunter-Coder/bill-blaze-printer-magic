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
