import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { 
  Printer, 
  Wifi, 
  Usb, 
  Settings, 
  TestTube, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  Receipt
} from 'lucide-react';
import { ThermalPrinter } from '@/lib/ThermalPrinter';
import { thermalPrinter } from '@/lib/ThermalPrinter';

interface PrinterConfig {
  enabled: boolean;
  type: 'thermal' | 'inkjet' | 'laser';
  connection: 'usb' | 'bluetooth' | 'wifi' | 'network';
  model: string;
  paper_width: number;
  auto_cut: boolean;
  print_logo: boolean;
  logo_position: 'top' | 'center' | 'bottom';
  header_text: string;
  footer_text: string;
  print_tax: boolean;
  print_barcode: boolean;
  copies: number;
}

const billStyleDefault = {
  paperWidth: 35,
  headerAlign: 'center',
  footerAlign: 'center',
  shopName: 'POS SYSTEM',
  address: '',
  phone: '',
  thankYou: 'Thank you for your business!',
  visitAgain: 'Visit us again soon.',
  boldShopName: true,
  boldTotal: true,
  headerLines: [],
  footerLines: [],
};
const billTemplates = [
  { key: 'classic', name: 'Classic', description: 'Standard text layout, no logo.' },
  { key: 'modern', name: 'Modern', description: 'Bold header, logo on top.' },
  { key: 'compact', name: 'Compact', description: 'Minimal, fits more on small paper.' },
];
function generateBillPreview(settings, template, logoUrl, headerLines, footerLines) {
  const width = settings.paperWidth;
  const divider = '-'.repeat(width);
  const center = (text) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(pad) + text;
  };
  const align = (text, align) => {
    if (align === 'center') return center(text);
    if (align === 'right') return ' '.repeat(Math.max(0, width - text.length)) + text;
    return text;
  };
  let preview = '';
  if (template === 'modern' && logoUrl) preview += '[LOGO]\n';
  preview += align(settings.shopName, settings.headerAlign) + '\n';
  if (settings.address) preview += align(settings.address, settings.headerAlign) + '\n';
  if (settings.phone) preview += align(settings.phone, settings.headerAlign) + '\n';
  preview += '\nDate : 2024-07-07 12:34\n';
  preview += 'Bill#: 123456789\n';
  preview += 'Cashier: Staff\n\n';
  preview += 'Item             QTY   Price    Total\n' + divider + '\n';
  preview += 'Sample Item      2     100.00   200.00\n';
  preview += divider + '\n';
  preview += 'Subtotal : Rs   200.00\n';
  preview += 'Tax  5% : Rs    10.00\n';
  preview += divider + '\n';
  preview += 'TOTAL    : Rs   210.00\n\n';
  if (Array.isArray(headerLines)) headerLines.forEach(l => preview += align(l, settings.headerAlign) + '\n');
  preview += align(settings.thankYou, settings.footerAlign) + '\n';
  preview += align(settings.visitAgain, settings.footerAlign) + '\n';
  if (Array.isArray(footerLines)) footerLines.forEach(l => preview += align(l, settings.footerAlign) + '\n');
  if (template === 'compact') preview = preview.replace(/\n{2,}/g, '\n');
  return preview;
}

export const PrinterSetup = () => {
  const { selectedShop } = useShop();
  const [config, setConfig] = useState<PrinterConfig>({
    enabled: false,
    type: 'thermal',
    connection: 'usb',
    model: '',
    paper_width: 80,
    auto_cut: true,
    print_logo: false,
    logo_position: 'top',
    header_text: '',
    footer_text: '',
    print_tax: true,
    print_barcode: true,
    copies: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  // --- Bill Print Style State ---
  const [billSettings, setBillSettings] = useState(billStyleDefault);
  const [billTemplate, setBillTemplate] = useState('classic');
  const [billLogoUrl, setBillLogoUrl] = useState(null);
  const [billSaving, setBillSaving] = useState(false);
  const [billTestPrinting, setBillTestPrinting] = useState(false);
  const billFileInputRef = useRef(null);
  const [billHeaderLines, setBillHeaderLines] = useState([]);
  const [billFooterLines, setBillFooterLines] = useState([]);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
  const [logoError, setLogoError] = useState('');
  // Shop-specific localStorage key
  const billStorageKey = selectedShop ? `bill_print_style_${selectedShop.id}` : null;

  const [printerStatus, setPrinterStatus] = useState('disconnected');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (selectedShop) {
      loadPrinterConfig();
    }
  }, [selectedShop]);

  useEffect(() => {
    if (!selectedShop) return;
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('printer_settings')
          .eq('id', selectedShop.id)
          .single();
        if (error) throw error;
        const settings = data?.printer_settings || {};
        setBillSettings({ ...billStyleDefault, ...settings });
        setBillTemplate(settings.template || 'classic');
        setBillLogoUrl(settings.logoUrl || null);
        setBillHeaderLines(settings.headerLines || []);
        setBillFooterLines(settings.footerLines || []);
      } catch (err) {
        // fallback to localStorage if Supabase fails
        const saved = localStorage.getItem(billStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setBillSettings({ ...billStyleDefault, ...parsed });
          setBillTemplate(parsed.template || 'classic');
          setBillLogoUrl(parsed.logoUrl || null);
          setBillHeaderLines(parsed.headerLines || []);
          setBillFooterLines(parsed.footerLines || []);
        } else {
          setBillSettings(billStyleDefault);
          setBillTemplate('classic');
          setBillLogoUrl(null);
          setBillHeaderLines([]);
          setBillFooterLines([]);
        }
      }
    }
    fetchSettings();
    // eslint-disable-next-line
  }, [selectedShop]);

  useEffect(() => {
    setPrinterStatus(thermalPrinter.isConnected() ? 'connected' : 'disconnected');
  }, []);

  const loadPrinterConfig = async () => {
    if (!selectedShop) return;

    try {
      setLoading(true);
      // For now, use localStorage to store printer config
      // In a real implementation, this would be stored in the database
      const savedConfig = localStorage.getItem(`printer_config_${selectedShop.id}`);
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...config, ...parsedConfig });
      }
    } catch (error) {
      console.error('Error loading printer config:', error);
      toast({
        title: "Error",
        description: "Failed to load printer configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedShop) return;

    try {
      setSaving(true);
      // Save to localStorage for now
      // In a real implementation, this would be saved to the database
      localStorage.setItem(`printer_config_${selectedShop.id}`, JSON.stringify(config));

      toast({
        title: "Success",
        description: "Printer configuration saved successfully.",
      });
    } catch (error) {
      console.error('Error saving printer config:', error);
      toast({
        title: "Error",
        description: "Failed to save printer configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      setTesting(true);
      // Simulate test print
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Test Print",
        description: "Test print sent to printer successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test print.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const downloadDrivers = () => {
    toast({
      title: "Download Started",
      description: "Printer drivers are being downloaded.",
    });
    // In a real implementation, this would trigger a file download
  };

  const handleBillChange = (key, value) => {
    setBillSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleBillTemplateChange = (val) => {
    setBillTemplate(val);
  };

  const handleBillLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new window.FileReader();
    reader.onload = () => {
      setBillLogoUrl(typeof reader.result === 'string' ? reader.result : '');
      // Generate BW preview
      try {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 192;
          canvas.height = Math.floor(img.height * (192 / img.width));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            const avg = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
            const bw = avg > 180 ? 255 : 0;
            imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = bw;
          }
          ctx.putImageData(imageData, 0, 0);
          setLogoPreviewUrl(canvas.toDataURL());
          setLogoError('');
        };
        img.onerror = () => setLogoError('Logo preview failed. Try a smaller or simpler image.');
        img.src = typeof reader.result === 'string' ? reader.result : '';
      } catch {
        setLogoError('Logo preview failed.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBillLogoRemove = () => {
    setBillLogoUrl(null);
    if (billFileInputRef.current) billFileInputRef.current.value = '';
  };

  const handleBillSave = async () => {
    if (!selectedShop) return;
    setBillSaving(true);
    const settingsToSave = { ...billSettings, template: billTemplate, logoUrl: billLogoUrl, headerLines: billHeaderLines, footerLines: billFooterLines };
    try {
      const { error } = await supabase
        .from('shops')
        .update({ printer_settings: settingsToSave })
        .eq('id', selectedShop.id);
      if (error) throw error;
      toast({ title: 'Saved', description: 'Bill print style saved for this shop!' });
    } catch (err) {
      // fallback to localStorage if Supabase fails
      localStorage.setItem(billStorageKey, JSON.stringify(settingsToSave));
      toast({ title: 'Saved Locally', description: 'Saved to browser storage (offline mode).' });
    } finally {
      setBillSaving(false);
    }
  };

  const handleBillTestPrint = async () => {
    setBillTestPrinting(true);
    try {
      const printer = ThermalPrinter.getInstance();
      await printer.printReceipt(
        {
          cart: [
            { name: 'Sample Item', quantity: 2, price: 100.0 },
          ],
          total: 200.0,
          shopDetails: {
            name: billSettings.shopName,
            address: billSettings.address,
            phone: billSettings.phone,
            tax_rate: 0.05,
          },
          template: billTemplate,
          logoUrl: billLogoUrl,
          headerLines: billHeaderLines,
          footerLines: billFooterLines,
        },
        {
          showToast: true,
          paperWidth: billSettings.paperWidth,
        }
      );
    } catch (e) {
      toast({ title: 'Print Failed', description: e.message, variant: 'destructive' });
    } finally {
      setBillTestPrinting(false);
    }
  };

  const handleConnectPrinter = async () => {
    setConnecting(true);
    try {
      await thermalPrinter.connect();
      setPrinterStatus('connected');
      toast({ title: 'Printer Connected' });
    } catch (e) {
      toast({ title: 'Connection Failed', description: e.message, variant: 'destructive' });
      setPrinterStatus('disconnected');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectPrinter = async () => {
    try {
      await thermalPrinter.disconnect();
      setPrinterStatus('disconnected');
      toast({ title: 'Printer Disconnected' });
    } catch (e) {
      toast({ title: 'Disconnection Failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleAddHeaderLine = () => setBillHeaderLines([...billHeaderLines, '']);
  const handleHeaderLineChange = (i, v) => setBillHeaderLines(billHeaderLines.map((l, idx) => idx === i ? v : l));
  const handleRemoveHeaderLine = (i) => setBillHeaderLines(billHeaderLines.filter((_, idx) => idx !== i));
  const handleAddFooterLine = () => setBillFooterLines([...billFooterLines, '']);
  const handleFooterLineChange = (i, v) => setBillFooterLines(billFooterLines.map((l, idx) => idx === i ? v : l));
  const handleRemoveFooterLine = (i) => setBillFooterLines(billFooterLines.filter((_, idx) => idx !== i));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading printer configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Printer Setup</h2>
          <p className="text-gray-600">Configure your thermal printer for receipts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={downloadDrivers}>
            <Download className="h-4 w-4 mr-2" />
            Download Drivers
          </Button>
          <Button onClick={handleTestPrint} disabled={testing || !config.enabled}>
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test Print
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Printer Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Printer className="h-5 w-5 text-blue-600" />
            <span>Printer Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <span className={printerStatus === 'connected' ? 'text-green-600' : 'text-red-600'}>
              {printerStatus === 'connected' ? 'Printer Connected' : 'Printer Disconnected'}
            </span>
            {printerStatus === 'connected' ? (
              <Button onClick={handleDisconnectPrinter} disabled={connecting}>Disconnect</Button>
            ) : (
              <Button onClick={handleConnectPrinter} disabled={connecting}>Connect Printer</Button>
            )}
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div>
                <p className="font-medium">Printer {config.enabled ? 'Connected' : 'Disconnected'}</p>
                <p className="text-sm text-gray-600">
                  {config.enabled ? 'Ready to print receipts' : 'Configure printer settings to enable printing'}
                </p>
              </div>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Printer Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-green-600" />
            <span>Printer Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Printer Type</Label>
              <Select value={config.type} onValueChange={(value: any) => setConfig(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">Thermal Printer</SelectItem>
                  <SelectItem value="inkjet">Inkjet Printer</SelectItem>
                  <SelectItem value="laser">Laser Printer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="connection">Connection Type</Label>
              <Select value={config.connection} onValueChange={(value: any) => setConfig(prev => ({ ...prev, connection: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usb">USB</SelectItem>
                  <SelectItem value="bluetooth">Bluetooth</SelectItem>
                  <SelectItem value="wifi">WiFi</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Printer Model</Label>
              <Input
                id="model"
                value={config.model}
                onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
                placeholder="e.g., Epson TM-T88VI"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paper_width">Paper Width (mm)</Label>
              <Select value={config.paper_width.toString()} onValueChange={(value) => setConfig(prev => ({ ...prev, paper_width: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58mm (2.3")</SelectItem>
                  <SelectItem value="80">80mm (3.1")</SelectItem>
                  <SelectItem value="112">112mm (4.4")</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="auto_cut" className="text-base font-medium">Auto Cut</Label>
                <p className="text-sm text-gray-600">Automatically cut receipt after printing</p>
              </div>
              <Switch
                id="auto_cut"
                checked={config.auto_cut}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, auto_cut: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="print_logo" className="text-base font-medium">Print Logo</Label>
                <p className="text-sm text-gray-600">Include shop logo on receipts</p>
              </div>
              <Switch
                id="print_logo"
                checked={config.print_logo}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, print_logo: checked }))}
              />
            </div>
          </div>

          {config.print_logo && (
            <div className="space-y-2">
              <Label htmlFor="logo_position">Logo Position</Label>
              <Select value={config.logo_position} onValueChange={(value: any) => setConfig(prev => ({ ...prev, logo_position: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-purple-600" />
            <span>Receipt Content</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="header_text">Header Text</Label>
            <Textarea
              id="header_text"
              value={config.header_text}
              onChange={(e) => setConfig(prev => ({ ...prev, header_text: e.target.value }))}
              placeholder="Enter header text to appear at the top of receipts..."
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="footer_text">Footer Text</Label>
            <Textarea
              id="footer_text"
              value={config.footer_text}
              onChange={(e) => setConfig(prev => ({ ...prev, footer_text: e.target.value }))}
              placeholder="Enter footer text to appear at the bottom of receipts..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="print_tax" className="text-base font-medium">Print Tax Details</Label>
                <p className="text-sm text-gray-600">Include tax breakdown</p>
              </div>
              <Switch
                id="print_tax"
                checked={config.print_tax}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, print_tax: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label htmlFor="print_barcode" className="text-base font-medium">Print Barcode</Label>
                <p className="text-sm text-gray-600">Include product barcodes</p>
              </div>
              <Switch
                id="print_barcode"
                checked={config.print_barcode}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, print_barcode: checked }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="copies">Number of Copies</Label>
              <Select value={config.copies.toString()} onValueChange={(value) => setConfig(prev => ({ ...prev, copies: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Copy</SelectItem>
                  <SelectItem value="2">2 Copies</SelectItem>
                  <SelectItem value="3">3 Copies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Icons */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 border rounded-lg text-center ${config.connection === 'usb' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <Usb className={`h-8 w-8 mx-auto mb-2 ${config.connection === 'usb' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className="font-medium">USB</p>
              <p className="text-sm text-gray-600">Direct connection</p>
            </div>
            
            <div className={`p-4 border rounded-lg text-center ${config.connection === 'bluetooth' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className={`h-8 w-8 mx-auto mb-2 ${config.connection === 'bluetooth' ? 'text-blue-600' : 'text-gray-400'}`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <p className="font-medium">Bluetooth</p>
              <p className="text-sm text-gray-600">Wireless connection</p>
            </div>
            
            <div className={`p-4 border rounded-lg text-center ${config.connection === 'wifi' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <Wifi className={`h-8 w-8 mx-auto mb-2 ${config.connection === 'wifi' ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className="font-medium">WiFi</p>
              <p className="text-sm text-gray-600">Network connection</p>
            </div>
            
            <div className={`p-4 border rounded-lg text-center ${config.connection === 'network' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <div className={`h-8 w-8 mx-auto mb-2 ${config.connection === 'network' ? 'text-blue-600' : 'text-gray-400'}`}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <p className="font-medium">Network</p>
              <p className="text-sm text-gray-600">Ethernet connection</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Bill Print Style Section --- */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Print Style</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            <label className="block font-medium mb-1">Bill Template</label>
            <div className="flex gap-4">
              {billTemplates.map(t => (
                <button
                  key={t.key}
                  className={`border rounded px-3 py-2 text-sm ${billTemplate === t.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                  onClick={() => handleBillTemplateChange(t.key)}
                  type="button"
                >
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.description}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Logo (Modern template only)</label>
            <div className="flex items-center gap-4">
              <input
                ref={billFileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleBillLogoUpload}
                className="block"
                disabled={billTemplate !== 'modern'}
              />
              {billLogoUrl && billTemplate === 'modern' && (
                <div className="flex flex-col items-center gap-1">
                  <img src={billLogoUrl} alt="Logo Preview" className="h-12 w-auto border rounded" />
                  <button type="button" className="text-xs text-red-500 underline" onClick={handleBillLogoRemove}>Remove</button>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Paper Width (chars)</label>
              <Input
                type="number"
                min={24}
                max={48}
                value={billSettings.paperWidth}
                onChange={e => handleBillChange('paperWidth', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Header Alignment</label>
              <Select value={billSettings.headerAlign} onValueChange={v => handleBillChange('headerAlign', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">Footer Alignment</label>
              <Select value={billSettings.footerAlign} onValueChange={v => handleBillChange('footerAlign', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch checked={billSettings.boldShopName} onCheckedChange={v => handleBillChange('boldShopName', v)} />
              <span>Bold Shop Name</span>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch checked={billSettings.boldTotal} onCheckedChange={v => handleBillChange('boldTotal', v)} />
              <span>Bold Total</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Shop Name</label>
              <Input value={billSettings.shopName} onChange={e => handleBillChange('shopName', e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Address</label>
              <Input value={billSettings.address} onChange={e => handleBillChange('address', e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Phone</label>
              <Input value={billSettings.phone} onChange={e => handleBillChange('phone', e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Thank You Message</label>
              <Input value={billSettings.thankYou} onChange={e => handleBillChange('thankYou', e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Visit Again Message</label>
              <Input value={billSettings.visitAgain} onChange={e => handleBillChange('visitAgain', e.target.value)} />
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Header Lines</label>
            {billHeaderLines.map((line, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <Input value={line} onChange={e => handleHeaderLineChange(i, e.target.value)} className="flex-1" />
                <Button variant="destructive" size="sm" onClick={() => handleRemoveHeaderLine(i)}>-</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddHeaderLine}>+ Add Line</Button>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-1">Footer Lines</label>
            {billFooterLines.map((line, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <Input value={line} onChange={e => handleFooterLineChange(i, e.target.value)} className="flex-1" />
                <Button variant="destructive" size="sm" onClick={() => handleRemoveFooterLine(i)}>-</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddFooterLine}>+ Add Line</Button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleBillSave} disabled={billSaving}>{billSaving ? 'Saving...' : 'Save Settings'}</Button>
            <Button onClick={handleBillTestPrint} disabled={billTestPrinting} variant="outline">{billTestPrinting ? 'Printing...' : 'Test Print'}</Button>
          </div>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto" style={{ minHeight: 220 }}>{generateBillPreview(billSettings, billTemplate, billLogoUrl, billHeaderLines, billFooterLines)}</pre>
              {logoError && <div className="text-xs text-red-500">{logoError}</div>}
              {logoPreviewUrl && (
                <div className="flex flex-col items-center gap-1 mt-2">
                  <span className="text-xs text-gray-500">Black & White Print Preview:</span>
                  <img src={logoPreviewUrl} alt="BW Logo Preview" className="h-12 w-auto border rounded" />
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="px-8">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}; 