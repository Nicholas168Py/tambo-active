import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  publicDir: 'public',
  assetsInclude: ['**/*.glb'],
  build: {
    target: 'es2018',
    cssTarget: 'chrome90',
    sourcemap: false,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) return 'vendor';
          if (id.includes('node_modules/lenis')) return 'lenis';
          if (id.includes('node_modules/lucide')) return 'icons';
          if (id.includes('node_modules/three')) return 'three';
        }
      }
    }
  }
});
