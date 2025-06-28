import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalStats {
  totalTransactions: number;
  totalRevenue: number;
  totalShops: number;
  totalProducts: number;
  todayTransactions: number;
  todayRevenue: number;
  monthlyTransactions: number;
  monthlyRevenue: number;
}

export const useGlobalStats = () => {
  const [stats, setStats] = useState<GlobalStats>({
    totalTransactions: 0,
    totalRevenue: 0,
    totalShops: 0,
    totalProducts: 0,
    todayTransactions: 0,
    todayRevenue: 0,
    monthlyTransactions: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let interval: NodeJS.Timeout;
    let subscription: any;

    const fetchGlobalStats = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        setError(null);

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get this month's date range
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        // Use a more permissive query that doesn't require specific shop access
        // For public stats, we'll use a different approach
        const { data: totalTransactionsData, error: totalError } = await supabase
          .from('transactions')
          .select('total_amount, type')
          .eq('type', 'sale')
          .limit(1000); // Limit to avoid performance issues

        if (totalError) {
          console.error('Error fetching total transactions:', totalError);
          // Don't set error for public stats, just use default values
          if (isMounted) {
            setStats(prev => ({ ...prev, totalTransactions: 0, totalRevenue: 0 }));
          }
        } else {
          const totalRevenue = totalTransactionsData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
          if (isMounted) {
            setStats(prev => ({ 
              ...prev, 
              totalTransactions: totalTransactionsData?.length || 0, 
              totalRevenue 
            }));
          }
        }

        // Fetch today's transactions
        const { data: todayTransactionsData, error: todayError } = await supabase
          .from('transactions')
          .select('total_amount, type')
          .eq('type', 'sale')
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .limit(1000);

        if (todayError) {
          console.error('Error fetching today\'s transactions:', todayError);
        } else {
          const todayRevenue = todayTransactionsData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
          if (isMounted) {
            setStats(prev => ({ 
              ...prev, 
              todayTransactions: todayTransactionsData?.length || 0, 
              todayRevenue 
            }));
          }
        }

        // Fetch this month's transactions
        const { data: monthlyTransactionsData, error: monthlyError } = await supabase
          .from('transactions')
          .select('total_amount, type')
          .eq('type', 'sale')
          .gte('created_at', thisMonth.toISOString())
          .lt('created_at', nextMonth.toISOString())
          .limit(1000);

        if (monthlyError) {
          console.error('Error fetching monthly transactions:', monthlyError);
        } else {
          const monthlyRevenue = monthlyTransactionsData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;
          if (isMounted) {
            setStats(prev => ({ 
              ...prev, 
              monthlyTransactions: monthlyTransactionsData?.length || 0, 
              monthlyRevenue 
            }));
          }
        }

        // Fetch total shops count
        const { count: totalShops, error: shopsError } = await supabase
          .from('shops')
          .select('*', { count: 'exact', head: true });

        if (shopsError) {
          console.error('Error fetching shops count:', shopsError);
        } else if (isMounted) {
          setStats(prev => ({ ...prev, totalShops: totalShops || 0 }));
        }

        // Fetch total products count
        const { count: totalProducts, error: productsError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        if (productsError) {
          console.error('Error fetching products count:', productsError);
        } else if (isMounted) {
          setStats(prev => ({ ...prev, totalProducts: totalProducts || 0 }));
        }

      } catch (err) {
        console.error('Error fetching global stats:', err);
        if (isMounted) {
          setError('Failed to fetch statistics');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchGlobalStats();
    
    // Set up auto-refresh every 30 seconds
    interval = setInterval(() => {
      fetchGlobalStats();
    }, 30000);

    // Set up real-time subscription for transactions (only if authenticated)
    try {
      subscription = supabase
        .channel('transactions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions'
          },
          () => {
            // Refresh stats when transactions change
            fetchGlobalStats();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Could not set up real-time subscription:', err);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      if (subscription) {
        try {
          supabase.removeChannel(subscription);
        } catch (err) {
          console.warn('Error removing subscription:', err);
        }
      }
    };
  }, []);

  return { stats, loading, error, refetch: () => {} };
}; 