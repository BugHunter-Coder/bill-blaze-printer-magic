import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Store, User, Mail, Phone, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShopApplication {
  id: string;
  shop_name: string;
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  business_type: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  notes?: string;
}

const ShopApprovals = () => {
  const [applications, setApplications] = useState<ShopApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ShopApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);

      // Fetch shop applications from subscription_applications table
      const { data, error } = await supabase
        .from('subscription_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match our interface
      const transformedData: ShopApplication[] = (data || []).map(app => ({
        id: app.id,
        shop_name: app.shop_name || 'N/A',
        owner_name: app.owner_name || 'N/A',
        owner_email: app.owner_email || 'N/A',
        owner_phone: app.owner_phone || 'N/A',
        business_type: app.business_type || 'Retail',
        address: app.address || 'N/A',
        status: app.status || 'pending',
        created_at: app.created_at,
        updated_at: app.updated_at,
        notes: app.notes
      }));

      setApplications(transformedData);

    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shop applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessing(true);

      const { error } = await supabase
        .from('subscription_applications')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // If approved, create the shop and user
      if (status === 'approved') {
        const app = applications.find(a => a.id === applicationId);
        if (app) {
          await createShopAndUser(app);
        }
      }

      await fetchApplications();
      setDialogOpen(false);
      setSelectedApp(null);

      toast({
        title: status === 'approved' ? "Application Approved" : "Application Rejected",
        description: `Shop application has been ${status}.`,
        variant: status === 'approved' ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const createShopAndUser = async (app: ShopApplication) => {
    try {
      // Create shop
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          name: app.shop_name,
          business_type: app.business_type,
          address: app.address,
          is_active: true,
          owner_email: app.owner_email
        })
        .select()
        .single();

      if (shopError) throw shopError;

      // Create user profile for shop owner
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          email: app.owner_email,
          full_name: app.owner_name,
          phone: app.owner_phone,
          shop_id: shop.id,
          role: 'owner'
        });

      if (profileError) throw profileError;

    } catch (error) {
      console.error('Error creating shop and user:', error);
      throw error;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingApplications = applications.filter(app => app.status === 'pending');
  const approvedApplications = applications.filter(app => app.status === 'approved');
  const rejectedApplications = applications.filter(app => app.status === 'rejected');

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
        <h1 className="text-3xl font-bold text-gray-900">Shop Approvals</h1>
        <p className="text-gray-600">Review and manage new shop applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApplications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedApplications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedApplications.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingApplications.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedApplications.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedApplications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApplications.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending applications</p>
                ) : (
                  pendingApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Store className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-medium">{app.shop_name}</h3>
                          <p className="text-sm text-gray-500">{app.owner_name} • {app.owner_email}</p>
                          <p className="text-xs text-gray-400">{app.business_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(app.status)}
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setDialogOpen(true);
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {approvedApplications.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No approved applications</p>
                ) : (
                  approvedApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Store className="h-8 w-8 text-green-600" />
                        <div>
                          <h3 className="font-medium">{app.shop_name}</h3>
                          <p className="text-sm text-gray-500">{app.owner_name} • {app.owner_email}</p>
                          <p className="text-xs text-gray-400">Approved on {new Date(app.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rejectedApplications.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No rejected applications</p>
                ) : (
                  rejectedApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Store className="h-8 w-8 text-red-600" />
                        <div>
                          <h3 className="font-medium">{app.shop_name}</h3>
                          <p className="text-sm text-gray-500">{app.owner_name} • {app.owner_email}</p>
                          <p className="text-xs text-gray-400">Rejected on {new Date(app.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Review the shop application details and approve or reject it.
            </DialogDescription>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Shop Name</label>
                  <p className="text-sm text-gray-600">{selectedApp.shop_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Business Type</label>
                  <p className="text-sm text-gray-600">{selectedApp.business_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Owner Name</label>
                  <p className="text-sm text-gray-600">{selectedApp.owner_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Owner Email</label>
                  <p className="text-sm text-gray-600">{selectedApp.owner_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Owner Phone</label>
                  <p className="text-sm text-gray-600">{selectedApp.owner_phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Address</label>
                  <p className="text-sm text-gray-600">{selectedApp.address}</p>
                </div>
              </div>
              
              {selectedApp.notes && (
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <p className="text-sm text-gray-600">{selectedApp.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedApp && handleApproval(selectedApp.id, 'rejected')}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Reject'}
            </Button>
            <Button
              onClick={() => selectedApp && handleApproval(selectedApp.id, 'approved')}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopApprovals; 