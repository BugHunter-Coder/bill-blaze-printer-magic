import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Star, 
  Crown, 
  Zap, 
  Check, 
  ArrowRight,
  Smartphone,
  Globe,
  TrendingUp,
  Shield,
  Headphones,
  Rocket
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface MobileSubscriptionCardProps {
  className?: string;
}

const subscriptionTiers = [
  {
    id: 'basic',
    name: 'Basic',
    price: '₹999',
    icon: <Star className="h-5 w-5" />,
    color: 'text-blue-600',
    features: ['100 Products', 'Mobile POS', 'Basic Support']
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹1,999',
    icon: <Crown className="h-5 w-5" />,
    color: 'text-purple-600',
    popular: true,
    features: ['500 Products', 'Advanced Features', 'Priority Support']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹4,999',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-orange-600',
    features: ['Unlimited', 'Custom Features', '24/7 Support']
  }
];

export const MobileSubscriptionCard = ({ className }: MobileSubscriptionCardProps) => {
  const { selectedShop } = useShop();
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | 'enterprise' | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleQuickApply = async () => {
    if (!selectedShop || !selectedTier) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('subscription_applications')
        .insert({
          shop_id: selectedShop.id,
          shop_name: selectedShop.name,
          owner_id: selectedShop.owner_id,
          requested_tier: selectedTier,
          application_reason: 'Quick mobile application',
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Application Submitted! 🎉",
        description: `Your ${selectedTier} subscription application has been submitted successfully.`,
      });

      setDialogOpen(false);
      setSelectedTier(null);
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

  return (
    <Card className={`bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            Upgrade Your Plan
          </CardTitle>
          <Badge variant="default" className="bg-blue-600">
            <Rocket className="h-3 w-3 mr-1" />
            New
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          Unlock advanced features and scale your business
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Plan Selection */}
        <div className="grid grid-cols-3 gap-2">
          {subscriptionTiers.map((tier) => (
            <Button
              key={tier.id}
              variant={selectedTier === tier.id ? "default" : "outline"}
              size="sm"
              className={`h-auto p-3 flex flex-col items-center space-y-1 ${
                selectedTier === tier.id ? 'bg-blue-600 text-white' : ''
              }`}
              onClick={() => setSelectedTier(tier.id as any)}
            >
              <div className={tier.color}>
                {tier.icon}
              </div>
              <span className="text-xs font-medium">{tier.name}</span>
              <span className="text-xs">{tier.price}</span>
              {tier.popular && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Popular
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Features Preview */}
        <div className="bg-white rounded-lg p-3 space-y-2">
          <h4 className="font-medium text-sm text-gray-900">What you get:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Smartphone className="h-3 w-3 text-blue-600" />
              <span>Mobile POS</span>
            </div>
            <div className="flex items-center space-x-1">
              <Globe className="h-3 w-3 text-green-600" />
              <span>Cloud Sync</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3 text-purple-600" />
              <span>Analytics</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="h-3 w-3 text-orange-600" />
              <span>Security</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => navigate('/subscription')}
          >
            View Details
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="flex-1"
                disabled={!selectedTier}
              >
                Quick Apply
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Quick Subscription Application</DialogTitle>
                <DialogDescription>
                  You're applying for the {selectedTier && subscriptionTiers.find(t => t.id === selectedTier)?.name} plan. 
                  This will be reviewed within 24-48 hours.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleQuickApply}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Support Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Need help? <span className="text-blue-600 font-medium">Contact Support</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 