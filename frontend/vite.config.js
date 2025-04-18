import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Ensure React is optimized
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  // Keep source maps for debugging
  build: {
    sourcemap: true,
  },
})
