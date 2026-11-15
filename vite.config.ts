import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: false, // public/manifest.webmanifest
      workbox: {
        // App shell: scripts, styles, fonts, icons. Flags and data are cached when first used.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest}'],
        globIgnores: ['flags/**', 'og-image.png', '**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese,hebrew,math,symbols}-*.woff2'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/data\//],
        runtimeCaching: [
          {
            // Leader list and daily puzzles: fresh when online, cached copy when offline.
            urlPattern: ({ url }) => url.pathname.startsWith('/data/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'leaderdle-data', networkTimeoutSeconds: 4, expiration: { maxEntries: 20 } },
          },
          {
            urlPattern: ({ request, url }) => request.destination === 'image' && url.pathname.endsWith('.svg'),
            handler: 'CacheFirst',
            options: { cacheName: 'leaderdle-flags', expiration: { maxEntries: 300 } },
          },
        ],
      },
    }),
  ],
  build: {
    // Flags are small SVG files: keep them as files so only the ones shown are downloaded.
    assetsInlineLimit: (file) => (file.includes('flag-icons') ? false : undefined),
    rollupOptions: {
      output: {
        assetFileNames: (info) =>
          info.originalFileNames?.some((f) => f.includes('flag-icons')) ? 'flags/[name]-[hash][extname]' : 'assets/[name]-[hash][extname]',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
