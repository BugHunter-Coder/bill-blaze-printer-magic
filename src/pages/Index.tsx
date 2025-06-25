import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Copy, Check, AlertCircle } from 'lucide-react';
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge";
import Header from '@/components/Header';

const Index = () => {
  const { user, profile, loading, updateProfile } = useAuth();
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [newShopName, setNewShopName] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopEmail, setNewShopEmail] = useState('');
  const [newShopTaxRate, setNewShopTaxRate] = useState(0);
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [isApiKeyCopied, setIsApiKeyCopied] = useState(false);
  const [isShopActive, setIsShopActive] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [profileRole, setProfileRole] = useState<'admin' | 'cashier' | 'manager'>('cashier');
  const [profileShopId, setProfileShopId] = useState('');
  const { toast } = useToast();

  const navigate = useNavigate();

  // Check if user should be redirected to admin panel
  useEffect(() => {
    if (user && profile && !loading) {
      const isAdmin = profile.role === 'admin' || 
                     user.email === 'admin@billblaze.com' || 
                     user.email === 'harjot@iprofit.in';
      
      if (isAdmin) {
        navigate('/admin');
        return;
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile) {
      setProfileFullName(profile.full_name || '');
      setProfileRole(profile.role || 'cashier');
      setProfileShopId(profile.shop_id || '');
    }
  }, [user, profile]);

  useEffect(() => {
    const fetchShops = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setShops(data || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to fetch shops data. " + error.message,
          variant: "destructive",
        });
      }
    };

    if (user) {
      fetchShops();
    }
  }, [user]);

  useEffect(() => {
    if (shops.length > 0 && !selectedShop && profile?.shop_id) {
      const shopFromProfile = shops.find(shop => shop.id === profile.shop_id);
      setSelectedShop(shopFromProfile || shops[0]);
      setIsShopActive(shopFromProfile?.is_active ?? true);
    } else if (shops.length > 0 && !selectedShop) {
      setSelectedShop(shops[0]);
      setIsShopActive(shops[0]?.is_active ?? true);
    }
  }, [shops, selectedShop, profile]);

  const handleShopSelect = (shopId: string) => {
    const shop = shops.find(shop => shop.id === shopId);
    setSelectedShop(shop);
    setIsShopActive(shop?.is_active ?? true);
  };

  const handleCreateShop = async () => {
    setIsCreatingShop(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .insert([{
          name: newShopName,
          address: newShopAddress,
          phone: newShopPhone,
          email: newShopEmail,
          tax_rate: newShopTaxRate,
          is_active: isShopActive,
        }])
        .select('*');

      if (error) throw error;

      setShops([...shops, data[0]]);
      setNewShopName('');
      setNewShopAddress('');
      setNewShopPhone('');
      setNewShopEmail('');
      setNewShopTaxRate(0);
      setIsCreatingShop(false);
      toast({
        title: "Success",
        description: "Shop created successfully.",
      });
    } catch (error: any) {
      setIsCreatingShop(false);
      toast({
        title: "Error",
        description: "Failed to create shop. " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleApiKeyCopy = () => {
    navigator.clipboard.writeText(selectedShop?.api_key || 'No API Key');
    setIsApiKeyCopied(true);
    setTimeout(() => setIsApiKeyCopied(false), 2000);
  };

  const handleShopActiveToggle = async (checked: boolean) => {
    if (!selectedShop) return;

    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_active: checked })
        .eq('id', selectedShop.id);

      if (error) throw error;

      setIsShopActive(checked);
      setShops(shops.map(shop => shop.id === selectedShop.id ? { ...shop, is_active: checked } : shop));
      setSelectedShop({ ...selectedShop, is_active: checked });
      toast({
        title: "Success",
        description: `Shop ${checked ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error: any) {
      setIsShopActive(!checked);
      toast({
        title: "Error",
        description: "Failed to update shop status.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        description: "Logout successful!",
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to logout. " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async () => {
    setIsUpdatingProfile(true);
    try {
      await updateProfile({
        full_name: profileFullName,
        role: profileRole,
        shop_id: profileShopId,
      });
      toast({
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile. " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onLogout={handleLogout}
        onProfileUpdate={handleProfileUpdate}
        showBackToLanding={true}
        onBackToLanding={() => navigate('/')}
      />
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shop Selection and Info */}
          <Card>
            <CardHeader>
              <CardTitle>Shop Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={handleShopSelect} defaultValue={selectedShop?.id}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedShop && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{selectedShop.name}</h3>
                    <Badge variant={selectedShop.is_active ? "default" : "secondary"}>
                      {selectedShop.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p>Address: {selectedShop.address || 'Not provided'}</p>
                  <p>Phone: {selectedShop.phone || 'Not provided'}</p>
                  <p>Email: {selectedShop.email || 'Not provided'}</p>
                  <p>Tax Rate: {((selectedShop.tax_rate || 0) * 100).toFixed(2)}%</p>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor="shop-active">Shop Active</Label>
                    <Switch
                      id="shop-active"
                      checked={isShopActive}
                      onCheckedChange={handleShopActiveToggle}
                    />
                  </div>

                  <div className="mt-4">
                    <Label>API Key</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={selectedShop.api_key || 'No API Key'}
                        readOnly
                        className="pr-10"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={handleApiKeyCopy}
                        disabled={isApiKeyCopied}
                      >
                        {isApiKeyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Management */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  type="text"
                  value={profileFullName}
                  onChange={(e) => setProfileFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(value: 'admin' | 'cashier' | 'manager') => setProfileRole(value)} value={profileRole}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-id">Shop ID</Label>
                <Select onValueChange={(value) => setProfileShopId(value)} value={profileShopId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleProfileUpdate} disabled={isUpdatingProfile}>
                {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Create New Shop */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Create New Shop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-shop-name">Shop Name</Label>
                <Input
                  id="new-shop-name"
                  type="text"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-shop-address">Shop Address</Label>
                <Input
                  id="new-shop-address"
                  type="text"
                  value={newShopAddress}
                  onChange={(e) => setNewShopAddress(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-shop-phone">Shop Phone</Label>
                <Input
                  id="new-shop-phone"
                  type="text"
                  value={newShopPhone}
                  onChange={(e) => setNewShopPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-shop-email">Shop Email</Label>
                <Input
                  id="new-shop-email"
                  type="email"
                  value={newShopEmail}
                  onChange={(e) => setNewShopEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-shop-tax-rate">Shop Tax Rate (%)</Label>
              <Input
                id="new-shop-tax-rate"
                type="number"
                value={newShopTaxRate.toString()}
                onChange={(e) => setNewShopTaxRate(parseFloat(e.target.value))}
              />
            </div>
            <Button onClick={handleCreateShop} disabled={isCreatingShop}>
              {isCreatingShop ? 'Creating...' : 'Create Shop'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
