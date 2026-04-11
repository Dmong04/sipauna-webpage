// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/color-mode',
    'nuxt-graphql-client',
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],
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
    assetsInclude: ['**/*.graphql'],
    plugins: [
      tailwindcss(),
    ],
  },
  runtimeConfig: {
    public: {
      GQL_HOST: 'http://localhost:3000/api/graphql'
    }
  },
  'graphql-client': {
    clients: {
      default: {
        host: 'http://localhost:3000/api/graphql',
        schema: resolve(__dirname, 'server/graphql/schema.graphql'),
      }
    }
  }
})