import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import path from 'node:path'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'esnext',
    rolldownOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        manualChunks: (id) => {
          // Keep React/Zustand in their own vendor chunk so the newtab entry
          // payload doesn't churn whenever app code changes.
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/zustand/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    // CRXJS dev mode fetches http://localhost:5173, and on this machine
    // localhost resolves to IPv4. Bind Vite to 127.0.0.1 so the extension
    // can reach the server reliably instead of ending up on IPv6 only.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
})
