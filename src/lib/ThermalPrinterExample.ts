import { thermalPrinter, type ReceiptData, type PrintOptions } from './ThermalPrinter';

/**
 * Example usage of the ThermalPrinter class
 * This file demonstrates how to use the centralized thermal printer functionality
 */

// Example 1: Basic connection and printing
export async function basicPrintExample() {
  try {
    // Connect to a new printer
    const device = await thermalPrinter.connect();
    console.log('Connected to:', device.name);

    // Prepare receipt data
    const receiptData: ReceiptData = {
      cart: [
        { name: 'Coffee', quantity: 2, price: 3.50 },
        { name: 'Sandwich', quantity: 1, price: 8.99 },
      ],
      total: 15.99,
      shopDetails: {
        name: 'My Coffee Shop',
        address: '123 Main St, City',
        phone: '+1-555-0123',
        tax_rate: 0.08,
      },
    };

    // Print with default options
    await thermalPrinter.printReceipt(receiptData);
    console.log('Receipt printed successfully!');

  } catch (error) {
    console.error('Print failed:', error);
  }
}

// Example 2: Connect to stored printer and print with custom options
export async function storedPrinterExample() {
  try {
    // Try to connect to previously stored printer
    const device = await thermalPrinter.connectToStored();
    if (!device) {
      console.log('No stored printer found, connecting to new one...');
      await thermalPrinter.connect();
    }

    // Custom print options
    const options: PrintOptions = {
      showToast: false, // Don't show toast notifications
      autoCut: true,    // Automatically cut paper
      paperWidth: 42,   // Use 42mm paper width
    };

    const receiptData: ReceiptData = {
      cart: [
        { name: 'Pizza', quantity: 1, price: 12.99 },
        { name: 'Soda', quantity: 2, price: 2.50 },
      ],
      total: 17.99,
      shopDetails: {
        name: 'Pizza Palace',
        address: '456 Oak Ave',
        phone: '+1-555-0456',
        tax_rate: 0.06,
      },
      directAmount: 20.00, // Override total for direct billing
    };

    await thermalPrinter.printReceipt(receiptData, options);
    console.log('Custom receipt printed!');

  } catch (error) {
    console.error('Print failed:', error);
  }
}

// Example 3: Event-driven printing with connection monitoring
export function eventDrivenExample() {
  // Listen for connection changes
  const unsubscribeConnection = thermalPrinter.onConnectionChange((connected) => {
    console.log('Printer connection status:', connected ? 'Connected' : 'Disconnected');
  });

  // Listen for device changes
  const unsubscribeDevice = thermalPrinter.onDeviceChange((device) => {
    console.log('Printer device changed:', device?.name || 'None');
  });

  // Start auto-reconnection (polls every 30 seconds)
  const stopAutoReconnect = thermalPrinter.startAutoReconnect(30000);

  // Return cleanup function
  return () => {
    unsubscribeConnection();
    unsubscribeDevice();
    stopAutoReconnect();
  };
}

// Example 4: Batch printing multiple receipts
export async function batchPrintExample() {
  const receipts: ReceiptData[] = [
    {
      cart: [{ name: 'Item 1', quantity: 1, price: 10.00 }],
      total: 10.00,
      shopDetails: { name: 'Shop A', tax_rate: 0.05 },
    },
    {
      cart: [{ name: 'Item 2', quantity: 2, price: 5.00 }],
      total: 10.00,
      shopDetails: { name: 'Shop B', tax_rate: 0.08 },
    },
  ];

  for (let i = 0; i < receipts.length; i++) {
    try {
      console.log(`Printing receipt ${i + 1}/${receipts.length}`);
      await thermalPrinter.printReceipt(receipts[i], { showToast: false });
      
      // Wait between prints to avoid overwhelming the printer
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to print receipt ${i + 1}:`, error);
    }
  }
}

// Example 5: System compatibility checks
export function systemCompatibilityExample() {
  console.log('Bluetooth supported:', thermalPrinter.isBluetoothSupported());
  console.log('Is iOS device:', thermalPrinter.isIOS());
  console.log('Is mobile device:', thermalPrinter.isMobile());
  console.log('Currently connected:', thermalPrinter.isConnected());
  console.log('Stored printer:', thermalPrinter.getStoredPrinter());
}

// Example 6: Printer management utilities
export async function printerManagementExample() {
  // Get current device
  const device = thermalPrinter.getDevice();
  console.log('Current device:', device?.name);

  // Check connection status
  const isConnected = thermalPrinter.isConnected();
  console.log('Is connected:', isConnected);

  // Get stored printer info
  const stored = thermalPrinter.getStoredPrinter();
  console.log('Stored printer:', stored);

  // Clear stored printer
  if (stored) {
    thermalPrinter.clearStoredPrinter();
    console.log('Stored printer cleared');
  }

  // Disconnect if connected
  if (isConnected) {
    await thermalPrinter.disconnect();
    console.log('Disconnected from printer');
  }
}

// Example 7: Error handling and recovery
export async function robustPrintingExample() {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Ensure we're connected
      if (!thermalPrinter.isConnected()) {
        console.log('Attempting to connect...');
        await thermalPrinter.connectToStored() || await thermalPrinter.connect();
      }

      // Print receipt
      await thermalPrinter.printReceipt({
        cart: [{ name: 'Test Item', quantity: 1, price: 1.00 }],
        total: 1.00,
        shopDetails: { name: 'Test Shop', tax_rate: 0.00 },
      }, {
        showToast: true,
        autoCut: true,
      });

      console.log('Print successful!');
      break; // Success, exit retry loop

    } catch (error: any) {
      retryCount++;
      console.error(`Print attempt ${retryCount} failed:`, error.message);

      if (retryCount >= maxRetries) {
        console.error('Max retries reached, giving up');
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
} 