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
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm sm:text-base">Loading subscriptions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
            Subscription Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="shop-select" className="text-sm">Select Shop</Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger id="shop-select" className="text-sm">
                  <SelectValue placeholder="Choose a shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop.id} value={shop.id} className="text-sm">
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier-select" className="text-sm">Subscription Tier</Label>
              <Select value={newSubscriptionTier} onValueChange={(value: 'basic' | 'premium' | 'enterprise') => setNewSubscriptionTier(value)}>
                <SelectTrigger id="tier-select" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic" className="text-sm">Basic</SelectItem>
                  <SelectItem value="premium" className="text-sm">Premium</SelectItem>
                  <SelectItem value="enterprise" className="text-sm">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration-input" className="text-sm">Duration (days)</Label>
              <Input
                id="duration-input"
                type="number"
                value={subscriptionDuration}
                onChange={(e) => setSubscriptionDuration(parseInt(e.target.value) || 30)}
                min="1"
                max="365"
                className="text-sm"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => {
                  if (selectedShop) {
                    updateSubscription(selectedShop, 'active', newSubscriptionTier, subscriptionDuration);
                  }
                }}
                disabled={!selectedShop}
                className="w-full sm:w-auto text-sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Activate Subscription
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {subscriptions.map((subscription) => (
          <Card key={subscription.shopId} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg flex items-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                  <span className="truncate">{subscription.shopName}</span>
                </CardTitle>
                <Badge 
                  variant={subscription.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {subscription.subscriptionStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <p className="truncate"><strong>Owner:</strong> {subscription.ownerEmail}</p>
                <p><strong>Tier:</strong> {subscription.subscriptionTier}</p>
                {subscription.subscriptionEnd && (
                  <p><strong>Ends:</strong> {new Date(subscription.subscriptionEnd).toLocaleDateString()}</p>
                )}
                {subscription.stripeCustomerId && (
                  <p className="truncate"><strong>Stripe ID:</strong> {subscription.stripeCustomerId}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateSubscription(
                    subscription.shopId, 
                    subscription.subscriptionStatus === 'active' ? 'inactive' : 'active',
                    subscription.subscriptionTier,
                    30
                  )}
                  className="flex-1 sm:flex-none text-xs"
                >
                  {subscription.subscriptionStatus === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => revokeSubscription(subscription.shopId)}
                  className="flex-1 sm:flex-none text-xs"
                >
                  Revoke
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {subscriptions.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <CreditCard className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No subscriptions found</h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            No subscription data available for the shops.
          </p>
        </div>
      )}
    </div>
  );
};
