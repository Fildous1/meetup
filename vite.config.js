import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // API obsluhuje `npm run dev:api` (wrangler dev) na portu 8787.
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },

})
