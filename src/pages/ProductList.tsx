import React from 'react';
import { ProductManagement } from '@/components/ProductManagement';
import { useShop } from '@/hooks/useShop';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ProductListPage = () => {
  const { selectedShop } = useShop();
  const navigate = useNavigate();
  const subscription = selectedShop?.subscription;
  const showRestriction = subscription?.status !== 'active';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Restriction Banner */}
      {showRestriction && (
        <Alert className="mb-6 border-red-200 bg-red-50 flex items-center justify-between">
          <AlertDescription className="text-red-800">
            <b>Your shop does not have an active subscription.</b> Product management is restricted. <Button size="sm" className="ml-2" onClick={() => navigate('/subscription')}>Subscribe Now</Button>
          </AlertDescription>
        </Alert>
      )}
      <h1 className="text-2xl font-bold mb-6">Manage Products</h1>
      <ProductManagement />
    </div>
  );
};

export default ProductListPage; 