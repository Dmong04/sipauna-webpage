// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    'nuxt-graphql-client',
  ],

  'graphql-client': {
    clients: {
      default: {
        host: process.env.GQL_HOST!,
        schema: fileURLToPath(new URL('server/graphql/schema.graphql', import.meta.url)),
      },
    },
  },
  pwa: {
    strategies: "injectManifest",
    srcDir: fileURLToPath(new URL('public', import.meta.url)),
    filename: "sw-custom.js",
    registerType: "autoUpdate",
    injectManifest: {
      injectionPoint: undefined,
    },
    manifest: {
      name: "SIPAUNA",
      short_name: "SIPAUNA",
      description: "Sistema Institucional para Préstamos de Aulas de la Universidad Nacional SRCH",
      theme_color: "#ef4444",
      background_color: "#0f172a",
      display: "standalone",
      orientation: "portrait",
      scope: "/",
      start_url: "/",
      icons: [
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
      screenshots: [
        {
          src: '/screenshots/login_light_mode.jpeg',
          sizes: '738x1600',
          type: 'image/jpeg',
          form_factor: 'narrow'
        },
        {
          src: '/screenshots/login_dark_mode.jpeg',
          sizes: '738x1600',
          type: 'image/jpeg',
          form_factor: 'narrow'
        },
        {
          src: '/screenshots/dashboard_home.jpeg',
          sizes: '738x1600',
          type: 'image/jpeg',
          form_factor: 'narrow'
        },
        {
          src: '/screenshots/dashboard_menu.jpeg',
          sizes: '738x1600',
          type: 'image/jpeg',
          form_factor: 'narrow'
        },
        {
          src: '/screenshots/footer.jpeg',
          sizes: '738x1600',
          type: 'image/jpeg',
          form_factor: 'narrow'
        },
        {
          src: '/screenshots/bookings.jpeg',
          sizes: '738x1600',
          type: 'image/jpeg',
          form_factor: 'narrow'
        },
        {
          src: '/screenshots/schedules.jpeg',
          sizes: '738x1600',
          type: 'image/jpeg',
          form_factor: 'narrow'
        },
        {
          src: '/screenshots/availability.jpeg',
          sizes: '738x1600',
          type: 'image/jpeg',
          form_factor: 'narrow'
        },
        {
          src: '/screenshots/availability_results.jpeg',
          sizes: '738x1600',
          type: 'image/jpeg',
          form_factor: 'narrow'
        },
        {
          src: '/screenshots/login_wide.jpeg',
          sizes: '1600x798',
          type: 'image/jpeg',
          form_factor: 'wide'
        },
        {
          src: '/screenshots/dashboard_home_wide.jpeg',
          sizes: '1600x794',
          type: 'image/jpeg',
          form_factor: 'wide'
        },
        {
          src: '/screenshots/schedules_wide.jpeg',
          sizes: '1600x797',
          type: 'image/jpeg',
          form_factor: 'wide'
        },
      ],
    },
    devOptions: {
       enabled: true,
    suppressWarnings: true,
    type: 'module',
    },
  },
  routeRules: {
    '/': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/login': { ssr: false },
  },
  colorMode: {
    classSuffix: ''
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'workbox-window',
        'xlsx',
      ]
    }
  },
  nitro: {
    externals: {
      inline: ['xlsx'],
    },
  },
})