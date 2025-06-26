
import { useAuth } from '@/hooks/useAuth';
import ShopSetupStepper from './onboarding/ShopSetupStepper';

interface ShopSetupProps {
  onShopCreated: () => void;
}

const ShopSetup = ({ onShopCreated }: ShopSetupProps) => {
  const { user, profile } = useAuth();

  // Show the stepper form if user doesn't have a shop
  if (user && (!profile?.shop_id)) {
    return <ShopSetupStepper onShopCreated={onShopCreated} />;
  }

  // If user already has a shop, redirect them or show a message
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Shop Already Created</h2>
        <p className="text-gray-600">You already have a shop set up. You can manage it from the dashboard.</p>
      </div>
    </div>
  );
};

export default ShopSetup;
