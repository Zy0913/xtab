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
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
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
