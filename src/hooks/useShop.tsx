import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Shop = Database['public']['Tables']['shops']['Row'];

interface ShopContextType {
  shops: Shop[];
  selectedShop: Shop | null;
  selectedShopId: string | null;
  loading: boolean;
  setSelectedShopId: (shopId: string) => void;
  refreshShops: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
  const { profile } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserShops = async () => {
    try {
      setLoading(true);
      if (!profile) return;

      let shopsQuery = supabase
        .from('shops')
        .select('*')
        .order('name');

      // If user has a specific shop_id, fetch that shop and any shops they own
      if (profile.shop_id) {
        shopsQuery = shopsQuery.or(`id.eq.${profile.shop_id},owner_id.eq.${profile.id}`);
      } else {
        // If no shop_id, fetch shops they own
        shopsQuery = shopsQuery.eq('owner_id', profile.id);
      }

      const { data: userShops, error } = await shopsQuery;

      if (error) {
        console.error('Error fetching shops:', error);
        return;
      }

      setShops(userShops || []);

      // Set default selected shop if none is selected
      if (userShops && userShops.length > 0 && !selectedShopId) {
        const defaultShop = userShops.find(s => s.id === profile.shop_id) || userShops[0];
        setSelectedShopId(defaultShop.id);
        setSelectedShop(defaultShop);
      }
    } catch (err) {
      console.error('Error fetching user shops:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetSelectedShopId = (shopId: string) => {
    setSelectedShopId(shopId);
    const shop = shops.find(s => s.id === shopId);
    setSelectedShop(shop || null);
  };

  const refreshShops = async () => {
    await fetchUserShops();
  };

  useEffect(() => {
    fetchUserShops();
  }, [profile]);

  useEffect(() => {
    if (selectedShopId && shops.length > 0) {
      const shop = shops.find(s => s.id === selectedShopId);
      setSelectedShop(shop || null);
    }
  }, [selectedShopId, shops]);

  const value = {
    shops,
    selectedShop,
    selectedShopId,
    loading,
    setSelectedShopId: handleSetSelectedShopId,
    refreshShops,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}; 