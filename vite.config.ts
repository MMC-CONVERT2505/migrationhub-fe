import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // react-helmet-async is CommonJS: bundle it into the prerender (SSR) build so Node can import its named exports.
  ssr: { noExternal: ['react-helmet-async'] },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
