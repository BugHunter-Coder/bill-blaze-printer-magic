
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Store, Save, TrendingUp, TrendingDown } from 'lucide-react';
import { Shop, Expense, Transaction } from '@/types/pos';

interface ShopManagementProps {
  shopDetails: Shop;
  onShopUpdate: () => Promise<void>;
  transactions: Transaction[];
  onAddExpense: (expense: Expense) => Promise<void>;
}

export const ShopManagement = ({ shopDetails, onShopUpdate, transactions, onAddExpense }: ShopManagementProps) => {
  const [shopData, setShopData] = useState<Shop>(shopDetails);
  const { toast } = useToast();

  const handleSaveShopDetails = () => {
    onShopUpdate();
    toast({
      title: "Shop details saved",
      description: "Your shop information has been updated successfully.",
    });
  };

  useEffect(() => {
    setShopData(shopDetails);
  }, [shopDetails]);

  const todayTransactions = transactions.filter(t => 
    new Date(t.created_at).toDateString() === new Date().toDateString()
  );

  const todaySales = todayTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const todayExpenses = todayTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const todayProfit = todaySales - todayExpenses;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Store className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Shop Management</h1>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-green-600">${todaySales.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Expenses</p>
                <p className="text-2xl font-bold text-red-600">${todayExpenses.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Profit</p>
                <p className={`text-2xl font-bold ${todayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${todayProfit.toFixed(2)}
                </p>
              </div>
              <Badge variant={todayProfit >= 0 ? "default" : "destructive"}>
                {todayProfit >= 0 ? "Profit" : "Loss"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shop Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={shopData.name}
                onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={shopData.phone || ''}
                onChange={(e) => setShopData({ ...shopData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={shopData.email || ''}
                onChange={(e) => setShopData({ ...shopData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={shopData.tax_id || ''}
                onChange={(e) => setShopData({ ...shopData, tax_id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={shopData.currency}
                onChange={(e) => setShopData({ ...shopData, currency: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="taxRate">Tax Rate (%)}</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={shopData.tax_rate * 100}
                onChange={(e) => setShopData({ ...shopData, tax_rate: parseFloat(e.target.value) / 100 })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={shopData.address || ''}
              onChange={(e) => setShopData({ ...shopData, address: e.target.value })}
            />
          </div>
          <Button onClick={handleSaveShopDetails} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Save Shop Details
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
