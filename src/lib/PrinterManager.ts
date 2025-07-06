import { thermalPrinter, type ReceiptData, type PrintOptions } from './ThermalPrinter';
import { supabase } from '@/integrations/supabase/client';

class PrinterManager {
  static instance: PrinterManager;
  printerDevice: BluetoothDevice | null = null;

  static getInstance() {
    if (!PrinterManager.instance) {
      PrinterManager.instance = new PrinterManager();
    }
    return PrinterManager.instance;
  }

  setPrinterDevice(device: BluetoothDevice) {
    this.printerDevice = device;
    thermalPrinter.setDevice(device);
    console.log('PrinterManager: Device set', device.name);
  }

  isPrinterConnected(): boolean {
    return thermalPrinter.isConnected();
  }

  getPrinterDevice(): BluetoothDevice | null {
    return thermalPrinter.getDevice();
  }

  async printReceipt({ cart, total, shopDetails, directAmount, toast }: any) {
    const receiptData: ReceiptData = {
      cart,
      total,
      shopDetails,
      directAmount,
    };

    // Load shop-specific bill print style settings
    let options: PrintOptions = {
      showToast: true,
      autoCut: true,
      paperWidth: 35,
    };
    let template = 'classic';
    let logoUrl = null;
    let headerAlign = 'center';
    let footerAlign = 'center';
    let headerLines: string[] = [];
    let footerLines: string[] = [];
    
    if (shopDetails?.id) {
      // Try to load from Supabase first (like web version)
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('printer_settings')
          .eq('id', shopDetails.id)
          .single();
        
        if (!error && data && (data as any).printer_settings) {
          const settings = (data as any).printer_settings;
          if (settings.paperWidth) options.paperWidth = settings.paperWidth;
          if (settings.shopName) receiptData.shopDetails.name = settings.shopName;
          if (settings.address) receiptData.shopDetails.address = settings.address;
          if (settings.phone) receiptData.shopDetails.phone = settings.phone;
          if (settings.template) template = settings.template;
          if (settings.logoUrl) logoUrl = settings.logoUrl;
          if (settings.headerAlign) headerAlign = settings.headerAlign;
          if (settings.footerAlign) footerAlign = settings.footerAlign;
          if (settings.headerLines) headerLines = settings.headerLines;
          if (settings.footerLines) footerLines = settings.footerLines;
        }
      } catch (err) {
        console.log('Supabase load failed, trying localStorage fallback');
      }
      
      // Fallback to localStorage if Supabase failed or no data
      if (template === 'classic' && !logoUrl) {
        const styleKey = `bill_print_style_${shopDetails.id}`;
        const saved = localStorage.getItem(styleKey);
        if (saved) {
          try {
            const style = JSON.parse(saved);
            if (style.paperWidth) options.paperWidth = style.paperWidth;
            if (style.shopName) receiptData.shopDetails.name = style.shopName;
            if (style.address) receiptData.shopDetails.address = style.address;
            if (style.phone) receiptData.shopDetails.phone = style.phone;
            if (style.template) template = style.template;
            if (style.logoUrl) logoUrl = style.logoUrl;
            if (style.headerAlign) headerAlign = style.headerAlign;
            if (style.footerAlign) footerAlign = style.footerAlign;
            if (style.headerLines) headerLines = style.headerLines;
            if (style.footerLines) footerLines = style.footerLines;
          } catch {}
        }
      }
    }
    
    // Attach all bill style settings to receiptData for use in ThermalPrinter
    receiptData.template = template;
    receiptData.logoUrl = logoUrl;
    receiptData.headerAlign = headerAlign;
    receiptData.footerAlign = footerAlign;
    receiptData.headerLines = headerLines;
    receiptData.footerLines = footerLines;
    receiptData.paperWidth = options.paperWidth;

    console.log('PrinterManager: Printing receipt...', { 
      device: thermalPrinter.getDevice()?.name, 
      cartLength: cart.length,
      template,
      logoUrl,
      headerAlign,
      footerAlign
    });
    
    try {
      await thermalPrinter.printReceipt(receiptData, options);
      console.log('PrinterManager: Print successful');
    } catch (error) {
      console.error('PrinterManager: Print failed', error);
      throw error;
    }
  }

  // Delegate connection methods to ThermalPrinter
  async connect(): Promise<BluetoothDevice> {
    return thermalPrinter.connect();
  }

  async connectToStored(): Promise<BluetoothDevice | null> {
    return thermalPrinter.connectToStored();
  }

  async disconnect(): Promise<void> {
    return thermalPrinter.disconnect();
  }

  getStoredPrinter() {
    return thermalPrinter.getStoredPrinter();
  }

  clearStoredPrinter() {
    return thermalPrinter.clearStoredPrinter();
  }

  isBluetoothSupported(): boolean {
    return thermalPrinter.isBluetoothSupported();
  }

  isIOS(): boolean {
    return thermalPrinter.isIOS();
  }

  isMobile(): boolean {
    return thermalPrinter.isMobile();
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    return thermalPrinter.onConnectionChange(callback);
  }

  onDeviceChange(callback: (device: BluetoothDevice | null) => void) {
    return thermalPrinter.onDeviceChange(callback);
  }

  startAutoReconnect(pollInterval?: number) {
    return thermalPrinter.startAutoReconnect(pollInterval);
  }
}

export default PrinterManager.getInstance(); 