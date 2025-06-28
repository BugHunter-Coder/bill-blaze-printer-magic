import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesReport } from './SalesReport';
import { ExpenseTracker } from './ExpenseTracker';
import { ProductManagement } from './ProductManagement';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shop, Transaction, Expense } from '@/types/pos';
import { useShop } from '@/hooks/useShop';

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
  const { selectedShop } = useShop();

  if (!selectedShop) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p className="text-sm text-gray-500">Please select a company from the header to access management features.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop Management</h2>
        <p className="text-gray-600">Manage {selectedShop.name}</p>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <SalesReport />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ExpenseTracker 
            transactions={transactions}
            onAddExpense={onAddExpense}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shop Settings</CardTitle>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
