import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import React, { useState } from 'react';
import { useLogout } from '@/components/LogoutContext';

interface LayoutProps {
  children: React.ReactNode;
  showBackToLanding?: boolean;
  onOpenManagement?: () => void;
  isPrinterConnected?: boolean;
  onPrinterConnectionChange?: (isConnected: boolean) => void;
  onPrinterChange?: (device: BluetoothDevice | null) => void;
}

export const Layout = ({ 
  children, 
  showBackToLanding = false, 
  onOpenManagement,
  isPrinterConnected = false,
  onPrinterConnectionChange,
  onPrinterChange,
}: LayoutProps) => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { loggingOut, logout } = useLogout();

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
    <div className="min-h-screen bg-gray-50 flex flex-row">
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((v) => !v)} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          user={user}
          onLogout={logout}
          loggingOut={loggingOut}
          onProfileUpdate={handleProfileUpdate}
          showBackToLanding={showBackToLanding}
          onBackToLanding={handleBackToLanding}
          onOpenManagement={onOpenManagement}
          isPrinterConnected={isPrinterConnected}
          onPrinterConnectionChange={onPrinterConnectionChange}
          onPrinterChange={onPrinterChange}
        />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}; 