import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    proxy: {
      '/api/ndl': {
        target: 'https://ndlsearch.ndl.go.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ndl/, '/api'),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'えほん記録帳',
        short_name: 'えほん記録帳',
        description: '図書館で借りた絵本を記録するアプリ',
        theme_color: '#C0543C',
        background_color: '#F5F0E8',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache' },
          },
          {
            urlPattern: /^https:\/\/www\.googleapis\.com\/books\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'google-books-cache' },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      thresholds: {
        branches: 90,
        perFile: true,
      },
    },
  },
});
