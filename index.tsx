import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/styles/design-tokens.css';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ NO SE ENCONTRÓ EL ELEMENTO ROOT');
  document.body.innerHTML = '<h1 style="color: red; font-size: 48px; padding: 20px;">ERROR: No se encontró #root</h1>';
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch((error) => {
        console.error('[PWA] SW registration failed:', error);
      });
  });
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('💥 ERROR AL RENDERIZAR:', error);
  document.body.innerHTML = `<h1 style="color: red; padding: 20px;">ERROR: ${error}</h1>`;
}
