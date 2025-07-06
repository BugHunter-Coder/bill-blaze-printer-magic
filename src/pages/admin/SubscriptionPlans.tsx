import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, Crown, Zap, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'basic' | 'premium' | 'enterprise';
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  features: string[];
  max_products: number;
  max_users: number;
  is_active: boolean;
  created_at: string;
}

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    tier: 'basic' as 'basic' | 'premium' | 'enterprise',
    price: 0,
    currency: 'INR',
    billing_cycle: 'monthly' as 'monthly' | 'yearly',
    features: [''],
    max_products: 100,
    max_users: 1,
    is_active: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);

      // For now, we'll use mock data since we don't have a subscription_plans table
      // In a real app, you'd fetch from a subscription_plans table
      const mockPlans: SubscriptionPlan[] = [
        {
          id: '1',
          name: 'Basic Plan',
          tier: 'basic',
          price: 999,
          currency: 'INR',
          billing_cycle: 'monthly',
          features: [
            'Up to 100 products',
            'Basic POS features',
            'Email support',
            'Daily backups',
            'Mobile app access',
            'Basic analytics'
          ],
          max_products: 100,
          max_users: 1,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Premium Plan',
          tier: 'premium',
          price: 1999,
          currency: 'INR',
          billing_cycle: 'monthly',
          features: [
            'Up to 500 products',
            'Advanced POS features',
            'Priority support',
            'Real-time backups',
            'Advanced analytics',
            'Multi-user access',
            'Inventory management',
            'Bluetooth printer support'
          ],
          max_products: 500,
          max_users: 5,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Enterprise Plan',
          tier: 'enterprise',
          price: 4999,
          currency: 'INR',
          billing_cycle: 'monthly',
          features: [
            'Unlimited products',
            'All POS features',
            '24/7 support',
            'Custom integrations',
            'Advanced reporting',
            'Multi-shop management',
            'API access',
            'White-label options'
          ],
          max_products: -1, // Unlimited
          max_users: -1, // Unlimited
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];

      setPlans(mockPlans);

    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription plans.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    try {
      setSaving(true);

      // In a real app, you'd save to a subscription_plans table
      if (editingPlan) {
        // Update existing plan
        const updatedPlans = plans.map(plan => 
          plan.id === editingPlan.id ? { ...plan, ...formData } : plan
        );
        setPlans(updatedPlans);
      } else {
        // Create new plan
        const newPlan: SubscriptionPlan = {
          id: Date.now().toString(),
          ...formData,
          created_at: new Date().toISOString()
        };
        setPlans([...plans, newPlan]);
      }

      setDialogOpen(false);
      setEditingPlan(null);
      resetForm();

      toast({
        title: "Success",
        description: `Plan ${editingPlan ? 'updated' : 'created'} successfully.`,
      });

    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: "Failed to save plan.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      tier: plan.tier,
      price: plan.price,
      currency: plan.currency,
      billing_cycle: plan.billing_cycle,
      features: plan.features,
      max_products: plan.max_products,
      max_users: plan.max_users,
      is_active: plan.is_active
    });
    setDialogOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const updatedPlans = plans.filter(plan => plan.id !== planId);
      setPlans(updatedPlans);
      
      toast({
        title: "Success",
        description: "Plan deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete plan.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      tier: 'basic',
      price: 0,
      currency: 'INR',
      billing_cycle: 'monthly',
      features: [''],
      max_products: 100,
      max_users: 1,
      is_active: true
    });
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Star className="h-5 w-5 text-blue-600" />;
      case 'premium':
        return <Crown className="h-5 w-5 text-purple-600" />;
      case 'enterprise':
        return <Zap className="h-5 w-5 text-orange-600" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'basic':
        return <Badge variant="outline" className="flex items-center gap-1"><Star className="h-3 w-3" />Basic</Badge>;
      case 'premium':
        return <Badge variant="default" className="flex items-center gap-1"><Crown className="h-3 w-3" />Premium</Badge>;
      case 'enterprise':
        return <Badge variant="secondary" className="flex items-center gap-1"><Zap className="h-3 w-3" />Enterprise</Badge>;
      default:
        return <Badge variant="outline">{tier}</Badge>;
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600">Configure and manage subscription tiers</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setEditingPlan(null);
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTierIcon(plan.tier)}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                {getTierBadge(plan.tier)}
              </div>
              <div className="text-3xl font-bold">
                ₹{plan.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">/{plan.billing_cycle}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Features</h4>
                  <ul className="space-y-2">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-sm text-gray-500">
                        +{plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Products:</span>
                    <div className="font-medium">
                      {plan.max_products === -1 ? 'Unlimited' : plan.max_products.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Users:</span>
                    <div className="font-medium">
                      {plan.max_users === -1 ? 'Unlimited' : plan.max_users}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePlan(plan.id)}
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

      {/* Add/Edit Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
            <DialogDescription>
              Configure the subscription plan details and features.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Plan Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Basic Plan"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  placeholder="999"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Billing Cycle</label>
                <select
                  value={formData.billing_cycle}
                  onChange={(e) => setFormData(prev => ({ ...prev, billing_cycle: e.target.value as any }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Max Products</label>
                <Input
                  type="number"
                  value={formData.max_products}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_products: Number(e.target.value) }))}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Users</label>
                <Input
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_users: Number(e.target.value) }))}
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Features</label>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Enter feature description"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFeature(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addFeature}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Active Plan
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={saving || !formData.name}
            >
              {saving ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlans; 