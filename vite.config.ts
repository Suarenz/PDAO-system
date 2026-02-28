import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      appType: 'spa',
      server: {
        port: 3000,
        strictPort: false,
        host: '0.0.0.0',
        watch: {
          ignored: ['**/server/**', '**/vendor/**'],
        },
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:8000',
            changeOrigin: true,
          },
          '/sanctum': {
            target: 'http://127.0.0.1:8000',
            changeOrigin: true,
          },
          '/storage': {
            target: 'http://127.0.0.1:8000',
            changeOrigin: true,
          },
        },
      },
      optimizeDeps: {
        entries: ['index.html'],
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      }
    };
});
