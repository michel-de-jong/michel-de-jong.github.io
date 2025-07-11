// Vite configuration for optional build process
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base path for GitHub Pages
  base: process.env.NODE_ENV === 'production' ? '/roi-calculator/' : '/',
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          // Split vendor libraries
          'vendor-charts': ['chart.js'],
          'vendor-export': ['xlsx', 'jspdf'],
          'vendor-tax': [
            './js/tax/vpb-calculator.js',
            './js/tax/box1-calculator.js',
            './js/tax/box3-calculator.js'
          ]
        },
        // Asset naming
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    }
  },
  
  // Development server
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  
  // Preview server (for testing build)
  preview: {
    port: 4173,
    open: true
  },
  
  // Optimizations
  optimizeDeps: {
    include: ['chart.js', 'xlsx', 'jspdf']
  },
  
  // Define global constants
  define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
    '__BUILD_DATE__': JSON.stringify(new Date().toISOString())
  }
});