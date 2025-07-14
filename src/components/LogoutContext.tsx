import React, { createContext, useContext, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface LogoutContextType {
  loggingOut: boolean;
  logout: () => Promise<void>;
}

const LogoutContext = createContext<LogoutContextType | undefined>(undefined);

export const LogoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = "/auth";
    } catch (error) {
      setLoggingOut(false);
      toast.error(error?.message || 'Logout failed. Please try again.');
    }
  };

  return (
    <LogoutContext.Provider value={{ loggingOut, logout }}>
      {children}
    </LogoutContext.Provider>
  );
};

export const useLogout = () => {
  const context = useContext(LogoutContext);
  if (!context) throw new Error("useLogout must be used within a LogoutProvider");
  return context;
}; 