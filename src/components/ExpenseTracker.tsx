
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, DollarSign } from 'lucide-react';
import { Expense, Transaction } from '@/types/pos';

interface ExpenseTrackerProps {
  onAddExpense: (expense: Expense) => void;
  transactions: Transaction[];
}

export const ExpenseTracker = ({ onAddExpense, transactions }: ExpenseTrackerProps) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const { toast } = useToast();

  const expenseCategories = [
    'Utilities',
    'Rent',
    'Supplies',
    'Marketing',
    'Equipment',
    'Maintenance',
    'Staff',
    'Other'
  ];

  const handleAddExpense = () => {
    if (!description || !amount || !category) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const expense: Expense = {
      id: Date.now().toString(),
      shop_id: '',
      description,
      amount: parseFloat(amount),
      category,
      payment_method: 'cash',
      expense_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onAddExpense(expense);
    setDescription('');
    setAmount('');
    setCategory('');

    toast({
      title: "Expense added",
      description: "Your expense has been recorded successfully.",
    });
  };

  const todayExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.total_amount, 0);

  const monthlyExpenses = transactions
    .filter(t => {
      const transactionDate = new Date(t.created_at);
      const now = new Date();
      return t.type === 'expense' && 
        transactionDate.getMonth() === now.getMonth() && 
        transactionDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.total_amount, 0);

  const recentExpenses = transactions
    .filter(t => t.type === 'expense')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Expense Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Expenses</p>
                <p className="text-2xl font-bold text-red-600">${todayExpenses.toFixed(2)}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Expenses</p>
                <p className="text-2xl font-bold text-red-600">${monthlyExpenses.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Expense */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Expense</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter expense description"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddExpense} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => (
                <div key={expense.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{expense.notes || 'Expense'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(expense.created_at).toLocaleDateString()} • General
                    </p>
                  </div>
                  <Badge variant="destructive">
                    -${expense.total_amount.toFixed(2)}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No expenses recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
