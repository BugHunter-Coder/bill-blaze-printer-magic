
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface AdminLoginFormProps {
  onSubmit: (email: string, password: string) => Promise<{ error: any }>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const AdminLoginForm = ({ onSubmit, isLoading, setIsLoading }: AdminLoginFormProps) => {
  const [adminData, setAdminData] = useState({
    email: '',
    password: '',
  });

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await onSubmit(adminData.email, adminData.password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Admin login successful!');
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <Alert className="mb-4">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Admin Credentials:</strong><br />
          Email: admin@billblaze.com<br />
          Password: admin123
        </AlertDescription>
      </Alert>
      
      <form onSubmit={handleAdminLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-email">Admin Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="admin-email"
              type="email"
              placeholder="Enter admin email"
              className="pl-10"
              value={adminData.email}
              onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="admin-password">Admin Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="admin-password"
              type="password"
              placeholder="Enter admin password"
              className="pl-10"
              value={adminData.password}
              onChange={(e) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          <Shield className="h-4 w-4 mr-2" />
          {isLoading ? 'Signing in...' : 'Admin Login'}
        </Button>
      </form>
    </>
  );
};
