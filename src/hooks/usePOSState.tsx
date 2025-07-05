import { useState, useEffect } from 'react';

const POS_STATE_KEY = 'pos_session_state';

interface POSState {
  printerConnected: boolean;
  checkoutModalOpen: boolean;
  mobileCartOpen: boolean;
  lastShopId?: string;
}

export function usePOSState(shopId?: string) {
  const [state, setState] = useState<POSState>({
    printerConnected: false,
    checkoutModalOpen: false,
    mobileCartOpen: false,
  });

  // Load state from localStorage on mount
  useEffect(() => {
    const storedState = localStorage.getItem(POS_STATE_KEY);
    if (storedState) {
      try {
        const parsedState = JSON.parse(storedState);
        // Only restore state if it's for the same shop
        if (parsedState.lastShopId === shopId) {
          setState(parsedState);
        } else {
          // Reset state for new shop
          setState({
            printerConnected: false,
            checkoutModalOpen: false,
            mobileCartOpen: false,
            lastShopId: shopId,
          });
        }
      } catch (error) {
        console.error('Error parsing stored POS state:', error);
        localStorage.removeItem(POS_STATE_KEY);
      }
    } else if (shopId) {
      // Initialize state for new shop
      setState({
        printerConnected: false,
        checkoutModalOpen: false,
        mobileCartOpen: false,
        lastShopId: shopId,
      });
    }
  }, [shopId]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (shopId) {
      const stateToSave = { ...state, lastShopId: shopId };
      localStorage.setItem(POS_STATE_KEY, JSON.stringify(stateToSave));
    }
  }, [state, shopId]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === POS_STATE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          // Only update if it's for the same shop and different from current state
          if (newState.lastShopId === shopId && JSON.stringify(newState) !== JSON.stringify(state)) {
            setState(newState);
          }
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [shopId, state]);

  const updateState = (updates: Partial<POSState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const setPrinterConnected = (connected: boolean) => {
    updateState({ printerConnected: connected });
  };

  const setCheckoutModalOpen = (open: boolean) => {
    updateState({ checkoutModalOpen: open });
  };

  const setMobileCartOpen = (open: boolean) => {
    updateState({ mobileCartOpen: open });
  };

  const resetState = () => {
    const resetState = {
      printerConnected: false,
      checkoutModalOpen: false,
      mobileCartOpen: false,
      lastShopId: shopId,
    };
    setState(resetState);
    localStorage.removeItem(POS_STATE_KEY);
  };

  return {
    printerConnected: state.printerConnected,
    checkoutModalOpen: state.checkoutModalOpen,
    mobileCartOpen: state.mobileCartOpen,
    setPrinterConnected,
    setCheckoutModalOpen,
    setMobileCartOpen,
    resetState,
  };
} 