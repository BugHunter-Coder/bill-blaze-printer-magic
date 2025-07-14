
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SignUpFormProps {
  onSubmit: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const SignUpForm = ({ onSubmit, isLoading, setIsLoading }: SignUpFormProps) => {
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await onSubmit(signUpData.email, signUpData.password, signUpData.fullName);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created successfully! Please check your email to verify your account.');
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-6">
      <Alert className="mb-4">
        <AlertDescription>
          <strong>Note:</strong> Every new account must create a shop. To add staff, first create your shop, then invite staff from the dashboard.
        </AlertDescription>
      </Alert>
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="signup-name"
            type="text"
            placeholder="Enter your full name"
            className="pl-10"
            value={signUpData.fullName}
            onChange={(e) => setSignUpData(prev => ({ ...prev, fullName: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            className="pl-10"
            value={signUpData.email}
            onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="signup-password"
            type="password"
            placeholder="Create a password"
            className="pl-10"
            value={signUpData.password}
            onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-confirm">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            id="signup-confirm"
            type="password"
            placeholder="Confirm your password"
            className="pl-10"
            value={signUpData.confirmPassword}
            onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
};
