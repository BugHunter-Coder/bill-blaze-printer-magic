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
  refreshShopAccess: () => Promise<void>;
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
      if (!profile) {
        console.log('No profile available, skipping shop fetch');
        setShops([]);
        setSelectedShop(null);
        setSelectedShopId(null);
        return;
      }

      console.log('Fetching shops for profile:', profile);

      // Build or filter parts - include shops where user is owner OR where user's profile shop_id matches
      const orParts = [`owner_id.eq.${profile.id}`];
      if (profile.shop_id) {
        orParts.push(`id.eq.${profile.shop_id}`);
      }
      const orString = orParts.join(',');

      // Fetch only shops the user owns or is assigned to
      const { data: userShops, error } = await supabase
        .from('shops')
        .select('*')
        .or(orString)
        .order('name');

      console.log('Fetched shops:', userShops, 'Profile shop_id:', profile.shop_id, 'Error:', error);

      if (error) {
        console.error('Error fetching shops:', error);
        setShops([]);
        setSelectedShop(null);
        setSelectedShopId(null);
        return;
      }

      setShops(userShops || []);

      // Set default selected shop if none is selected
      if (userShops && userShops.length > 0 && !selectedShopId) {
        // First try to find shop that matches profile.shop_id
        let defaultShop = userShops.find(s => s.id === profile.shop_id);
        // If no match, use the first active shop
        if (!defaultShop) {
          defaultShop = userShops.find(s => s.is_active) || userShops[0];
        }
        setSelectedShopId(defaultShop.id);
        setSelectedShop(defaultShop);
        console.log('Set default shop:', defaultShop);
      } else if (!userShops || userShops.length === 0) {
        setSelectedShopId(null);
        setSelectedShop(null);
        console.log('No shops found, cleared selection');
      }
    } catch (err) {
      console.error('Error fetching user shops:', err);
      setShops([]);
      setSelectedShop(null);
      setSelectedShopId(null);
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

  const refreshShopAccess = async () => {
    await fetchUserShops();
    
    // If we have shops but no selected shop, try to select an active one
    if (shops.length > 0 && !selectedShop) {
      const activeShop = shops.find(s => s.is_active);
      if (activeShop) {
        setSelectedShopId(activeShop.id);
        setSelectedShop(activeShop);
        console.log('Auto-selected active shop:', activeShop);
      }
    }
  };

  useEffect(() => {
    fetchUserShops();
  }, [profile]);

  const value = {
    shops,
    selectedShop,
    selectedShopId,
    loading,
    setSelectedShopId: handleSetSelectedShopId,
    refreshShops,
    refreshShopAccess,
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