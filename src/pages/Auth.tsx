import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, ShoppingCart, BarChart3, Users, Shield, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Button } from '@/components/ui/button';

const Auth = () => {
  const { user, signIn, signUp, loading, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-400 animate-ping"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading BillBlaze POS...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Redirect based on user role - ONLY system admins go to admin panel
    const isSystemAdmin = user.email === 'admin@billblaze.com' || 
                         user.email === 'harjot@iprofit.in';
    
    if (isSystemAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-blue-400/20 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-indigo-400/15 rounded-full blur-md animate-pulse delay-500"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
          {/* Logo & Brand */}
          <div className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <Store className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">BillBlaze</h1>
                <p className="text-blue-100 text-sm">POS System</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              Transform Your Business with Smart POS
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed">
              The complete SaaS solution for modern retail. Streamline operations, boost sales, and grow your business with our intelligent point-of-sale system.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6 mb-12">
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex-shrink-0">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Smart POS Interface</h3>
                <p className="text-blue-100">Intuitive, fast, and reliable point-of-sale experience</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Real-time Analytics</h3>
                <p className="text-blue-100">Track sales, inventory, and business performance instantly</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 flex-shrink-0">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Multi-shop Management</h3>
                <p className="text-blue-100">Manage multiple locations from a single dashboard</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="text-2xl font-bold">500+</div>
              <div className="text-blue-100 text-sm">Active Stores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">₹50M+</div>
              <div className="text-blue-100 text-sm">Monthly Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-blue-100 text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-blue-600 rounded-xl p-3">
                <Store className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BillBlaze</h1>
                <p className="text-gray-600 text-sm">POS System</p>
              </div>
            </div>
          </div>

          {/* Auth Card */}
          <Card className="w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-3">
                  <Store className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome to BillBlaze</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-6 pb-6">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger 
                    value="signin" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-lg transition-all"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                  <TabsContent value="signin" className="space-y-0">
                    <SignInForm 
                      onSubmit={signIn} 
                      isLoading={isLoading} 
                      setIsLoading={setIsLoading} 
                    />
                  </TabsContent>
                  
                  <TabsContent value="signup" className="space-y-0">
                    <SignUpForm 
                      onSubmit={signUp} 
                      isLoading={isLoading} 
                      setIsLoading={setIsLoading} 
                    />
                  </TabsContent>
                </div>
              </Tabs>

              {/* Trust Indicators */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>SSL Secure</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="h-3 w-3 text-blue-500" />
                    <span>GDPR Compliant</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>© 2024 BillBlaze POS. All rights reserved.</p>
            <div className="flex items-center justify-center space-x-4 mt-2">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
