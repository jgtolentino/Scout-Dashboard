import { defineConfig } from 'vite'
import { resolve } from 'path'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry file
        entry: 'src/main/index.js',
        vite: {
          build: {
            outDir: 'out/main',
          },
        },
      },
      {
        // Preload scripts
        entry: 'src/preload/index.js',
        vite: {
          build: {
            outDir: 'out/preload',
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
    },
  },
  build: {
    outDir: 'out/renderer',
  },
})