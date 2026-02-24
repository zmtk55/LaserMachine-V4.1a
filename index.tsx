import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/styles/design-tokens.css';
import App from './App';

console.log('🔥 index.tsx ejecutándose...');

const rootElement = document.getElementById('root');
console.log('📦 Root element:', rootElement);

if (!rootElement) {
  console.error('❌ NO SE ENCONTRÓ EL ELEMENTO ROOT');
  document.body.innerHTML = '<h1 style="color: red; font-size: 48px; padding: 20px;">ERROR: No se encontró #root</h1>';
  throw new Error("Could not find root element to mount to");
}

try {
  console.log('🚀 Creando React root...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('✅ React root creado, renderizando App...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ App renderizado');
} catch (error) {
  console.error('💥 ERROR AL RENDERIZAR:', error);
  document.body.innerHTML = `<h1 style="color: red; padding: 20px;">ERROR: ${error}</h1>`;
}
