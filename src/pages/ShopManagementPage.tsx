import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { supabase } from '@/integrations/supabase/client';
import { ShopManagement } from '@/components/ShopManagement';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Transaction, Expense } from '@/types/pos';

export const ShopManagementPage = () => {
  const { user, loading } = useAuth();
  const { selectedShop, loading: shopLoading } = useShop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Get default tab from URL params
  const defaultTab = searchParams.get('tab') || 'products';

  useEffect(() => {
    if (selectedShop?.id) {
      fetchTransactions();
    }
  }, [selectedShop?.id]);

  const fetchTransactions = async () => {
    if (!selectedShop?.id) return;

    try {
      setLoadingTransactions(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', selectedShop.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleShopUpdate = () => {
    // Refresh data when shop is updated
    fetchTransactions();
  };

  const handleAddExpense = async (expense: Expense) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          ...expense,
          shop_id: selectedShop?.id,
        });

      if (error) throw error;

      // Refresh transactions to include the new expense
      fetchTransactions();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  if (loading || shopLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Please log in to access shop management</p>
          <Button onClick={() => navigate('/auth')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (!selectedShop) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-2">No company selected</p>
          <p className="text-sm text-gray-500 mb-4">Please select a company from the header to access shop management.</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/pos')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to POS</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shop Management</h1>
              <p className="text-gray-600">Manage {selectedShop.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-80px)]">
        <ShopManagement
          onShopUpdate={handleShopUpdate}
          transactions={transactions}
          onAddExpense={handleAddExpense}
          defaultTab={defaultTab}
        />
      </div>
    </div>
  );
};

export default ShopManagementPage;
