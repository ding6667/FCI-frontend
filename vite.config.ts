import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    // 代理 pig-boot（server.servlet.context-path=/admin），避免联调期跨域
    proxy: {
      '/admin': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
    },
  },
})
