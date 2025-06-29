import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ShopProvider } from "@/hooks/useShop";
import { Layout } from "@/components/Layout";
import { ShopSetupRedirect } from "@/components/ShopSetupRedirect";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import POS from "./pages/POS";
import AddProduct from "./pages/AddProduct";
import NotFound from "./pages/NotFound";
import ShopManagementPage from "./pages/ShopManagementPage";
import Analytics from "./pages/Analytics";
import { CategoryManagement } from "@/components/CategoryManagement";

const queryClient = new QueryClient();

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
              <Route 
                path="/dashboard" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <Index />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <Layout>
                    <Admin />
                  </Layout>
                } 
              />
              <Route 
                path="/pos" 
                element={
                  <ShopSetupRedirect>
                    <POS />
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/products/add" 
                element={
                  <ShopSetupRedirect>
                    <AddProduct />
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/products/categories" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <CategoryManagement />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/products/catalog" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <CategoryManagement />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/shop" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <ShopManagementPage />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/shop/settings" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <ShopManagementPage />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/shop/staff" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <ShopManagementPage />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/shop/printer" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <ShopManagementPage />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/shop/integrations" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <ShopManagementPage />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/analytics/sales" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/analytics/customers" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/analytics/products" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
              <Route 
                path="/analytics/financial" 
                element={
                  <ShopSetupRedirect>
                    <Layout>
                      <Analytics />
                    </Layout>
                  </ShopSetupRedirect>
                } 
              />
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
