# SIPAUNA — Sistema Institucional para el Préstamo de Aulas

Sistema de gestión de reservas de aulas diseñado para la **Universidad Nacional de Costa Rica (Sede Regional Chorotega)**. Su propósito es centralizar y agilizar la solicitud, verificación y administración de espacios académicos para eventos universitarios y administrativos.

---

## Características principales

- **Horarios de aulas** — Visualización de horarios académicos y reservas existentes.
- **Motor de disponibilidad** — Lógica especializada para verificar franjas horarias y detectar traslapes en tiempo real.
- **Gestión de préstamos** — Flujo completo desde la solicitud del usuario hasta la validación y aprobación por parte del administrador.
- **Importación masiva de datos** — Carga de profesores, cursos y horarios mediante archivos Excel.
- **Soporte offline (PWA)** — Arquitectura Progressive Web App con persistencia de datos y acceso durante inestabilidad de red.

---

## Stack tecnológico

| Capa | Tecnología | Rol |
|---|---|---|
| **Frontend** | Nuxt 4 (Vue 3) | SPA, enrutamiento e interfaz de usuario |
| **Estado** | Pinia | Gestión reactiva de estado en el cliente |
| **API Gateway** | Nitro + GraphQL Yoga | Endpoint unificado frontend-backend |
| **Base de datos / Auth** | Supabase (PostgreSQL) | Almacenamiento persistente y gestión de autenticación |
| **Estilos** | Tailwind CSS | Framework CSS con soporte para modo oscuro |
| **PWA** | Vite PWA + Workbox | Service Worker para caché y soporte offline |

---

## Arquitectura

La aplicación sigue una arquitectura desacoplada moderna:

- El **frontend** (Nuxt 4 en modo SPA, con SSR deshabilitado) gestiona la presentación y el estado mediante Pinia y composables GraphQL tipados generados automáticamente desde los archivos `.gql`.
- El **servidor** (Nitro) expone un único endpoint GraphQL en `/api/graphql`, implementado con GraphQL Yoga. Se encarga de verificar el JWT del header `Authorization`, inyectar el `userId` y `roleName` en el contexto de los resolvers, y gestionar CORS.
- **Supabase** se conecta con la clave `service_role`, lo que permite al servidor saltarse el Row Level Security (RLS) y delegar el control de acceso a los resolvers de negocio.
- El **Service Worker** personalizado (`public/sw-custom.js`) intercepta las peticiones GraphQL con una estrategia *Network-First*, habilitando lectura offline desde caché.

### Capas de caché del Service Worker

1. **Caché estático** — Assets como CSS, JS e íconos.
2. **Caché de sesión** — Token de autenticación para persistencia entre recargas.
3. **Caché GraphQL** — Resultados de operaciones `Query` para acceso offline.

---

## Requisitos previos

- **Node.js** compatible con Nuxt 4
- **npm** v9 o superior
- **Proyecto Supabase** activo con base de datos PostgreSQL

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes claves:

```env
SUPABASE_URL=         # URL de la API de tu proyecto Supabase
SUPABASE_SERVICE_KEY= # Clave service_role para acceso administrativo
JWT_SECRET=           # Clave para firmar y verificar tokens de sesión
GQL_HOST=             # URL del endpoint GraphQL (ej: http://localhost:3000/api/graphql)
```

---

## Instalación y desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo (con HMR)
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## Scripts disponibles

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `nuxt dev` | Inicia el servidor de desarrollo con PWA y generación GraphQL |
| `build` | `nuxt build` | Compila la aplicación para producción |
| `generate` | `nuxt generate` | Genera una build estática (SSG) |
| `postinstall` | `nuxt prepare` | Genera el directorio `.nuxt` y los tipos GraphQL tras la instalación |

---

## Estructura del proyecto

```
/
├── app/
│   ├── pages/
│   │   ├── dashboard/
│   │   │   ├── index.vue          # Página principal del dashboard
│   │   │   ├── about.vue          # Información del sistema
│   │   │   ├── schedules.vue      # Horarios de aulas
│   │   │   ├── availability.vue   # Verificación de disponibilidad
│   │   │   ├── booking.vue        # Solicitud de préstamo
│   │   │   └── users.vue          # Gestión de usuarios
│   └── app.vue
├── server/
│   ├── api/
│   │   └── graphql.ts             # Endpoint GraphQL (Yoga + Nitro)
│   └── graphql/
│       ├── schema.graphql         # Definición de tipos GraphQL
│       ├── resolvers/             # Implementaciones de resolvers
│       └── utils/
│           └── supabase.ts        # Cliente Supabase con service_role
├── public/
│   ├── sw-custom.js               # Service Worker personalizado
│   └── icons/                     # Íconos PWA
├── nuxt.config.ts
└── package.json
```

---

## Módulos y dependencias principales

- [`nuxt`](https://nuxt.com/) — Framework base
- [`graphql-yoga`](https://the-guild.dev/graphql/yoga-server) — Servidor GraphQL
- [`nuxt-graphql-client`](https://nuxt-graphql-client.web.app/) — Generación automática de composables tipados
- [`@nuxtjs/supabase`](https://supabase.nuxtjs.org/) — Integración Supabase
- [`@pinia/nuxt`](https://pinia.vuejs.org/) — Gestión de estado
- [`@vite-pwa/nuxt`](https://vite-pwa-org.netlify.app/) — Soporte PWA
- [`@nuxtjs/tailwindcss`](https://tailwindcss.nuxtjs.org/) — Estilos

---

## Para leer la documentación detallada de este proyecto, sigue el siguiente link.

[https://deepwiki.com/Dmong04/sipauna-webpage](https://deepwiki.com/Dmong04/sipauna-webpage)
