import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Optimization for production builds
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'ui-vendor': ['@headlessui/react', 'classnames'],
          'core-vendor': ['react', 'react-dom', 'zustand'],
        }
      }
    }
  },
  // Resolve paths consistently for Azure deployment
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@charts': '/src/charts',
      '@styles': '/src/styles',
      '@utils': '/src/utils',
      '@context': '/src/context'
    }
  }
})