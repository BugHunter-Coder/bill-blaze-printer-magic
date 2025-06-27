
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Users, DollarSign, AlertCircle } from 'lucide-react';
import { Shop } from '@/types/pos';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionManagerProps {
  shops: Shop[];
}

interface SubscriptionData {
  shopId: string;
  shopName: string;
  ownerId: string;
  ownerEmail: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'expired';
  subscriptionTier: 'basic' | 'premium' | 'enterprise';
  subscriptionEnd: string | null;
  stripeCustomerId: string | null;
}

interface ProfileWithEmail {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'cashier' | 'manager' | null;
  shop_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface SubscriberRecord {
  id: string;
  user_id: string | null;
  email: string;
  stripe_customer_id: string | null;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  created_at: string;
  updated_at: string;
}

export const SubscriptionManager = ({ shops }: SubscriptionManagerProps) => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<string>('');
  const [newSubscriptionTier, setNewSubscriptionTier] = useState<'basic' | 'premium' | 'enterprise'>('basic');
  const [subscriptionDuration, setSubscriptionDuration] = useState<number>(30);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, [shops]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const subscriptionData: SubscriptionData[] = [];

      for (const shop of shops) {
        // Get owner profile with email
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', shop.owner_id)
          .single();

        const profileWithEmail = ownerProfile as ProfileWithEmail;

        // Check if there's a subscription record
        const { data: subscriber } = await supabase
          .from('subscribers')
          .select('*')
          .eq('email', profileWithEmail?.email || '')
          .single();

        const subscriberRecord = subscriber as SubscriberRecord;

        subscriptionData.push({
          shopId: shop.id,
          shopName: shop.name,
          ownerId: shop.owner_id || '',
          ownerEmail: profileWithEmail?.email || '',
          subscriptionStatus: subscriberRecord?.subscribed ? 'active' : 'inactive',
          subscriptionTier: (subscriberRecord?.subscription_tier as 'basic' | 'premium' | 'enterprise') || 'basic',
          subscriptionEnd: subscriberRecord?.subscription_end,
          stripeCustomerId: subscriberRecord?.stripe_customer_id,
        });
      }

      setSubscriptions(subscriptionData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (shopId: string, status: 'active' | 'inactive', tier: string, duration: number) => {
    try {
      const subscription = subscriptions.find(s => s.shopId === shopId);
      if (!subscription) return;

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + duration);

      const { error } = await supabase
        .from('subscribers')
        .upsert({
          email: subscription.ownerEmail,
          user_id: subscription.ownerId,
          subscribed: status === 'active',
          subscription_tier: tier,
          subscription_end: status === 'active' ? endDate.toISOString() : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      if (error) throw error;

      await fetchSubscriptions();
      toast({
        title: "Success",
        description: `Subscription updated for ${subscription.shopName}`,
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription.",
        variant: "destructive",
      });
    }
  };

  const revokeSubscription = async (shopId: string) => {
    if (!confirm('Are you sure you want to revoke this subscription?')) return;

    try {
      const subscription = subscriptions.find(s => s.shopId === shopId);
      if (!subscription) return;

      const { error } = await supabase
        .from('subscribers')
        .update({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          updated_at: new Date().toISOString(),
        })
        .eq('email', subscription.ownerEmail);

      if (error) throw error;

      await fetchSubscriptions();
      toast({
        title: "Success",
        description: `Subscription revoked for ${subscription.shopName}`,
      });
    } catch (error) {
      console.error('Error revoking subscription:', error);
      toast({
        title: "Error",
        description: "Failed to revoke subscription.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading subscriptions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-green-600" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              As a super admin, you can manage all shop subscriptions, grant access, and control billing features.
            </AlertDescription>
          </Alert>

          {/* Grant New Subscription */}
          <div className="mb-6 p-4 border rounded-lg">
            <h3 className="font-medium mb-4">Grant New Subscription</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Select Shop</Label>
                <Select onValueChange={setSelectedShop} value={selectedShop}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose shop" />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subscription Tier</Label>
                <Select onValueChange={(value: 'basic' | 'premium' | 'enterprise') => setNewSubscriptionTier(value)} value={newSubscriptionTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duration (Days)</Label>
                <Input
                  type="number"
                  value={subscriptionDuration}
                  onChange={(e) => setSubscriptionDuration(Number(e.target.value))}
                  min="1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => selectedShop && updateSubscription(selectedShop, 'active', newSubscriptionTier, subscriptionDuration)}
                  disabled={!selectedShop}
                  className="w-full"
                >
                  Grant Subscription
                </Button>
              </div>
            </div>
          </div>

          {/* Subscription List */}
          <div className="space-y-4">
            <h3 className="font-medium">Current Subscriptions</h3>
            {subscriptions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptions.map((sub) => (
                  <Card key={sub.shopId} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{sub.shopName}</CardTitle>
                        <Badge variant={sub.subscriptionStatus === 'active' ? "default" : "secondary"}>
                          {sub.subscriptionStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <p><strong>Owner:</strong> {sub.ownerEmail}</p>
                        <p><strong>Tier:</strong> {sub.subscriptionTier}</p>
                        {sub.subscriptionEnd && (
                          <p><strong>Expires:</strong> {new Date(sub.subscriptionEnd).toLocaleDateString()}</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        {sub.subscriptionStatus === 'active' ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => revokeSubscription(sub.shopId)}
                          >
                            Revoke
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateSubscription(sub.shopId, 'active', 'basic', 30)}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subscriptions found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Grant subscriptions to shops to enable premium features.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
