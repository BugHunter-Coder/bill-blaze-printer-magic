
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesReport } from './SalesReport';
import { ExpenseTracker } from './ExpenseTracker';
import { ProductManagement } from './ProductManagement';
import { AIInventoryAssistant } from './inventory/AIInventoryAssistant';
import { Shop, Transaction, Expense } from '@/types/pos';
import { Brain } from 'lucide-react';

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="ai-assistant">
            <Brain className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          <ProductManagement />
        </TabsContent>
        
        <TabsContent value="ai-assistant" className="mt-6">
          <AIInventoryAssistant 
            shopData={shopDetails}
            products={[]} // You'll need to pass actual products data
            transactions={transactions}
          />
        </TabsContent>
        
        <TabsContent value="sales" className="mt-6">
          <SalesReport 
            transactions={transactions}
          />
        </TabsContent>
        
        <TabsContent value="expenses" className="mt-6">
          <ExpenseTracker 
            transactions={transactions}
            onAddExpense={onAddExpense}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
