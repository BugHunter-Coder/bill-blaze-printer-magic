import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Users, 
  Activity, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Shop {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner_email?: string;
  user_count?: number;
  product_count?: number;
  subscription_tier?: string;
  subscription_status?: string;
}

const ShopManagement = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedTab, setSelectedTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);

      // Fetch shops with owner information
      const { data: shopsData, error: shopsError } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false });

      if (shopsError) throw shopsError;

      // Fetch owner emails and additional data
      const shopsWithDetails = await Promise.all(
        shopsData.map(async (shop) => {
          // Get owner email
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', shop.owner_id)
            .single();

          // Get user count for this shop
          const { data: userData } = await supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('shop_id', shop.id);

          // Get product count for this shop
          const { data: productData } = await supabase
            .from('products')
            .select('id', { count: 'exact' })
            .eq('shop_id', shop.id);

          // Get subscription info
          const { data: subscriptionData } = await supabase
            .from('subscribers')
            .select('subscription_tier, subscribed')
            .eq('user_id', shop.owner_id)
            .single();

          return {
            ...shop,
            owner_email: ownerData?.email || 'Unknown',
            user_count: userData?.length || 0,
            product_count: productData?.length || 0,
            subscription_tier: subscriptionData?.subscription_tier || 'Free',
            subscription_status: subscriptionData?.subscribed ? 'active' : 'inactive'
          };
        })
      );

      setShops(shopsWithDetails);

    } catch (error) {
      console.error('Error fetching shops:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shops data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShopStatusToggle = async (shopId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_active: !currentStatus })
        .eq('id', shopId);

      if (error) throw error;

      // Update local state
      setShops(shops.map(shop => 
        shop.id === shopId 
          ? { ...shop, is_active: !currentStatus }
          : shop
      ));

      toast({
        title: "Success",
        description: `Shop ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });

    } catch (error) {
      console.error('Error updating shop status:', error);
      toast({
        title: "Error",
        description: "Failed to update shop status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    if (!confirm(`Are you sure you want to delete "${shopName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', shopId);

      if (error) throw error;

      // Update local state
      setShops(shops.filter(shop => shop.id !== shopId));

      toast({
        title: "Success",
        description: `Shop "${shopName}" deleted successfully.`,
      });

    } catch (error) {
      console.error('Error deleting shop:', error);
      toast({
        title: "Error",
        description: "Failed to delete shop.",
        variant: "destructive",
      });
    }
  };

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.owner_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && shop.is_active) ||
                         (filterStatus === 'inactive' && !shop.is_active);
    return matchesSearch && matchesStatus;
  });

  const activeShops = shops.filter(shop => shop.is_active);
  const inactiveShops = shops.filter(shop => !shop.is_active);
  const pendingShops = shops.filter(shop => shop.subscription_status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop Management</h1>
          <p className="text-gray-600">Manage all shops and their owners</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchShops} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Shop
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shops.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all tiers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shops</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeShops.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Shops</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveShops.length}</div>
            <p className="text-xs text-muted-foreground">
              Suspended or disabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingShops.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search shops by name or owner email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Shops ({shops.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeShops.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveShops.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingShops.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ShopList shops={filteredShops} onStatusToggle={handleShopStatusToggle} onDelete={handleDeleteShop} />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <ShopList shops={activeShops} onStatusToggle={handleShopStatusToggle} onDelete={handleDeleteShop} />
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <ShopList shops={inactiveShops} onStatusToggle={handleShopStatusToggle} onDelete={handleDeleteShop} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <ShopList shops={pendingShops} onStatusToggle={handleShopStatusToggle} onDelete={handleDeleteShop} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface ShopListProps {
  shops: Shop[];
  onStatusToggle: (shopId: string, currentStatus: boolean) => void;
  onDelete: (shopId: string, shopName: string) => void;
}

const ShopList: React.FC<ShopListProps> = ({ shops, onStatusToggle, onDelete }) => {
  if (shops.length === 0) {
    return (
      <div className="text-center py-12">
        <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No shops found</h3>
        <p className="text-gray-500">No shops match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {shops.map((shop) => (
        <Card key={shop.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{shop.name}</h3>
                  <p className="text-sm text-gray-500">{shop.owner_email}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <Badge variant={shop.is_active ? 'default' : 'secondary'}>
                      {shop.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{shop.subscription_tier}</Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(shop.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium">{shop.user_count} users</div>
                  <div className="text-sm text-gray-500">{shop.product_count} products</div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusToggle(shop.id, shop.is_active)}
                  >
                    {shop.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(shop.id, shop.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ShopManagement; 