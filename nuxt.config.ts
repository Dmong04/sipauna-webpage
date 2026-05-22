// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@nuxtjs/supabase'
  ],
  // @ts-ignore
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/dashboard', '/dashboard/*', '/login'],
    }
  },
  pwa: {
    strategies: "injectManifest",
    srcDir: resolve(__dirname, "public"),
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
      type: "module",
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
      ]
    }
  },
})