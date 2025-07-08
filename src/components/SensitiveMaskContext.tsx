import React, { createContext, useContext, useState, useEffect } from 'react';

interface SensitiveMaskContextType {
  maskSensitive: boolean;
  setMaskSensitive: (value: boolean) => void;
}

const SensitiveMaskContext = createContext<SensitiveMaskContextType | undefined>(undefined);

export const SensitiveMaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [maskSensitive, setMaskSensitiveState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('maskSensitive');
      return stored === null ? true : stored === 'true';
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('maskSensitive', maskSensitive.toString());
    }
  }, [maskSensitive]);

  const setMaskSensitive = (value: boolean) => {
    setMaskSensitiveState(value);
  };

  return (
    <SensitiveMaskContext.Provider value={{ maskSensitive, setMaskSensitive }}>
      {children}
    </SensitiveMaskContext.Provider>
  );
};

export const useSensitiveMask = () => {
  const context = useContext(SensitiveMaskContext);
  if (!context) {
    throw new Error('useSensitiveMask must be used within a SensitiveMaskProvider');
  }
  return context;
}; 