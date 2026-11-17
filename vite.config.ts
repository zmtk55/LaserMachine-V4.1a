import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Vite expone VITE_* al navegador: nunca colocar secretos en esas variables.
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