
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesReport } from './SalesReport';
import { ExpenseTracker } from './ExpenseTracker';
import { ProductManagement } from './ProductManagement';
import { Shop, Transaction, Expense } from '@/types/pos';

interface ShopManagementProps {
  shopDetails: Shop;
  onShopUpdate: () => void;
  transactions: Transaction[];
  onAddExpense: (expense: Expense) => void;
}

export const ShopManagement = ({ 
  shopDetails, 
  onShopUpdate, 
  transactions, 
  onAddExpense 
}: ShopManagementProps) => {
  return (
    <div className="p-6">
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          <ProductManagement />
        </TabsContent>
        
        <TabsContent value="sales" className="mt-6">
          <SalesReport 
            shopDetails={shopDetails}
            transactions={transactions}
          />
        </TabsContent>
        
        <TabsContent value="expenses" className="mt-6">
          <ExpenseTracker 
            shopDetails={shopDetails}
            onAddExpense={onAddExpense}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
