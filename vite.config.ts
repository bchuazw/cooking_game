import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves under /<repo>/. Set base accordingly.
const base = process.env.VITE_BASE ?? '/cooking_game/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
          if (id.includes('/dishes/')) {
            const m = id.match(/dishes\/([^/]+)/);
            if (m) return `dish-${m[1]}`;
          }
        },
      },
    },
  },
});
