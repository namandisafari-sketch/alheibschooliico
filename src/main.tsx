import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register service worker only in production to avoid caching issues during development
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (newSW) {
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'activated') {
              caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
              window.location.reload();
            }
          });
        }
      });
      // Check for SW update every 60s
      setInterval(() => reg.update(), 60000);
    }).catch((err) => {
      console.warn('ServiceWorker registration failed: ', err);
    });
  });
  // Reload when a new service worker takes over (skipWaiting activates)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
