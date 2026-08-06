import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'GymLog — Workout Tracker',
        short_name: 'GymLog',
        description: 'Personal daily gym training logger',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // Match any WebM/MP4 video files in your public/videos folder, or our dummy googleapis URL
            urlPattern: ({ url }) => url.pathname.startsWith('/videos/') || url.hostname === 'commondatastorage.googleapis.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-videos-cache',
              expiration: {
                maxEntries: 60, // Cache up to 60 exercise clips
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200], // 0 is for opaque responses (like CORS cross-origin)
              },
            },
          },
        ],
      },
    }),
  ],
})
