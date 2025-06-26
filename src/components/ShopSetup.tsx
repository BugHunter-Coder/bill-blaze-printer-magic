
import ShopSetupStepper from './onboarding/ShopSetupStepper';

interface ShopSetupProps {
  onShopCreated: () => void;
}

const ShopSetup = ({ onShopCreated }: ShopSetupProps) => {
  return <ShopSetupStepper onShopCreated={onShopCreated} />;
};

export default ShopSetup;
