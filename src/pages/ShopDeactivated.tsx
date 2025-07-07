import { useAuth } from '@/hooks/useAuth';
import { useShop } from '@/hooks/useShop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Mail, Phone, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const ShopDeactivated = () => {
  const { user, signOut } = useAuth();
  const { refreshShopAccess } = useShop();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/auth';
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshShopAccess();
      // If refresh was successful, the user should be redirected automatically
      // by the ShopAccessGuard logic
    } catch (error) {
      console.error('Error refreshing shop access:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">Shop Access Suspended</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your shop access has been temporarily suspended by the system administrator. 
              This may be due to account review, payment issues, or policy violations.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Account:</strong> {user?.email}
            </p>
            <p>
              If you believe this is an error or need to reactivate your account, 
              please contact our support team.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-gray-900">Contact Support</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>support@billblaze.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="flex-1"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking...' : 'Check Access'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopDeactivated; 