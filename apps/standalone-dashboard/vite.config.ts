import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy Scout AI router requests to Supabase Edge Functions
      '/api/scout-ai': {
        target: process.env.VITE_SUPABASE_FUNCTIONS_URL || 'http://localhost:54321/functions/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/scout-ai/, '/scout_ai_router')
      }
    }
  },
})