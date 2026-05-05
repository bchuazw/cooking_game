import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves under /<repo>/. Set base accordingly.
const base = process.env.VITE_BASE ?? '/cooking_game/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Hawker Mama',
        short_name: 'Hawker Mama',
        description:
          'Cook Singapore hawker favorites with Auntie May. シンガポールのホーカー料理をメイおばさんと作ろう。',
        theme_color: '#2BA59D',
        background_color: '#F4EFE6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,opus,m4a,json,woff2}'],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/dishes/')) {
            const m = id.match(/dishes\/([^/]+)/);
            if (m) return `dish-${m[1]}`;
          }
        },
      },
    },
  },
});
