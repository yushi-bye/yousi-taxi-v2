import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vercelApiPlugin } from './vite-plugin-vercel-api.js'

export default defineConfig({
  plugins: [react(), vercelApiPlugin()],
  server: {
    host: true,
    port: 5173,
  },
})
