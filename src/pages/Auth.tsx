
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store } from 'lucide-react';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { AdminLoginForm } from '@/components/auth/AdminLoginForm';

const Auth = () => {
  const { user, signIn, signUp, loading, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    // Redirect based on user role
    const isAdmin = profile?.role === 'admin' || 
                   user.email === 'admin@billblaze.com' || 
                   user.email === 'harjot@iprofit.in';
    
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Store className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Bill Blaze POS</CardTitle>
          <CardDescription>Your complete SaaS POS solution</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <SignInForm 
                onSubmit={signIn} 
                isLoading={isLoading} 
                setIsLoading={setIsLoading} 
              />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignUpForm 
                onSubmit={signUp} 
                isLoading={isLoading} 
                setIsLoading={setIsLoading} 
              />
            </TabsContent>
            
            <TabsContent value="admin">
              <AdminLoginForm 
                onSubmit={signIn} 
                isLoading={isLoading} 
                setIsLoading={setIsLoading} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
