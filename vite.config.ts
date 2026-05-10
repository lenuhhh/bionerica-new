import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },

  server: {
    port: 5173,
    host: true,
  },

  build: {
    // Target modern browsers (smaller, faster bundles)
    target: 'es2020',

    // Increase chunk size warning threshold
    chunkSizeWarningLimit: 600,

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Source maps for production debugging (disable for max perf)
    sourcemap: false,

    // Rollup options
    rollupOptions: {
      output: {
        // Asset naming for cache busting
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },

    // Minification
    minify: 'esbuild',

    // Optimize dependencies
    reportCompressedSize: true,
  },

  // Optimize dep pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
      'zustand',
      'clsx',
      'react-intersection-observer',
    ],
    exclude: ['@supabase/supabase-js'],
  },

  // Enable CSS preprocessing
  css: {
    devSourcemap: true,
    preprocessorOptions: {},
  },
})
