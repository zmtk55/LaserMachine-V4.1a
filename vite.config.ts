import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // No inyectar secrets al cliente via 'define' — usar import.meta.env.VITE_GROQ_API_KEY
      // (Vite expone automáticamente vars con prefijo VITE_ desde .env / .env.local y Vercel las inyecta en build)
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'lucide': ['lucide-react'],
              'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            }
          }
        },
        chunkSizeWarningLimit: 500,
      }
    };
});