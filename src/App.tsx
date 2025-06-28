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
                path="/shop" 
                element={
                  <ShopSetupRedirect>
                    <ShopManagementPage />
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
