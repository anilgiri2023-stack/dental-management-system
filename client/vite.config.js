import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiProxyTarget = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/api\/?$/, '')
  : null

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  ...(apiProxyTarget ? { server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      }
    }
  } } : {})
})
