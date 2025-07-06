import { useEffect } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import ShopDeactivated from '@/pages/ShopDeactivated';

interface ShopAccessGuardProps {
  children: React.ReactNode;
}

const ShopAccessGuard = ({ children }: ShopAccessGuardProps) => {
  const { user, profile, loading: authLoading } = useAuth();
  const { shops, loading: shopLoading, selectedShop } = useShop();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is a system admin (they should bypass shop access check)
  const isSystemAdmin = user?.email === 'admin@billblaze.com' || user?.email === 'harjot@iprofit.in';

  console.log('ShopAccessGuard:', { 
    selectedShop, 
    loading: shopLoading, 
    profile, 
    shops: shops.length,
    activeShops: shops.filter(s => s.is_active).length,
    pathname: location.pathname 
  });

  // Show loading while checking
  if (authLoading || shopLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-ping"></div>
          </div>
          <p className="text-gray-600 font-medium">Checking shop access...</p>
        </div>
      </div>
    );
  }

  // If user is system admin, allow access
  if (isSystemAdmin) {
    return <>{children}</>;
  }

  // If user is on shop setup page, allow access
  if (location.pathname === '/shop-setup') {
    return <>{children}</>;
  }

  // If user has no shops at all, redirect to shop setup
  if (user && shops.length === 0) {
    return <Navigate to="/shop-setup" replace />;
  }

  // If user has shops but none are active, show deactivated page
  if (user && shops.length > 0 && !shops.some(shop => shop.is_active)) {
    return <ShopDeactivated />;
  }

  // If user has active shops but none selected, let ShopSetupRedirect handle it
  if (user && shops.length > 0 && !selectedShop) {
    return <>{children}</>;
  }

  // If selected shop is not active, show deactivated page
  if (selectedShop && !selectedShop.is_active) {
    return <Navigate to="/shop-deactivated" replace />;
  }

  // If user has active shops, render children
  return <>{children}</>;
};

export default ShopAccessGuard; 