import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Database,
  AlertTriangle
} from 'lucide-react';
import bcrypt from 'bcryptjs';
import { useSensitiveMask } from '@/components/SensitiveMaskContext';

interface ShopSettingsData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  timezone: string;
  business_hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  tax_rate: number;
  auto_backup: boolean;
  notifications_enabled: boolean;
}

export const ShopSettings = () => {
  const { selectedShop } = useShop();
  const [settings, setSettings] = useState<ShopSettingsData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    business_hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '16:00', closed: false },
      sunday: { open: '09:00', close: '16:00', closed: true }
    },
    tax_rate: 18,
    auto_backup: true,
    notifications_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const { maskSensitive, setMaskSensitive } = useSensitiveMask();
  const [pinModal, setPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [shopPinHash, setShopPinHash] = useState<string | null>(null);

  useEffect(() => {
    if (selectedShop) {
      loadShopSettings();
    }
  }, [selectedShop]);

  useEffect(() => {
    localStorage.setItem('maskSensitive', maskSensitive.toString());
  }, [maskSensitive]);

  useEffect(() => {
    // Fetch the shop's sensitive_data_pin hash
    const fetchPin = async () => {
      if (!selectedShop || typeof selectedShop !== 'object' || !('id' in selectedShop) || !selectedShop.id) return;
      const { data, error } = await supabase
        .from('shops')
        .select('sensitive_data_pin')
        .eq('id', selectedShop.id)
        .single();
      if (!error && data && typeof data.sensitive_data_pin === 'string') {
        setShopPinHash(data.sensitive_data_pin);
      }
    };
    fetchPin();
  }, [selectedShop]);

  const loadShopSettings = async () => {
    if (!selectedShop) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', selectedShop.id)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          currency: data.currency || 'INR',
          timezone: data.timezone || 'Asia/Kolkata',
          business_hours: typeof data.business_hours === 'string' ? JSON.parse(data.business_hours) : (data.business_hours || settings.business_hours),
          tax_rate: (data.tax_rate || 0) * 100,
          auto_backup: data.auto_backup ?? true,
          notifications_enabled: data.notifications_enabled ?? true
        });
        setPin('');
        setPinConfirm('');
        setPinError('');
        setPinSuccess('');
      }
    } catch (error) {
      console.error('Error loading shop settings:', error);
      toast({
        title: "Error",
        description: "Failed to load shop settings.",
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
      const { error } = await supabase
        .from('shops')
        .update({
          name: settings.name,
          description: settings.description,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          website: settings.website,
          currency: settings.currency,
          timezone: settings.timezone,
          business_hours: settings.business_hours,
          tax_rate: settings.tax_rate / 100,
          auto_backup: settings.auto_backup,
          notifications_enabled: settings.notifications_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedShop.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Shop settings updated successfully.",
      });
    } catch (error) {
      console.error('Error saving shop settings:', error);
      toast({
        title: "Error",
        description: "Failed to save shop settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessHours = (day: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day as keyof typeof prev.business_hours],
          [field]: value
        }
      }
    }));
  };

  const clearShopData = async (dataType: string) => {
    if (!selectedShop) return;

    if (!confirm(`Are you sure you want to clear all ${dataType}? This action cannot be undone.`)) {
      return;
    }

    try {
      switch (dataType) {
        case 'transactions':
          const { error: txError } = await supabase
            .from('transactions')
            .delete()
            .eq('shop_id', selectedShop.id);
          if (txError) throw txError;
          break;
        case 'products':
          const { error: prodError } = await supabase
            .from('products')
            .delete()
            .eq('shop_id', selectedShop.id);
          if (prodError) throw prodError;
          break;
        case 'customers':
          const { error: custError } = await supabase
            .from('profiles')
            .delete()
            .eq('shop_id', selectedShop.id);
          if (custError) throw custError;
          break;
        default:
          throw new Error('Invalid data type');
      }

      toast({
        title: "Success",
        description: `All ${dataType} cleared successfully.`,
      });
    } catch (error) {
      console.error('Error clearing shop data:', error);
      toast({
        title: "Error",
        description: `Failed to clear ${dataType}.`,
        variant: "destructive",
      });
    }
  };

  const handlePinSave = async () => {
    setPinError('');
    setPinSuccess('');
    if (!pin || pin.length < 4) {
      setPinError('PIN must be at least 4 digits.');
      return;
    }
    if (pin !== pinConfirm) {
      setPinError('PINs do not match.');
      return;
    }
    if (!selectedShop) return;
    setPinSaving(true);
    try {
      const hash = await bcrypt.hash(pin, 10);
      const { error } = await supabase
        .from('shops')
        .update({ sensitive_data_pin: hash, updated_at: new Date().toISOString() })
        .eq('id', selectedShop.id);
      if (error) throw error;
      setPin('');
      setPinConfirm('');
      setPinSuccess('PIN set successfully.');
    } catch (err: unknown) {
      setPinError('Failed to set PIN.');
    } finally {
      setPinSaving(false);
    }
  };

  const handleMaskToggle = async (checked: boolean) => {
    if (!checked) {
      // Unmasking, no PIN needed
      setMaskSensitive(false);
      return;
    }
    // Masking: require PIN
    setPinInput('');
    setPinError('');
    setPinModal(true);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopPinHash) {
      setPinError('No PIN set for this shop.');
      return;
    }
    const match = await bcrypt.compare(pinInput, shopPinHash);
    if (match) {
      setMaskSensitive(true);
      setPinModal(false);
    } else {
      setPinError('Incorrect PIN');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading shop settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Store className="h-5 w-5 text-blue-600" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name *</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter shop name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your shop"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={settings.address}
              onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Enter shop address"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                placeholder="shop@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5 text-green-600" />
            <span>Business Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_rate">Tax Rate (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              value={settings.tax_rate}
              onChange={(e) => setSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
              placeholder="18"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span>Business Hours</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(settings.business_hours).map(([day, hours]) => (
              <div key={day} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="w-20">
                  <span className="font-medium capitalize">{day}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={!hours.closed}
                    onCheckedChange={(checked) => updateBusinessHours(day, 'closed', !checked)}
                  />
                  <span className="text-sm text-gray-600">
                    {hours.closed ? 'Closed' : 'Open'}
                  </span>
                </div>
                {!hours.closed && (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                      className="w-24"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-purple-600" />
            <span>System Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="auto_backup" className="text-base font-medium">Auto Backup</Label>
              <p className="text-sm text-gray-600">Automatically backup data daily</p>
            </div>
            <Switch
              id="auto_backup"
              checked={settings.auto_backup}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_backup: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label htmlFor="notifications" className="text-base font-medium">Notifications</Label>
              <p className="text-sm text-gray-600">Enable email and push notifications</p>
            </div>
            <Switch
              id="notifications"
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications_enabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Data Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These actions will permanently delete all data for your shop. This action cannot be undone.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Dialog open={dialogOpen.transactions} onOpenChange={(open) => setDialogOpen(prev => ({ ...prev, transactions: open }))}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Transactions
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear All Transactions</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all transaction records for your shop. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(prev => ({ ...prev, transactions: false }))}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={() => {
                    clearShopData('transactions');
                    setDialogOpen(prev => ({ ...prev, transactions: false }));
                  }}>
                    Clear Transactions
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen.products} onOpenChange={(open) => setDialogOpen(prev => ({ ...prev, products: open }))}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Products
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear All Products</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all product records for your shop. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(prev => ({ ...prev, products: false }))}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={() => {
                    clearShopData('products');
                    setDialogOpen(prev => ({ ...prev, products: false }));
                  }}>
                    Clear Products
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen.customers} onOpenChange={(open) => setDialogOpen(prev => ({ ...prev, customers: open }))}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Customers
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear All Customers</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all customer records for your shop. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(prev => ({ ...prev, customers: false }))}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={() => {
                    clearShopData('customers');
                    setDialogOpen(prev => ({ ...prev, customers: false }));
                  }}>
                    Clear Customers
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Protect Sensitive Data */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Protect Sensitive Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="pin">Set/Change Sensitive Data PIN</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter new PIN"
              maxLength={12}
              minLength={4}
              autoComplete="new-password"
            />
            <Input
              id="pin-confirm"
              type="password"
              value={pinConfirm}
              onChange={e => setPinConfirm(e.target.value)}
              placeholder="Confirm new PIN"
              maxLength={12}
              minLength={4}
              autoComplete="new-password"
            />
            {pinError && <Alert variant="destructive"><AlertDescription>{pinError}</AlertDescription></Alert>}
            {pinSuccess && <Alert variant="default"><AlertDescription className="text-green-600">{pinSuccess}</AlertDescription></Alert>}
            <Button onClick={handlePinSave} disabled={pinSaving}>
              {pinSaving ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} Set PIN
            </Button>
            <div className="text-xs text-muted-foreground mt-2">
              This PIN will be required to reveal sensitive data (e.g., sales, transactions). Keep it secure.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensitive Data Masking Toggle */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mask All Sensitive Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="font-medium">Mask All Sensitive Data</span>
            <Switch checked={maskSensitive} onCheckedChange={handleMaskToggle} />
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            When enabled, all sensitive data (e.g., sales, transactions) will be masked until unmasked by a user with the correct PIN.
          </div>
        </CardContent>
      </Card>

      <Dialog open={pinModal} onOpenChange={setPinModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter PIN to Mask Data</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <Input
              type="password"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="PIN"
              autoFocus
            />
            {pinError && <div className="text-red-500 text-sm">{pinError}</div>}
            <Button type="submit" className="w-full">Mask Data</Button>
          </form>
        </DialogContent>
      </Dialog>

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
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}; 