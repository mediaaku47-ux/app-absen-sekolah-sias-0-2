import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registrasi Service Worker PWA untuk Chrome / Android Install & Offline
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Abaikan jika service worker tidak diizinkan di environment tertentu
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
