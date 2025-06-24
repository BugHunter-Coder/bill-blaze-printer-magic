
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, ArrowRight, Plus, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface InventorySetupPromptProps {
  onSetupComplete: () => void;
  onProceedAnyway: () => void;
}

export const InventorySetupPrompt = ({ onSetupComplete, onProceedAnyway }: InventorySetupPromptProps) => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);

  useEffect(() => {
    checkInventoryStatus();
  }, [profile]);

  const checkInventoryStatus = async () => {
    if (!profile?.shop_id) {
      setIsLoading(false);
      return;
    }

    try {
      // Check products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', profile.shop_id)
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Check categories count
      const { count: categoriesCount, error: categoriesError } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', profile.shop_id)
        .eq('is_active', true);

      if (categoriesError) throw categoriesError;

      setProductCount(productsCount || 0);
      setCategoryCount(categoriesCount || 0);
    } catch (error) {
      console.error('Error checking inventory status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If inventory is already set up, complete setup
  if (productCount > 0) {
    onSetupComplete();
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
            <Package className="h-8 w-8 mr-3 text-blue-600" />
            Inventory Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your POS system needs products and categories to function properly. 
              Let's set up your inventory before you start selling.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <Package className="h-5 w-5 mr-2 text-green-600" />
                Products
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Add your products with prices, stock levels, and details.
              </p>
              <p className="text-lg font-bold text-blue-600">
                {productCount} products
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <Package className="h-5 w-5 mr-2 text-purple-600" />
                Categories
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Organize your products into categories for easier management.
              </p>
              <p className="text-lg font-bold text-blue-600">
                {categoryCount} categories
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What you need to do:</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <span>Create product categories (e.g., Electronics, Clothing, Food)</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <span>Add your products with names, prices, and stock quantities</span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <span>Configure pricing and inventory settings</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onSetupComplete}
              className="flex-1 flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Set Up Inventory Now
            </Button>
            <Button 
              variant="outline" 
              onClick={onProceedAnyway}
              className="flex-1 flex items-center justify-center"
            >
              Skip Setup (Proceed Anyway)
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            You can always set up or modify your inventory later from the management panel.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
