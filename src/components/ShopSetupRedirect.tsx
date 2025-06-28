import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, Plus, ArrowRight } from 'lucide-react';
import ShopSetupModal from './ShopSetupModal';

interface ShopSetupRedirectProps {
  children: React.ReactNode;
}

export const ShopSetupRedirect = ({ children }: ShopSetupRedirectProps) => {
  const { user, profile, loading: authLoading } = useAuth();
  const { shops, loading: shopsLoading, refreshShops } = useShop();
  const [showSetup, setShowSetup] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only check after both auth and shops have loaded
    if (!authLoading && !shopsLoading && user && profile) {
      // If user has no shops, show setup screen
      if (shops.length === 0) {
        setShowSetup(true);
      } else {
        setShowSetup(false);
      }
    }
  }, [authLoading, shopsLoading, user, profile, shops.length]);

  const handleShopCreated = async () => {
    // Refresh shops after creation
    await refreshShops();
    setShowSetup(false);
  };

  // Show loading while checking
  if (authLoading || shopsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user needs to set up their first shop, show setup screen
  if (showSetup) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Store className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome to BillBlaze!
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Let's set up your first shop to get started
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-6">
                  You'll need to create your first shop to start using the POS system.
                </p>
              </div>
              
              <Button 
                onClick={() => setShowModal(true)} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Set Up Your First Shop
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  You can manage multiple shops later from the dashboard
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <ShopSetupModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onShopCreated={handleShopCreated}
        />
      </>
    );
  }

  // If user has shops, render the normal content
  return <>{children}</>;
}; 