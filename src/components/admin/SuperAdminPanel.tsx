import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Store, Users, Settings, AlertCircle, Brain, CreditCard, Receipt, FileText } from 'lucide-react';
import { Shop, UserProfile } from '@/types/pos';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AISettings } from './AISettings';
import { SubscriptionManager } from './SubscriptionManager';
import { TransactionManager } from './TransactionManager';
import { SubscriptionApplicationReview } from './SubscriptionApplicationReview';
import { useNavigate } from 'react-router-dom';

interface SuperAdminPanelProps {
  shops: Shop[];
  shopUsers: { [key: string]: UserProfile[] };
  onToggleShopStatus: (shopId: string, currentStatus: boolean) => void;
  onRefreshShops: () => void;
  loadingShops: boolean;
}

export const SuperAdminPanel = ({ 
  shops, 
  shopUsers, 
  onToggleShopStatus, 
  onRefreshShops, 
  loadingShops 
}: SuperAdminPanelProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const deleteShop = async (shopId: string) => {
    if (!confirm('Are you sure you want to delete this shop? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', shopId);

      if (error) throw error;

      await onRefreshShops();
      toast({
        title: "Success",
        description: "Shop deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting shop:', error);
      toast({
        title: "Error",
        description: "Failed to delete shop.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="shops" className="w-full">
        <TabsList className="grid w-full grid-cols-5 overflow-x-auto">
          <TabsTrigger value="shops" className="text-xs sm:text-sm">Shop Management</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm">
            <Receipt className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-xs sm:text-sm">
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="applications" className="text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Applications
          </TabsTrigger>
          <TabsTrigger value="ai-settings" className="text-xs sm:text-sm">
            <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            AI Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shops" className="mt-4 sm:mt-6">
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Shop Management</h2>
              <Button onClick={onRefreshShops} variant="outline" disabled={loadingShops} className="w-full sm:w-auto">
                {loadingShops ? 'Loading...' : 'Refresh Shops'}
              </Button>
            </div>
            
            {loadingShops ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm sm:text-base">Loading shops...</span>
              </div>
            ) : shops.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {shops.map((shop) => (
                  <Card key={shop.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 sm:pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base sm:text-lg flex items-center">
                          <Store className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                          <span className="truncate">{shop.name}</span>
                        </CardTitle>
                        <Badge variant={shop.is_active ? "default" : "secondary"} className="text-xs">
                          {shop.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3">
                      <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                        <p className="truncate"><strong>Address:</strong> {shop.address || 'Not provided'}</p>
                        <p className="truncate"><strong>Phone:</strong> {shop.phone || 'Not provided'}</p>
                        <p className="truncate"><strong>Email:</strong> {shop.email || 'Not provided'}</p>
                        <p><strong>Tax Rate:</strong> {((shop.tax_rate || 0) * 100).toFixed(2)}%</p>
                        <p className="truncate"><strong>Owner ID:</strong> {shop.owner_id || 'Not assigned'}</p>
                      </div>
                      
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>{shopUsers[shop.id]?.length || 0} users</span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleShopStatus(shop.id, shop.is_active || false)}
                          className="flex-1 sm:flex-none text-xs"
                        >
                          {shop.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteShop(shop.id)}
                          className="flex-1 sm:flex-none text-xs"
                        >
                          Delete
                        </Button>
                      </div>

                      <div className="text-xs text-gray-500">
                        Created: {new Date(shop.created_at || '').toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Store className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                <h3 className="mt-2 text-sm sm:text-base font-medium text-gray-900">No shops found</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  No shops have been created yet or there may be permission issues.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-4 sm:mt-6">
          <TransactionManager shops={shops} />
        </TabsContent>
        
        <TabsContent value="subscriptions" className="mt-4 sm:mt-6">
          <SubscriptionManager shops={shops} />
        </TabsContent>
        
        <TabsContent value="applications" className="mt-4 sm:mt-6">
          <SubscriptionApplicationReview />
        </TabsContent>
        
        <TabsContent value="ai-settings" className="mt-4 sm:mt-6">
          <AISettings />
        </TabsContent>
      </Tabs>
      <button
        className="w-full text-left px-4 py-2 rounded hover:bg-blue-50 font-medium text-blue-700"
        onClick={() => navigate('/admin/shop-roles')}
      >
        🛡️ Roles & Permissions
      </button>
    </div>
  );
};
