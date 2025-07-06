import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BillingData {
  totalRevenue: number;
  activeSubscriptions: number;
  pendingPayments: number;
  overduePayments: number;
  monthlyGrowth: number;
  subscriptions: Array<{
    id: string;
    shop_name: string;
    owner_email: string;
    subscription_status: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    amount: number;
    currency: string;
    next_billing_date: string;
    created_at: string;
  }>;
}

const BillingManagement = () => {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);

      // Fetch subscription data from subscribers table
      const { data: subscribers, error: subscribersError } = await supabase
        .from('subscribers')
        .select('*')
        .order('created_at', { ascending: false });

      if (subscribersError) throw subscribersError;

      // Fetch shops data to get shop names
      const { data: shops, error: shopsError } = await supabase
        .from('shops')
        .select('id, name');

      if (shopsError) throw shopsError;

      // Create a map of shop IDs to names
      const shopMap = new Map(shops?.map(shop => [shop.id, shop.name]) || []);

      // Transform subscription data
      const subscriptions = (subscribers || []).map(sub => ({
        id: sub.id,
        shop_name: shopMap.get(sub.shop_id) || 'Unknown Shop',
        owner_email: sub.owner_email,
        subscription_status: sub.subscription_status || 'inactive',
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: sub.stripe_subscription_id,
        amount: sub.amount || 0,
        currency: sub.currency || 'INR',
        next_billing_date: sub.next_billing_date || sub.created_at,
        created_at: sub.created_at
      }));

      // Calculate billing statistics
      const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.amount, 0);
      const activeSubscriptions = subscriptions.filter(sub => sub.subscription_status === 'active').length;
      const pendingPayments = subscriptions.filter(sub => sub.subscription_status === 'pending').length;
      const overduePayments = subscriptions.filter(sub => {
        const nextBilling = new Date(sub.next_billing_date);
        return nextBilling < new Date() && sub.subscription_status === 'active';
      }).length;

      // Mock monthly growth (in real app, you'd calculate this from historical data)
      const monthlyGrowth = 12.5;

      setBillingData({
        totalRevenue,
        activeSubscriptions,
        pendingPayments,
        overduePayments,
        monthlyGrowth,
        subscriptions
      });

    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch billing data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Cancelled</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredSubscriptions = billingData?.subscriptions.filter(sub => {
    const matchesSearch = 
      sub.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.owner_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || sub.subscription_status === filterStatus;

    return matchesSearch && matchesStatus;
  }) || [];

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing Management</h1>
        <p className="text-gray-600">Manage subscriptions, payments, and billing</p>
      </div>

      {/* Billing Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{billingData?.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{billingData?.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData?.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData?.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData?.overduePayments}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Management Tabs */}
      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">All Subscriptions</TabsTrigger>
          <TabsTrigger value="pending">Pending Payments</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by shop name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredSubscriptions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No subscriptions found</p>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Store className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{subscription.shop_name}</h3>
                          <p className="text-sm text-gray-500">{subscription.owner_email}</p>
                          <p className="text-xs text-gray-400">
                            Next billing: {new Date(subscription.next_billing_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium">₹{subscription.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">{subscription.currency}</div>
                        </div>
                        {getStatusBadge(subscription.subscription_status)}
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingData?.subscriptions.filter(sub => sub.subscription_status === 'pending').length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending payments</p>
                ) : (
                  billingData?.subscriptions
                    .filter(sub => sub.subscription_status === 'pending')
                    .map((subscription) => (
                      <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Clock className="h-8 w-8 text-yellow-600" />
                          <div>
                            <h3 className="font-medium">{subscription.shop_name}</h3>
                            <p className="text-sm text-gray-500">{subscription.owner_email}</p>
                            <p className="text-xs text-gray-400">Payment pending</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-medium">₹{subscription.amount.toLocaleString()}</div>
                          </div>
                          <Button size="sm">Send Reminder</Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingData?.overduePayments === 0 ? (
                  <p className="text-center text-gray-500 py-8">No overdue payments</p>
                ) : (
                  billingData?.subscriptions
                    .filter(sub => {
                      const nextBilling = new Date(sub.next_billing_date);
                      return nextBilling < new Date() && sub.subscription_status === 'active';
                    })
                    .map((subscription) => (
                      <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                        <div className="flex items-center space-x-4">
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                          <div>
                            <h3 className="font-medium">{subscription.shop_name}</h3>
                            <p className="text-sm text-gray-500">{subscription.owner_email}</p>
                            <p className="text-xs text-red-600">
                              Overdue since {new Date(subscription.next_billing_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-medium">₹{subscription.amount.toLocaleString()}</div>
                          </div>
                          <Button size="sm" variant="destructive">Suspend</Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingManagement; 