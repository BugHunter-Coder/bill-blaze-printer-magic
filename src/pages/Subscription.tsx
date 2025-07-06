import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Check, 
  Star, 
  Crown, 
  Zap, 
  Shield, 
  Users, 
  Database,
  Send,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  Smartphone,
  Globe,
  Cloud,
  Lock,
  Zap as ZapIcon,
  TrendingUp,
  Award,
  Headphones,
  Rocket,
  Target,
  BarChart3,
  Settings,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';

interface SubscriptionTier {
  id: 'basic' | 'premium' | 'enterprise';
  name: string;
  price: string;
  originalPrice?: string;
  features: string[];
  mobileFeatures: string[];
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
  bestValue?: boolean;
  discount?: string;
}

const subscriptionTiers: SubscriptionTier[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '₹999/month',
    originalPrice: '₹1,499',
    discount: '33% OFF',
    icon: <Star className="h-6 w-6" />,
    color: 'text-blue-600',
    features: [
      'Up to 100 products',
      'Basic POS features',
      'Email support',
      'Daily backups',
      'Mobile app access',
      'Basic analytics',
      'Single shop management',
      'Standard reporting'
    ],
    mobileFeatures: [
      'Mobile POS interface',
      'Offline mode support',
      'Touch-friendly design',
      'Quick product search',
      'Barcode scanning',
      'Mobile receipt printing'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₹1,999/month',
    originalPrice: '₹2,999',
    discount: '33% OFF',
    icon: <Crown className="h-6 w-6" />,
    color: 'text-purple-600',
    popular: true,
    bestValue: true,
    features: [
      'Up to 500 products',
      'Advanced POS features',
      'Priority support',
      'Real-time backups',
      'Advanced analytics',
      'Multi-user access',
      'Inventory management',
      'Customer management',
      'Bluetooth printer support',
      'Advanced reporting',
      'API access',
      'Custom integrations'
    ],
    mobileFeatures: [
      'All Basic mobile features',
      'Advanced mobile analytics',
      'Multi-device sync',
      'Offline inventory sync',
      'Mobile customer management',
      'Advanced mobile reporting',
      'Push notifications',
      'Mobile staff management'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹4,999/month',
    originalPrice: '₹7,999',
    discount: '37% OFF',
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
      'Dedicated account manager',
      'Custom development',
      'Advanced security features',
      'Compliance reporting',
      'Advanced automation'
    ],
    mobileFeatures: [
      'All Premium mobile features',
      'Custom mobile app branding',
      'Advanced mobile automation',
      'Multi-shop mobile management',
      'Enterprise mobile security',
      'Custom mobile integrations',
      'Mobile compliance features',
      'Advanced mobile analytics'
    ]
  }
];

export const Subscription = () => {
  const { user, profile } = useAuth();
  const { selectedShop } = useShop();
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | 'enterprise' | null>(null);
  const [applicationReason, setApplicationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('desktop');
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    checkExistingApplication();
  }, [selectedShop]);

  const checkExistingApplication = async () => {
    if (!selectedShop) return;

    try {
      const { data } = await supabase
        .from('subscription_applications')
        .select('*')
        .eq('shop_id', selectedShop.id)
        .eq('status', 'pending')
        .single();

      if (data) {
        setCurrentApplication(data);
      }
    } catch (error) {
      // No existing application
    }
  };

  const handleApply = async () => {
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
          application_reason: applicationReason,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Application Submitted Successfully! 🎉",
        description: `Your ${selectedTier} subscription application has been submitted. We'll review it and get back to you within 24-48 hours.`,
      });

      setDialogOpen(false);
      setSelectedTier(null);
      setApplicationReason('');
      await checkExistingApplication();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="text-xs"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Subscription Plans</h1>
                <p className="text-sm text-gray-600">Choose the perfect plan for your business</p>
              </div>
            </div>
            {selectedShop && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{selectedShop.name}</p>
                <p className="text-xs text-gray-600">Shop Owner</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Application Status */}
        {currentApplication && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Application Status:</strong> You have a {currentApplication.requested_tier} subscription application 
              {getStatusBadge(currentApplication.status)}. We'll notify you once it's reviewed.
            </AlertDescription>
          </Alert>
        )}

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Scale your business with our comprehensive POS solutions. All plans include our core features 
            with different levels of advanced functionality to match your business needs.
          </p>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Secure & Reliable</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Cloud className="h-4 w-4 text-blue-600" />
              <span>Cloud-Based</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Smartphone className="h-4 w-4 text-purple-600" />
              <span>Mobile Optimized</span>
            </div>
          </div>
        </div>

        {/* Platform Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="desktop" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Desktop</span>
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <span>Mobile</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Subscription Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {subscriptionTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${
                selectedTier === tier.id ? 'ring-2 ring-blue-500 shadow-xl' : ''
              } ${tier.popular ? 'border-purple-200' : ''} ${tier.bestValue ? 'border-2 border-green-300' : ''}`}
              onClick={() => setSelectedTier(tier.id)}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              {tier.bestValue && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-600 text-white px-3 py-1">
                    Best Value
                  </Badge>
                </div>
              )}
              {tier.discount && (
                <div className="absolute top-4 right-4">
                  <Badge variant="destructive" className="text-xs">
                    {tier.discount}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto mb-2 ${tier.color}`}>
                  {tier.icon}
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-gray-900">{tier.price}</div>
                  {tier.originalPrice && (
                    <div className="text-sm text-gray-500 line-through">{tier.originalPrice}</div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <TabsContent value="desktop" className="mt-0">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
                <TabsContent value="mobile" className="mt-0">
                  <ul className="space-y-3">
                    {tier.mobileFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                
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

        {/* Application Section */}
        {selectedTier && !currentApplication && (
          <Card className="border-blue-200 bg-blue-50 max-w-2xl mx-auto">
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

        {/* Features Comparison */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-center">What's Included in All Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm">Secure POS System</span>
              </div>
              <div className="flex items-center space-x-2">
                <Cloud className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Cloud Backup</span>
              </div>
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Mobile Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <Headphones className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Customer Support</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-center">Need Help Choosing?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Our team is here to help you choose the perfect plan for your business.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>Call Us</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email Us</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Live Chat</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription; 