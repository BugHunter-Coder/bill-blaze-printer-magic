import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Check, 
  X, 
  Star, 
  Crown, 
  Zap, 
  Shield, 
  Users, 
  Database,
  Send,
  Loader2
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SubscriptionTier {
  id: 'basic' | 'premium' | 'enterprise';
  name: string;
  price: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '₹999/month',
    icon: <Star className="h-6 w-6" />,
    color: 'text-blue-600',
    features: [
      'Up to 100 products',
      'Basic POS features',
      'Email support',
      'Daily backups',
      'Mobile app access',
      'Basic analytics'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹1,999/month',
    icon: <Crown className="h-6 w-6" />,
    color: 'text-purple-600',
    popular: true,
    features: [
      'Up to 500 products',
      'Advanced POS features',
      'Priority support',
      'Real-time backups',
      'Advanced analytics',
      'Multi-user access',
      'Inventory management',
      'Customer management',
      'Bluetooth printer support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹4,999/month',
    icon: <Zap className="h-6 w-6" />,
    color: 'text-orange-600',
    features: [
      'Unlimited products',
      'All POS features',
      '24/7 support',
      'Custom integrations',
      'Advanced reporting',
      'Multi-shop management',
      'API access',
      'White-label options',
      'Custom branding',
      'Dedicated account manager'
    ]
  }
];

export const SubscriptionApplication = () => {
  const { selectedShop } = useShop();
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | 'enterprise' | null>(null);
  const [applicationReason, setApplicationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleApply = async () => {
    if (!selectedShop || !selectedTier) return;

    try {
      setLoading(true);

      // Create subscription application
      const { error } = await supabase
        .from('subscription_applications')
        .insert({
          shop_id: selectedShop.id,
          shop_name: selectedShop.name,
          owner_id: selectedShop.owner_id,
          requested_tier: selectedTier,
          application_reason: applicationReason,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: `Your ${selectedTier} subscription application has been submitted successfully. We'll review it and get back to you soon.`,
      });

      setDialogOpen(false);
      setSelectedTier(null);
      setApplicationReason('');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    if (!selectedShop) return false;

    try {
      const { data } = await supabase
        .from('subscription_applications')
        .select('*')
        .eq('shop_id', selectedShop.id)
        .eq('status', 'pending')
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Choose Your Subscription Plan
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the perfect plan for your business needs. All plans include our core POS features with different levels of advanced functionality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptionTiers.map((tier) => (
          <Card 
            key={tier.id} 
            className={`relative hover:shadow-lg transition-all duration-200 cursor-pointer ${
              selectedTier === tier.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
            } ${tier.popular ? 'border-purple-200' : ''}`}
            onClick={() => setSelectedTier(tier.id)}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white px-3 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className={`mx-auto mb-2 ${tier.color}`}>
                {tier.icon}
              </div>
              <CardTitle className="text-xl">{tier.name}</CardTitle>
              <div className="text-3xl font-bold text-gray-900">{tier.price}</div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full ${selectedTier === tier.id ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                variant={selectedTier === tier.id ? 'default' : 'outline'}
              >
                {selectedTier === tier.id ? 'Selected' : 'Select Plan'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTier && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <CreditCard className="h-5 w-5 mr-2" />
              Apply for {subscriptionTiers.find(t => t.id === selectedTier)?.name} Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                You've selected the <strong>{subscriptionTiers.find(t => t.id === selectedTier)?.name}</strong> plan. 
                Click below to submit your application for review.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Why do you need this subscription? (Optional)
              </label>
              <textarea
                value={applicationReason}
                onChange={(e) => setApplicationReason(e.target.value)}
                placeholder="Tell us about your business needs and how this subscription will help..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Application
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Subscription Application</DialogTitle>
                  <DialogDescription>
                    You're about to submit an application for the{' '}
                    <strong>{subscriptionTiers.find(t => t.id === selectedTier)?.name}</strong> plan.
                    Our team will review your application and get back to you within 24-48 hours.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleApply}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-800">
            <Shield className="h-5 w-5 mr-2" />
            What's Included in All Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Secure POS System</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Mobile Responsive</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Data Backup</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">24/7 Uptime</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 