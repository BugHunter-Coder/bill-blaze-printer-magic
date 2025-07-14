import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SensitiveMaskProvider } from '@/components/SensitiveMaskContext'
import { LogoutProvider } from '@/components/LogoutContext'

createRoot(document.getElementById("root")!).render(
  <SensitiveMaskProvider>
    <LogoutProvider>
      <App />
    </LogoutProvider>
  </SensitiveMaskProvider>
);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
  