import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

interface LayoutProps {
  children: React.ReactNode;
  showBackToLanding?: boolean;
}

export const Layout = ({ children, showBackToLanding = false }: LayoutProps) => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Import supabase here to avoid circular dependency
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signOut();
      toast({
        description: "Logout successful!",
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to logout: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async (data: any) => {
    try {
      await updateProfile(data);
      toast({
        description: "Profile updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update profile: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleBackToLanding = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onLogout={handleLogout}
        onProfileUpdate={handleProfileUpdate}
        showBackToLanding={showBackToLanding}
        onBackToLanding={handleBackToLanding}
      />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}; 