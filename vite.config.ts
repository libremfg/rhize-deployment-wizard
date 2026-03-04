import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
  server: {
    open: true,
  },
});
