import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ThermalPrinter } from '@/lib/ThermalPrinter';
import { useShop } from '@/hooks/useShop';

const LOCAL_STORAGE_KEY = 'bill_print_style_settings';

const defaultSettings = {
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
};

type BillPrintStyleSettings = typeof defaultSettings;

const templates = [
  { key: 'classic', name: 'Classic', description: 'Standard text layout, no logo.' },
  { key: 'modern', name: 'Modern', description: 'Bold header, logo on top.' },
  { key: 'compact', name: 'Compact', description: 'Minimal, fits more on small paper.' },
];

function generatePreview(settings: BillPrintStyleSettings, template: string, logoUrl: string | null) {
  const width = settings.paperWidth;
  const divider = '-'.repeat(width);
  const center = (text: string) => {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(pad) + text;
  };
  const align = (text: string, align: string) => {
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
  preview += align(settings.thankYou, settings.footerAlign) + '\n';
  preview += align(settings.visitAgain, settings.footerAlign) + '\n';
  if (template === 'compact') preview = preview.replace(/\n{2,}/g, '\n');
  return preview;
}

export default function BillPrintStyle() {
  const { selectedShop } = useShop();
  const [settings, setSettings] = useState<BillPrintStyleSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [testPrinting, setTestPrinting] = useState(false);
  const [template, setTemplate] = useState('classic');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shop-specific localStorage key
  const storageKey = selectedShop ? `bill_print_style_${selectedShop.id}` : null;

  useEffect(() => {
    if (!selectedShop) return;
    const saved = localStorage.getItem(storageKey!);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings({ ...defaultSettings, ...parsed });
      setTemplate(parsed.template || 'classic');
      setLogoUrl(parsed.logoUrl || null);
    } else {
      setSettings(defaultSettings);
      setTemplate('classic');
      setLogoUrl(null);
    }
    // eslint-disable-next-line
  }, [selectedShop]);

  const handleChange = (key: keyof BillPrintStyleSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleTemplateChange = (val: string) => {
    setTemplate(val);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    setLogoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    if (!selectedShop) return;
    setSaving(true);
    localStorage.setItem(storageKey!, JSON.stringify({ ...settings, template, logoUrl }));
    setTimeout(() => {
      setSaving(false);
      toast({ title: 'Saved', description: 'Bill print style saved for this shop!' });
    }, 500);
  };

  const handleTestPrint = async () => {
    setTestPrinting(true);
    try {
      const printer = ThermalPrinter.getInstance();
      // For now, logo and template are not sent to printer (text only preview)
      await printer.printReceipt(
        {
          cart: [
            { name: 'Sample Item', quantity: 2, price: 100.0 },
          ],
          total: 200.0,
          shopDetails: {
            name: settings.shopName,
            address: settings.address,
            phone: settings.phone,
            tax_rate: 0.05,
          },
        },
        {
          showToast: true,
          paperWidth: settings.paperWidth,
        }
      );
    } catch (e: any) {
      toast({ title: 'Print Failed', description: e.message, variant: 'destructive' });
    } finally {
      setTestPrinting(false);
    }
  };

  if (!selectedShop) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-2">Bill Print Style</h1>
        <p className="text-gray-600 mb-4">Please select a shop to customize bill print style.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Bill Print Style</h1>
      <p className="text-gray-600 mb-4">Customize your bill alignment, template, and logo for <b>{selectedShop.name}</b>. Save and test print to preview changes.</p>
      <Card>
        <CardHeader>
          <CardTitle>Bill Style Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="mb-4">
            <label className="block font-medium mb-1">Bill Template</label>
            <div className="flex gap-4">
              {templates.map(t => (
                <button
                  key={t.key}
                  className={`border rounded px-3 py-2 text-sm ${template === t.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                  onClick={() => handleTemplateChange(t.key)}
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
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleLogoUpload}
                className="block"
                disabled={template !== 'modern'}
              />
              {logoUrl && template === 'modern' && (
                <div className="flex flex-col items-center gap-1">
                  <img src={logoUrl} alt="Logo Preview" className="h-12 w-auto border rounded" />
                  <button type="button" className="text-xs text-red-500 underline" onClick={handleLogoRemove}>Remove</button>
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
                value={settings.paperWidth}
                onChange={e => handleChange('paperWidth', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Header Alignment</label>
              <Select value={settings.headerAlign} onValueChange={v => handleChange('headerAlign', v)}>
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
              <Select value={settings.footerAlign} onValueChange={v => handleChange('footerAlign', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch checked={settings.boldShopName} onCheckedChange={v => handleChange('boldShopName', v)} />
              <span>Bold Shop Name</span>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch checked={settings.boldTotal} onCheckedChange={v => handleChange('boldTotal', v)} />
              <span>Bold Total</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Shop Name</label>
              <Input value={settings.shopName} onChange={e => handleChange('shopName', e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Address</label>
              <Input value={settings.address} onChange={e => handleChange('address', e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Phone</label>
              <Input value={settings.phone} onChange={e => handleChange('phone', e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Thank You Message</label>
              <Input value={settings.thankYou} onChange={e => handleChange('thankYou', e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">Visit Again Message</label>
              <Input value={settings.visitAgain} onChange={e => handleChange('visitAgain', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
            <Button onClick={handleTestPrint} disabled={testPrinting} variant="outline">{testPrinting ? 'Printing...' : 'Test Print'}</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto" style={{ minHeight: 220 }}>{generatePreview(settings, template, logoUrl)}</pre>
          {template === 'modern' && logoUrl && (
            <div className="mt-2 flex flex-col items-center">
              <span className="text-xs text-gray-500">Logo Preview:</span>
              <img src={logoUrl} alt="Logo Preview" className="h-16 w-auto border rounded" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 