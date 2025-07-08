import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ShopProvider } from "@/hooks/useShop";
import { Layout } from "@/components/Layout";
import { ShopSetupRedirect } from "@/components/ShopSetupRedirect";
import ShopAccessGuard from "@/components/ShopAccessGuard";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import POS from "./pages/POS";
import AddProduct from "./pages/AddProduct";
import NotFound from "./pages/NotFound";
import ShopManagementPage from "./pages/ShopManagementPage";
import Analytics from "./pages/Analytics";
import ShopDeactivated from "./pages/ShopDeactivated";
import Subscription from "./pages/Subscription";
import ShopSetup from "./pages/ShopSetup";
import { CategoryManagement } from "@/components/CategoryManagement";
import AdminLayout from "@/components/AdminLayout";
import { ProfileDebug } from "@/components/debug/ProfileDebug";
import InventoryPage from './pages/inventory';

// Admin page imports
import ShopManagement from "./pages/admin/ShopManagement";
import ShopAnalytics from "./pages/admin/ShopAnalytics";
import ShopApprovals from "./pages/admin/ShopApprovals";
import UserRoles from "./pages/admin/UserRoles";
import UserActivity from "./pages/admin/UserActivity";
import BillingManagement from "./pages/admin/BillingManagement";
import SubscriptionPlans from "./pages/admin/SubscriptionPlans";
import SystemOverview from "./pages/admin/SystemOverview";
import GeneralSettings from "./pages/admin/GeneralSettings";
import SystemHealth from "./pages/admin/SystemHealth";
import SystemPerformance from "./pages/admin/SystemPerformance";
import SupportCenter from "./pages/admin/SupportCenter";
import ShopRoles from './pages/admin/ShopRoles';

// Transaction page imports
import TransactionHistoryPage from './pages/transactions/history';
import TransactionRefundsPage from './pages/transactions/refunds';
import TransactionPaymentsPage from './pages/transactions/payments';

import AuthCallback from '@/components/auth/AuthCallback';
import CustomerListPage from './pages/customers/list';
import CustomerAnalyticsPage from './pages/customers/analytics';
import LoyaltyProgramStartPage from './pages/customers/loyalty';

const queryClient = new QueryClient();

function ProtectedRoute({ children }) {
  const { profile } = useAuth();
  if (profile?.role === 'cashier') {
    return <Navigate to="/pos" replace />;
  }
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ShopProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/shop-deactivated" element={<ShopDeactivated />} />
              <Route 
                path="/shop-setup" 
                element={
                  <ShopAccessGuard>
                    <Layout>
                      <ShopSetup />
                    </Layout>
                  </ShopAccessGuard>
                } 
              />
              <Route path="/debug" element={<ProfileDebug />} />
              <Route 
                path="/dashboard" 
                element={
                  <ShopAccessGuard>
                    <ShopSetupRedirect>
                      <Layout>
                        <Index />
                      </Layout>
                    </ShopSetupRedirect>
                  </ShopAccessGuard>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminLayout>
                    <Admin />
                  </AdminLayout>
                } 
              />
              {/* Admin Shop Management Routes */}
              <Route 
                path="/admin/shops" 
                element={
                  <AdminLayout>
                    <ShopManagement />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/shops/analytics" 
                element={
                  <AdminLayout>
                    <ShopAnalytics />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/shops/approvals" 
                element={
                  <AdminLayout>
                    <ShopApprovals />
                  </AdminLayout>
                } 
              />
              
              {/* Admin User Management Routes */}
              <Route 
                path="/admin/users" 
                element={
                  <AdminLayout>
                    <UserActivity />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/users/roles" 
                element={
                  <AdminLayout>
                    <UserRoles />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/users/activity" 
                element={
                  <AdminLayout>
                    <UserActivity />
                  </AdminLayout>
                } 
              />
              
              {/* Admin Analytics Routes */}
              <Route 
                path="/admin/analytics" 
                element={
                  <AdminLayout>
                    <ShopAnalytics />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/analytics/shops" 
                element={
                  <AdminLayout>
                    <ShopAnalytics />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/analytics/users" 
                element={
                  <AdminLayout>
                    <ShopAnalytics />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/analytics/revenue" 
                element={
                  <AdminLayout>
                    <ShopAnalytics />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/analytics/overview" 
                element={
                  <AdminLayout>
                    <SystemOverview />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/analytics/users" 
                element={
                  <AdminLayout>
                    <UserActivity />
                  </AdminLayout>
                } 
              />
              
              {/* Admin Management Routes */}
              <Route 
                path="/admin/management/approvals" 
                element={
                  <AdminLayout>
                    <ShopApprovals />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/management/roles" 
                element={
                  <AdminLayout>
                    <UserRoles />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/management/activity" 
                element={
                  <AdminLayout>
                    <UserActivity />
                  </AdminLayout>
                } 
              />
              
              {/* Admin Billing Routes */}
              <Route 
                path="/admin/billing" 
                element={
                  <AdminLayout>
                    <BillingManagement />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/billing/management" 
                element={
                  <AdminLayout>
                    <BillingManagement />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/billing/plans" 
                element={
                  <AdminLayout>
                    <SubscriptionPlans />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/subscriptions" 
                element={
                  <AdminLayout>
                    <SubscriptionPlans />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/subscriptions/billing" 
                element={
                  <AdminLayout>
                    <BillingManagement />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/subscriptions/plans" 
                element={
                  <AdminLayout>
                    <SubscriptionPlans />
                  </AdminLayout>
                } 
              />
              
              {/* Admin Monitoring Routes */}
              <Route 
                path="/admin/monitoring" 
                element={
                  <AdminLayout>
                    <SystemOverview />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/monitoring/overview" 
                element={
                  <AdminLayout>
                    <SystemOverview />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/monitoring/health" 
                element={
                  <AdminLayout>
                    <SystemHealth />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/monitoring/performance" 
                element={
                  <AdminLayout>
                    <SystemPerformance />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/monitoring/logs" 
                element={
                  <AdminLayout>
                    <SystemHealth />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/status" 
                element={
                  <AdminLayout>
                    <SystemOverview />
                  </AdminLayout>
                } 
              />
              
              {/* Admin Settings Routes */}
              <Route 
                path="/admin/settings" 
                element={
                  <AdminLayout>
                    <GeneralSettings />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/settings/general" 
                element={
                  <AdminLayout>
                    <GeneralSettings />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/settings/ai" 
                element={
                  <AdminLayout>
                    <GeneralSettings />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/settings/security" 
                element={
                  <AdminLayout>
                    <GeneralSettings />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/settings/integrations" 
                element={
                  <AdminLayout>
                    <GeneralSettings />
                  </AdminLayout>
                } 
              />
              
              {/* Admin Support Routes */}
              <Route 
                path="/admin/support" 
                element={
                  <AdminLayout>
                    <SupportCenter />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/admin/support/center" 
                element={
                  <AdminLayout>
                    <SupportCenter />
                  </AdminLayout>
                } 
              />
              <Route 
                path="/pos" 
                element={
                  <ShopAccessGuard>
                    <ShopSetupRedirect>
                      <POS />
                    </ShopSetupRedirect>
                  </ShopAccessGuard>
                } 
              />
              <Route 
                path="/products/add" 
                element={
                  <ShopAccessGuard>
                    <ShopSetupRedirect>
                      <AddProduct />
                    </ShopSetupRedirect>
                  </ShopAccessGuard>
                } 
              />
              <Route 
                path="/products/categories" 
                element={
                  <ShopAccessGuard>
                    <ShopSetupRedirect>
                      <Layout>
                        <CategoryManagement />
                      </Layout>
                    </ShopSetupRedirect>
                  </ShopAccessGuard>
                } 
              />
              <Route 
                path="/products/catalog" 
                element={
                  <ShopAccessGuard>
                    <ShopSetupRedirect>
                      <Layout>
                        <CategoryManagement />
                      </Layout>
                    </ShopSetupRedirect>
                  </ShopAccessGuard>
                } 
              />
              <Route 
                path="/shop" 
                element={
                  <ShopAccessGuard>
                    <ShopSetupRedirect>
                      <Layout>
                        <ShopManagementPage />
                      </Layout>
                    </ShopSetupRedirect>
                  </ShopAccessGuard>
                } 
              />
              <Route 
                path="/shop/settings" 
                element={
                  <ShopAccessGuard>
                    <ShopSetupRedirect>
                      <Layout>
                        <ShopManagementPage />
                      </Layout>
                    </ShopSetupRedirect>
                  </ShopAccessGuard>
                } 
              />
              <Route 
                path="/shop/staff" 
                element={
                  <ShopAccessGuard>
                    <ShopSetupRedirect>
                      <Layout>
                        <ShopManagementPage />
                      </Layout>
                    </ShopSetupRedirect>
                  </ShopAccessGuard>
                } 
              />
              <Route 
                path="/shop/printer" 
                element={
                  <ShopAccessGuard>
                    <ShopSetupRedirect>
                      <Layout>
                        <ShopManagementPage />
                      </Layout>
                    </ShopSetupRedirect>
                  </ShopAccessGuard>
                } 
              />
              <Route 
                path="/shop/integrations" 
                element={
                  <ShopAccessGuard>
                    <ShopSetupRedirect>
                      <Layout>
                        <ShopManagementPage />
                      </Layout>
                    </ShopSetupRedirect>
                  </ShopAccessGuard>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <ShopAccessGuard>
                      <ShopSetupRedirect>
                        <Layout>
                          <Analytics />
                        </Layout>
                      </ShopSetupRedirect>
                    </ShopAccessGuard>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics/sales" 
                element={
                  <ProtectedRoute>
                    <ShopAccessGuard>
                      <ShopSetupRedirect>
                        <Layout>
                          <Analytics />
                        </Layout>
                      </ShopSetupRedirect>
                    </ShopAccessGuard>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics/customers" 
                element={
                  <ProtectedRoute>
                    <ShopAccessGuard>
                      <ShopSetupRedirect>
                        <Layout>
                          <Analytics />
                        </Layout>
                      </ShopSetupRedirect>
                    </ShopAccessGuard>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics/products" 
                element={
                  <ProtectedRoute>
                    <ShopAccessGuard>
                      <ShopSetupRedirect>
                        <Layout>
                          <Analytics />
                        </Layout>
                      </ShopSetupRedirect>
                    </ShopAccessGuard>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/subscription" 
                element={
                  <ProtectedRoute>
                    <ShopAccessGuard>
                      <ShopSetupRedirect>
                        <Subscription />
                      </ShopSetupRedirect>
                    </ShopAccessGuard>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics/financial" 
                element={
                  <ProtectedRoute>
                    <ShopAccessGuard>
                      <ShopSetupRedirect>
                        <Layout>
                          <Analytics />
                        </Layout>
                      </ShopSetupRedirect>
                    </ShopAccessGuard>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/products/inventory" 
                element={
                  <ProtectedRoute>
                    <ShopAccessGuard>
                      <ShopSetupRedirect>
                        <InventoryPage />
                      </ShopSetupRedirect>
                    </ShopAccessGuard>
                  </ProtectedRoute>
                } 
              />
              
              {/* Transaction Routes */}
              <Route 
                path="/transactions/history" 
                element={
                  <ProtectedRoute>
                    <ShopAccessGuard>
                      <ShopSetupRedirect>
                        <Layout>
                          <TransactionHistoryPage />
                        </Layout>
                      </ShopSetupRedirect>
                    </ShopAccessGuard>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/transactions/refunds" 
                element={
                  <ProtectedRoute>
                    <ShopAccessGuard>
                      <ShopSetupRedirect>
                        <Layout>
                          <TransactionRefundsPage />
                        </Layout>
                      </ShopSetupRedirect>
                    </ShopAccessGuard>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/transactions/payments" 
                element={
                  <ProtectedRoute>
                    <ShopAccessGuard>
                      <ShopSetupRedirect>
                        <Layout>
                          <TransactionPaymentsPage />
                        </Layout>
                      </ShopSetupRedirect>
                    </ShopAccessGuard>
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Shop Roles Route */}
              <Route 
                path="/admin/shop-roles" 
                element={<ShopRoles />} 
              />
              
              {/* Auth callback route for Supabase magic link/invite */}
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Customer List Route */}
              <Route path="/customers/list" element={<CustomerListPage />} />
              
              {/* Customer Analytics Route */}
              <Route path="/customers/analytics" element={<CustomerAnalyticsPage />} />

              {/* Customer Loyalty Program Route */}
              <Route path="/customers/loyalty" element={<LoyaltyProgramStartPage />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ShopProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
