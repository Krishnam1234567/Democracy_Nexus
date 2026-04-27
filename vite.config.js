import { defineConfig } from 'vite';

/**
 * Vite configuration for the Election Education Assistant.
 * Configures development server, build output, and module resolution.
 */
export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
          gemini: ['@google/generative-ai'],
          vendor: ['dompurify']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
