
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Store, Users, Settings, AlertCircle, Brain, CreditCard } from 'lucide-react';
import { Shop, UserProfile } from '@/types/pos';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AISettings } from './AISettings';
import { SubscriptionManager } from './SubscriptionManager';

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
    <div className="space-y-6">
      <Tabs defaultValue="shops" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shops">Shop Management</TabsTrigger>
          <TabsTrigger value="subscriptions">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="ai-settings">
            <Brain className="h-4 w-4 mr-2" />
            AI Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="shops" className="mt-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Shop Management</h2>
              <Button onClick={onRefreshShops} variant="outline" disabled={loadingShops}>
                {loadingShops ? 'Loading...' : 'Refresh Shops'}
              </Button>
            </div>
            
            {loadingShops ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading shops...</span>
              </div>
            ) : shops.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {shops.map((shop) => (
                  <Card key={shop.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center">
                          <Store className="h-5 w-5 mr-2 text-blue-600" />
                          {shop.name}
                        </CardTitle>
                        <Badge variant={shop.is_active ? "default" : "secondary"}>
                          {shop.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <p><strong>Address:</strong> {shop.address || 'Not provided'}</p>
                        <p><strong>Phone:</strong> {shop.phone || 'Not provided'}</p>
                        <p><strong>Email:</strong> {shop.email || 'Not provided'}</p>
                        <p><strong>Tax Rate:</strong> {((shop.tax_rate || 0) * 100).toFixed(2)}%</p>
                        <p><strong>Owner ID:</strong> {shop.owner_id || 'Not assigned'}</p>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{shopUsers[shop.id]?.length || 0} users</span>
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleShopStatus(shop.id, shop.is_active || false)}
                        >
                          {shop.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteShop(shop.id)}
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
              <div className="text-center py-12">
                <Store className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No shops found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No shops have been created yet or there may be permission issues.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionManager shops={shops} />
        </TabsContent>
        
        <TabsContent value="ai-settings" className="mt-6">
          <AISettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
