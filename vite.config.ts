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
  build: {
    // 业务页已按路由懒加载；再把框架与 UI 库拆成稳定的 vendor chunk：
    // 一是单文件体积回到 500 kB 以内，二是升级业务代码时用户不必重下 antd。
    // rolldown 用 codeSplitting.groups 替代 rollup 的 manualChunks（不支持对象写法）
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'antd', test: /node_modules[\\/](antd|@ant-design|rc-)/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|@remix-run)/ },
          ],
        },
      },
    },
  },
})
