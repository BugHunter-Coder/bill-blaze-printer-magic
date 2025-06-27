
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ShopSetupStepper from './onboarding/ShopSetupStepper';

interface ShopSetupProps {
  onShopCreated: () => void;
}

const ShopSetup = ({ onShopCreated }: ShopSetupProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleShopCreated = () => {
    onShopCreated();
    // Navigation will be handled by ShopSetupStepper
  };

  // Show the stepper form if user doesn't have a shop
  if (user && (!profile?.shop_id)) {
    return <ShopSetupStepper onShopCreated={handleShopCreated} />;
  }

  // If user already has a shop, redirect them to POS
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Shop Already Created</h2>
        <p className="text-gray-600 mb-6">You already have a shop set up. You can manage it from the dashboard or go directly to your POS system.</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/pos')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to POS System
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopSetup;
