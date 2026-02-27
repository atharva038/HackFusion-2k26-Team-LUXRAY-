import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => {
          // Allow long-running requests like TTS
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setTimeout(120000);
          });
        },
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
        rewrite: (path) => path,
      },
    },
    // Increase connection timeout
    hmr: {
      timeout: 10000,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
