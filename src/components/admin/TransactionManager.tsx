import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Receipt, Search, Filter, Download, Trash2, Eye, Store, Users, DollarSign } from 'lucide-react';
import { Shop } from '@/types/pos';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import bcrypt from 'bcryptjs';
import { useShop } from '@/hooks/useShop';
import { useSensitiveMask } from '@/components/SensitiveMaskContext';

interface TransactionManagerProps {
  shops: Shop[];
}

interface Transaction {
  id: string;
  shop_id: string;
  shop_name: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  items: any[];
  customer_name?: string;
  customer_phone?: string;
}

export const TransactionManager = ({ shops }: TransactionManagerProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const { toast } = useToast();
  const { maskSensitive, setMaskSensitive } = useSensitiveMask();
  const [pinModal, setPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [shopPinHash, setShopPinHash] = useState<string | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string>('all');

  useEffect(() => {
    // Fetch the shop's sensitive_data_pin hash
    const fetchPin = async () => {
      if (!selectedShopId || selectedShopId === 'all') return;
      const { data, error } = await supabase
        .from('shops')
        .select('sensitive_data_pin')
        .eq('id', selectedShopId)
        .single();
      if (!error && data && typeof data.sensitive_data_pin === 'string') {
        setShopPinHash(data.sensitive_data_pin);
      }
    };
    fetchPin();
  }, [selectedShopId]);

  useEffect(() => {
    fetchTransactions();
  }, [shops, selectedShopId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('transactions')
        .select(`
          *,
          shops!inner(name)
        `)
        .order('created_at', { ascending: false });

      // Filter by shop if selected
      if (selectedShopId !== 'all') {
        query = query.eq('shop_id', selectedShopId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include shop name
      const transformedTransactions = (data || []).map(tx => ({
        ...tx,
        shop_name: tx.shops?.name || 'Unknown Shop'
      }));

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearShopData = async (shopId: string, dataType: string) => {
    if (!confirm(`Are you sure you want to clear all ${dataType} for this shop? This action cannot be undone.`)) {
      return;
    }

    try {
      let tableName = '';
      switch (dataType) {
        case 'transactions':
          tableName = 'transactions';
          break;
        case 'products':
          tableName = 'products';
          break;
        case 'customers':
          tableName = 'profiles';
          break;
        default:
          throw new Error('Invalid data type');
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('shop_id', shopId);

      if (error) throw error;

      await fetchTransactions();
      toast({
        title: "Success",
        description: `All ${dataType} cleared for the shop.`,
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

  const exportTransactions = async () => {
    try {
      const csvContent = [
        ['Shop', 'Transaction ID', 'Amount', 'Payment Method', 'Status', 'Date', 'Customer'],
        ...transactions.map(tx => [
          tx.shop_name,
          tx.id,
          tx.total_amount,
          tx.payment_method,
          tx.status,
          new Date(tx.created_at).toLocaleDateString(),
          tx.customer_name || 'N/A'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Transactions exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export transactions.",
        variant: "destructive",
      });
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tx.customer_name && tx.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPayment = paymentFilter === 'all' || tx.payment_method === paymentFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const txDate = new Date(tx.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = txDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          matchesDate = txDate.toDateString() === yesterday.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = txDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = txDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesPayment && matchesDate;
  });

  const totalRevenue = filteredTransactions.reduce((sum, tx) => sum + tx.total_amount, 0);
  const totalTransactions = filteredTransactions.length;

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
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm sm:text-base">Loading transactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mask Sensitive Data Toggle */}
      <div className="flex items-center justify-end mb-4">
        <span className="mr-2 font-medium">Mask All Sensitive Data</span>
        <Switch checked={maskSensitive} onCheckedChange={handleMaskToggle} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
            Transaction Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="shop-filter" className="text-sm">Shop</Label>
              <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                <SelectTrigger id="shop-filter" className="text-sm">
                  <SelectValue placeholder="All shops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Shops</SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id} className="text-sm">
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm">Search</Label>
              <Input
                id="search"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-filter" className="text-sm">Date</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="date-filter" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Time</SelectItem>
                  <SelectItem value="today" className="text-sm">Today</SelectItem>
                  <SelectItem value="yesterday" className="text-sm">Yesterday</SelectItem>
                  <SelectItem value="week" className="text-sm">Last 7 Days</SelectItem>
                  <SelectItem value="month" className="text-sm">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-filter" className="text-sm">Payment</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger id="payment-filter" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm">All Methods</SelectItem>
                  <SelectItem value="cash" className="text-sm">Cash</SelectItem>
                  <SelectItem value="card" className="text-sm">Card</SelectItem>
                  <SelectItem value="upi" className="text-sm">UPI</SelectItem>
                  <SelectItem value="bank_transfer" className="text-sm">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={exportTransactions} className="w-full sm:w-auto text-sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Total Transactions</p>
                    <p className="text-lg font-bold text-blue-900">
                      {!maskSensitive ? totalTransactions : '****'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Total Revenue</p>
                    <p className="text-lg font-bold text-green-900">
                      {!maskSensitive ? `₹${totalRevenue.toLocaleString()}` : '****'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Store className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Active Shops</p>
                    <p className="text-lg font-bold text-purple-900">{shops.filter(s => s.is_active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Shop</th>
                    <th className="text-left p-2">Transaction ID</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Payment</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{tx.shop_name}</td>
                      <td className="p-2 text-gray-600">{tx.id.slice(0, 8)}...</td>
                      <td className="p-2 font-semibold">
                        {!maskSensitive ? `₹${tx.total_amount}` : '****'}
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {tx.payment_method}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="p-2 text-gray-600">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-gray-600">
                        {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-2 text-gray-600">
                        {tx.customer_name || 'N/A'}
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline" className="h-6 w-6 p-0">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No transactions found</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                No transactions match your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shop Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Shop Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription>
              Super admins can clear shop data. This action cannot be undone and will remove all data for the selected shop.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {shops.map((shop) => (
              <Card key={shop.id} className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Store className="h-4 w-4 mr-2 text-red-600" />
                    {shop.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => clearShopData(shop.id, 'transactions')}
                      className="flex-1 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear Transactions
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => clearShopData(shop.id, 'products')}
                      className="flex-1 text-xs"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear Products
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => clearShopData(shop.id, 'customers')}
                    className="w-full text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear Customers
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PIN Modal */}
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
    </div>
  );
}; 