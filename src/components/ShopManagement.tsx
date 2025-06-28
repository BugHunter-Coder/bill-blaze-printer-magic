import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { SalesReport } from './SalesReport';
import { ExpenseTracker } from './ExpenseTracker';
import { ProductManagement } from './ProductManagement';
import { VariantOptionsManager } from './VariantOptionsManager';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shop, Transaction, Expense } from '@/types/pos';
import { useShop } from '@/hooks/useShop';
import { Trash2, AlertTriangle } from 'lucide-react';

interface ShopManagementProps {
  onShopUpdate: () => void;
  transactions: Transaction[];
  onAddExpense: (expense: Expense) => void;
  defaultTab?: string;
}

export const ShopManagement = ({
  onShopUpdate,
  transactions,
  onAddExpense,
  defaultTab = 'products'
}: ShopManagementProps) => {
  const { selectedShop, selectedShopId } = useShop();
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedShopId) {
      fetchProductCount();
    }
  }, [selectedShopId]);

  const fetchProductCount = async () => {
    if (!selectedShopId) return;
    
    try {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('shop_id', selectedShopId);

      if (error) throw error;
      setProductCount(count || 0);
    } catch (error) {
      console.error('Error fetching product count:', error);
    }
  };

  const handleClearAllProducts = async () => {
    if (!selectedShopId) return;

    try {
      setLoading(true);
      
      // First, get all product IDs for this shop
      const { data: productIds, error: fetchError } = await supabase
        .from('products')
        .select('id')
        .eq('shop_id', selectedShopId);

      if (fetchError) throw fetchError;

      // Delete all products for this shop
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('shop_id', selectedShopId);

      if (error) throw error;

      // Also delete all product variants for these products
      if (productIds && productIds.length > 0) {
        const productIdArray = productIds.map(p => p.id);
        const { error: variantsError } = await supabase
          .from('product_variants')
          .delete()
          .in('product_id', productIdArray);

        if (variantsError) {
          console.error('Error deleting variants:', variantsError);
          // Continue even if variants deletion fails
        }
      }

      setProductCount(0);
      toast({
        title: "Success",
        description: `All ${productCount} products have been cleared successfully.`,
      });

      // Trigger a refresh of the product management component
      onShopUpdate();
    } catch (error) {
      console.error('Error clearing products:', error);
      toast({
        title: "Error",
        description: "Failed to clear products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedShop) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p className="text-sm text-gray-500">Please select a company from the header to access management features.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop Management</h2>
        <p className="text-gray-600">Manage {selectedShop.name}</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4 h-full">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="variants" className="space-y-4 h-full">
          <VariantOptionsManager />
        </TabsContent>

        <TabsContent value="sales" className="space-y-4 h-full">
          <SalesReport />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4 h-full">
          <ExpenseTracker 
            transactions={transactions}
            onAddExpense={onAddExpense}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 h-full">
          {/* Shop Information */}
          <Card>
            <CardHeader>
              <CardTitle>Shop Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  value={selectedShop.name}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="shopAddress">Address</Label>
                <Input
                  id="shopAddress"
                  value={selectedShop.address || ''}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="shopPhone">Phone</Label>
                <Input
                  id="shopPhone"
                  value={selectedShop.phone || ''}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="shopEmail">Email</Label>
                <Input
                  id="shopEmail"
                  value={selectedShop.email || ''}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  value={((selectedShop.tax_rate || 0) * 100).toFixed(2)}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200">
                <div>
                  <h3 className="font-semibold text-red-800">Clear All Products</h3>
                  <p className="text-sm text-red-600 mt-1">
                    This will permanently delete all {productCount} products and their variants from your shop.
                    This action cannot be undone.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      disabled={productCount === 0 || loading}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      {loading ? 'Clearing...' : 'Clear All Products'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Clear All Products
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you absolutely sure you want to delete all {productCount} products from "{selectedShop.name}"? 
                        This action will also remove all product variants and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleClearAllProducts}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Yes, Clear All Products
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
