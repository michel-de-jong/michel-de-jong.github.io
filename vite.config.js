import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          utils: [
            './js/utils/calculation-utils.js',
            './js/utils/format-utils.js',
            './js/utils/storage-utils.js'
          ]
        }
      }
    },
    cssCodeSplit: true,
    sourcemap: false
  },
  css: {
    devSourcemap: false
  }
});
