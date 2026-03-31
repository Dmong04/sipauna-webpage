// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({
  modules: ['@nuxtjs/color-mode', 'nuxt-graphql-client'],
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