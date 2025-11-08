import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: 'localhost',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        login: path.resolve(__dirname, 'login.html'),
        signup: path.resolve(__dirname, 'signup.html'),
        'canva-callback': path.resolve(__dirname, 'canva-callback.html'),
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'gemini': ['@google/genai'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', '@google/genai'],
  },
});
