import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (selectedShop) {
      loadPrinterConfig();
    }
  }, [selectedShop]);

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