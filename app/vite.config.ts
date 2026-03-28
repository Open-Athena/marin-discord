import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const allowedHosts = process.env.VITE_ALLOWED_HOSTS?.split(',') ?? []

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5272,
    host: true,
    allowedHosts,
    proxy: {
      '/api': {
        target: 'http://localhost:5273',
        changeOrigin: true,
      },
      '/attachments': {
        target: 'http://localhost:5273',
        changeOrigin: true,
      },
    },
  },
})
