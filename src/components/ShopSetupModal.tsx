import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Store, MapPin, Phone, Mail, CreditCard, CheckCircle } from 'lucide-react';
import { CURRENCIES } from '@/types/pos';
import { toast } from 'sonner';

interface ShopSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShopCreated: () => void;
}

const ShopSetupModal = ({ isOpen, onClose, onShopCreated }: ShopSetupModalProps) => {
  const { user, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [shopData, setShopData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    tax_id: '',
    currency: 'INR',
    tax_rate: 0.18,
  });

  const steps = [
    { id: 1, title: 'Basic Info', icon: Store, description: 'Shop name and basic details' },
    { id: 2, title: 'Location', icon: MapPin, description: 'Address and contact information' },
    { id: 3, title: 'Financial', icon: CreditCard, description: 'Tax and currency settings' },
    { id: 4, title: 'Complete', icon: CheckCircle, description: 'Review and finish setup' },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Create the shop
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          owner_id: user.id,
          ...shopData,
        })
        .select()
        .single();

      if (shopError) throw shopError;

      // Update the user's profile with the shop_id and admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          shop_id: shop.id, 
          role: 'admin' 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Shop created successfully!');
      await refreshProfile();
      onShopCreated();
      onClose();
      
      // Reset form
      setCurrentStep(1);
      setShopData({
        name: '',
        address: '',
        phone: '',
        email: '',
        tax_id: '',
        currency: 'INR',
        tax_rate: 0.18,
      });
    } catch (error: any) {
      console.error('Error creating shop:', error);
      toast.error(error.message || 'Failed to create shop');
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return shopData.name.trim() !== '';
      case 2:
        return true; // Optional fields
      case 3:
        return shopData.currency !== '' && shopData.tax_rate >= 0;
      case 4:
        return shopData.name.trim() !== '';
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-name">Shop Name *</Label>
              <Input
                id="shop-name"
                placeholder="Enter your shop name"
                value={shopData.name}
                onChange={(e) => setShopData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-email">Shop Email</Label>
              <Input
                id="shop-email"
                type="email"
                placeholder="shop@example.com"
                value={shopData.email}
                onChange={(e) => setShopData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-address">Shop Address</Label>
              <Textarea
                id="shop-address"
                placeholder="Enter your shop's full address"
                value={shopData.address}
                onChange={(e) => setShopData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-phone">Phone Number</Label>
              <Input
                id="shop-phone"
                placeholder="+1 (555) 123-4567"
                value={shopData.phone}
                onChange={(e) => setShopData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shop-currency">Currency</Label>
              <Select
                value={shopData.currency}
                onValueChange={(value) => setShopData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-tax-rate">Tax Rate (%)</Label>
              <Input
                id="shop-tax-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="8.00"
                value={shopData.tax_rate * 100}
                onChange={(e) => setShopData(prev => ({ 
                  ...prev, 
                  tax_rate: parseFloat(e.target.value) / 100 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-tax-id">Tax ID (Optional)</Label>
              <Input
                id="shop-tax-id"
                placeholder="Enter tax identification number"
                value={shopData.tax_id}
                onChange={(e) => setShopData(prev => ({ ...prev, tax_id: e.target.value }))}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Review Your Shop Details</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div><strong>Shop Name:</strong> {shopData.name}</div>
              {shopData.address && <div><strong>Address:</strong> {shopData.address}</div>}
              {shopData.phone && <div><strong>Phone:</strong> {shopData.phone}</div>}
              {shopData.email && <div><strong>Email:</strong> {shopData.email}</div>}
              <div><strong>Currency:</strong> {shopData.currency}</div>
              <div><strong>Tax Rate:</strong> {(shopData.tax_rate * 100).toFixed(2)}%</div>
              {shopData.tax_id && <div><strong>Tax ID:</strong> {shopData.tax_id}</div>}
            </div>
            <div className="text-sm text-gray-600 text-center">
              You'll be set as the shop admin and can manage all settings after creation.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Store className="h-12 w-12 text-blue-600" />
          </div>
          <DialogTitle className="text-2xl font-bold">Setup Your Shop</DialogTitle>
          <DialogDescription>
            Let's get your shop configured in just a few simple steps
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= step.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className={`text-xs font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden sm:block w-8 h-px mx-2 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Badge variant="outline" className="mr-2">
              Step {currentStep} of 4
            </Badge>
            <h3 className="text-lg font-semibold">
              {steps[currentStep - 1]?.title}
            </h3>
          </div>
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isStepValid()}
            >
              {isLoading ? 'Creating Shop...' : 'Create Shop'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopSetupModal; 