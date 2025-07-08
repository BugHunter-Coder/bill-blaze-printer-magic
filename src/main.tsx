import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SensitiveMaskProvider } from '@/components/SensitiveMaskContext'

createRoot(document.getElementById("root")!).render(<SensitiveMaskProvider><App /></SensitiveMaskProvider>);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
  