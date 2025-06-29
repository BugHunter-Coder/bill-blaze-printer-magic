import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { 
  Globe, 
  CreditCard, 
  Truck, 
  MessageSquare, 
  Mail, 
  Settings, 
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Key
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'payment' | 'shipping' | 'communication' | 'accounting' | 'marketing';
  enabled: boolean;
  api_key?: string;
  webhook_url?: string;
  settings?: Record<string, any>;
}

export const Integrations = () => {
  const { selectedShop } = useShop();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const { toast } = useToast();

  const [configData, setConfigData] = useState({
    api_key: '',
    webhook_url: '',
    merchant_id: '',
    secret_key: ''
  });

  useEffect(() => {
    if (selectedShop) {
      loadIntegrations();
    }
  }, [selectedShop]);

  const loadIntegrations = async () => {
    if (!selectedShop) return;

    try {
      setLoading(true);
      // Mock integrations data - in real app, this would come from database
      const mockIntegrations: Integration[] = [
        {
          id: '1',
          name: 'Razorpay',
          description: 'Accept online payments with Razorpay',
          icon: '💳',
          category: 'payment',
          enabled: false
        },
        {
          id: '2',
          name: 'PayPal',
          description: 'Global payment processing',
          icon: '🌐',
          category: 'payment',
          enabled: false
        },
        {
          id: '3',
          name: 'Shiprocket',
          description: 'Shipping and logistics integration',
          icon: '🚚',
          category: 'shipping',
          enabled: false
        },
        {
          id: '4',
          name: 'WhatsApp Business',
          description: 'Send order updates via WhatsApp',
          icon: '📱',
          category: 'communication',
          enabled: false
        },
        {
          id: '5',
          name: 'Gmail',
          description: 'Send email notifications',
          icon: '📧',
          category: 'communication',
          enabled: false
        },
        {
          id: '6',
          name: 'Tally',
          description: 'Accounting software integration',
          icon: '📊',
          category: 'accounting',
          enabled: false
        },
        {
          id: '7',
          name: 'Google Analytics',
          description: 'Track website and sales analytics',
          icon: '📈',
          category: 'marketing',
          enabled: false
        },
        {
          id: '8',
          name: 'Facebook Pixel',
          description: 'Track conversions and retarget customers',
          icon: '📱',
          category: 'marketing',
          enabled: false
        }
      ];

      setIntegrations(mockIntegrations);
    } catch (error) {
      console.error('Error loading integrations:', error);
      toast({
        title: "Error",
        description: "Failed to load integrations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIntegration = async (integration: Integration) => {
    try {
      const updatedIntegrations = integrations.map(integ => 
        integ.id === integration.id 
          ? { ...integ, enabled: !integ.enabled }
          : integ
      );
      
      setIntegrations(updatedIntegrations);

      if (!integration.enabled) {
        // Enable integration - show config dialog
        setSelectedIntegration(integration);
        setShowConfigDialog(true);
      } else {
        // Disable integration
        toast({
          title: "Success",
          description: `${integration.name} has been disabled.`,
        });
      }
    } catch (error) {
      console.error('Error toggling integration:', error);
      toast({
        title: "Error",
        description: "Failed to update integration status.",
        variant: "destructive",
      });
    }
  };

  const handleConfigureIntegration = async () => {
    if (!selectedIntegration) return;

    try {
      // Update integration with configuration
      const updatedIntegrations = integrations.map(integ => 
        integ.id === selectedIntegration.id 
          ? { 
              ...integ, 
              enabled: true,
              api_key: configData.api_key,
              webhook_url: configData.webhook_url,
              settings: {
                merchant_id: configData.merchant_id,
                secret_key: configData.secret_key
              }
            }
          : integ
      );
      
      setIntegrations(updatedIntegrations);
      setShowConfigDialog(false);
      setSelectedIntegration(null);
      setConfigData({ api_key: '', webhook_url: '', merchant_id: '', secret_key: '' });

      toast({
        title: "Success",
        description: `${selectedIntegration.name} has been configured and enabled.`,
      });
    } catch (error) {
      console.error('Error configuring integration:', error);
      toast({
        title: "Error",
        description: "Failed to configure integration.",
        variant: "destructive",
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'shipping': return <Truck className="h-4 w-4" />;
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      case 'accounting': return <Settings className="h-4 w-4" />;
      case 'marketing': return <Globe className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'payment': return 'bg-green-100 text-green-800';
      case 'shipping': return 'bg-blue-100 text-blue-800';
      case 'communication': return 'bg-purple-100 text-purple-800';
      case 'accounting': return 'bg-orange-100 text-orange-800';
      case 'marketing': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading integrations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
          <p className="text-gray-600">Connect third-party services to enhance your business</p>
        </div>
      </div>

      {/* Integration Categories */}
      {['payment', 'shipping', 'communication', 'accounting', 'marketing'].map(category => {
        const categoryIntegrations = integrations.filter(integ => integ.category === category);
        if (categoryIntegrations.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getCategoryIcon(category)}
                <span className="capitalize">{category} Integrations</span>
                <Badge variant="secondary" className="ml-2">
                  {categoryIntegrations.filter(integ => integ.enabled).length} Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryIntegrations.map((integration) => (
                  <div key={integration.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{integration.icon}</span>
                        <div>
                          <h3 className="font-medium">{integration.name}</h3>
                          <p className="text-sm text-gray-600">{integration.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={integration.enabled}
                        onCheckedChange={() => handleToggleIntegration(integration)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getCategoryColor(integration.category)}>
                        {integration.category}
                      </Badge>
                      
                      {integration.enabled && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Connected</span>
                        </div>
                      )}
                    </div>

                    {integration.enabled && integration.api_key && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Key className="h-3 w-3" />
                          <span>API Key: {integration.api_key.substring(0, 8)}...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Configuration Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key *</Label>
              <Input
                id="api_key"
                value={configData.api_key}
                onChange={(e) => setConfigData(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="Enter your API key"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="webhook_url">Webhook URL</Label>
              <Input
                id="webhook_url"
                value={configData.webhook_url}
                onChange={(e) => setConfigData(prev => ({ ...prev, webhook_url: e.target.value }))}
                placeholder="https://your-domain.com/webhook"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="merchant_id">Merchant ID</Label>
              <Input
                id="merchant_id"
                value={configData.merchant_id}
                onChange={(e) => setConfigData(prev => ({ ...prev, merchant_id: e.target.value }))}
                placeholder="Enter merchant ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secret_key">Secret Key</Label>
              <Input
                id="secret_key"
                type="password"
                value={configData.secret_key}
                onChange={(e) => setConfigData(prev => ({ ...prev, secret_key: e.target.value }))}
                placeholder="Enter secret key"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfigureIntegration}>
                Configure & Enable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Integration Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Payment Integrations</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Razorpay: Popular in India, supports UPI, cards, and wallets</li>
                <li>• PayPal: Global payment processing with buyer protection</li>
                <li>• Stripe: International payment processing</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Communication Integrations</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• WhatsApp Business: Send order updates and notifications</li>
                <li>• Gmail: Email receipts and order confirmations</li>
                <li>• SMS: Text message notifications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 