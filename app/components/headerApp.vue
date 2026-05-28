<script setup lang="ts">
const menuOpen    = ref(false)
const showSettings = ref(false)
const colorMode   = useColorMode()
const route       = useRoute()
const auth        = useAuthStore()

const ROLE_BADGE: Record<string, string> = {
  admin:      'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  profesor:   'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  estudiante: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  invitado:   'bg-gray-100   text-gray-600   dark:bg-gray-700/50   dark:text-gray-300',
}

const navItems = computed(() => {
  const items = [
    { to: '/dashboard', label: 'Inicio' },
    { to: '/dashboard/schedules', label: 'Horarios' },
    { to: '/dashboard/booking', label: 'Solicitud de reservación' },
    { to: '/dashboard/availability', label: 'Comprobar disponibilidad' },
  ]
  if (auth.user?.roleName === 'admin') {
    items.push({ to: '/dashboard/users', label: 'Usuarios' })
  }
  return items
})

const userInitial = computed(() =>
  auth.user?.fullname?.charAt(0)?.toUpperCase() ?? '?'
)

const isActive = (path) => route.path === path

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const logout = async () => {
  await auth.clearSession()
  useGqlToken(null)                 // descarta el JWT del cliente GraphQL
  navigateTo('/login', { replace: true })
}
</script>

<template>
  <!-- Backdrop para cerrar el settings dropdown al hacer clic fuera -->
  <div v-if="showSettings" class="fixed inset-0 z-40" @click="showSettings = false" />

  <header class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
    <div class="flex items-center justify-between max-w-7xl mx-auto px-4 h-16">

      <!-- Logo -->
      <NuxtLink to="/dashboard" class="flex items-center gap-2.5 shrink-0">
        <img src="/img/LogoUNA.png" alt="SIPAUNA" class="h-10 w-auto" />
        <span class="font-semibold text-gray-800 dark:text-white text-sm hidden sm:inline">SIPAUNA</span>
      </NuxtLink>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'border-b-2 text-sm font-medium inline-flex items-center px-3 h-16 transition-colors duration-200',
            isActive(item.to)
              ? 'border-red-500 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-600 dark:text-gray-300 hover:border-red-400 hover:text-red-500 dark:hover:text-red-400'
          ]"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Right side (desktop) -->
      <div class="hidden md:flex items-center gap-3">
        <div v-if="auth.user" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-700 dark:text-red-300 font-semibold text-xs shrink-0">
            {{ userInitial }}
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-300 max-w-36 truncate">{{ auth.user.fullname }}</span>
        </div>

        <button
          @click="toggleTheme"
          class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          :title="colorMode.value === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        >
          <svg v-if="colorMode.value !== 'dark'" class="w-5 h-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z" />
          </svg>
          <svg v-else class="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>

        <!-- Settings gear + dropdown -->
        <div class="relative">
          <button
            @click="showSettings = !showSettings"
            title="Mi perfil"
            :class="[
              'w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200',
              showSettings
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
            ]"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>

          <!-- Dropdown panel -->
          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 scale-95 -translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 -translate-y-1"
          >
            <div
              v-if="showSettings"
              class="absolute right-0 top-11 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 z-50 overflow-hidden"
            >
              <!-- Header del panel -->
              <div class="px-4 py-4 flex items-center gap-3 bg-gray-50 dark:bg-gray-800/60">
                <div class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-700 dark:text-red-300 font-bold text-lg shrink-0">
                  {{ userInitial }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ auth.user?.fullname }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ auth.user?.email }}</p>
                  <span
                    :class="ROLE_BADGE[auth.user?.roleName ?? ''] ?? ROLE_BADGE.invitado"
                    class="mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                  >{{ auth.user?.roleName }}</span>
                </div>
              </div>

              <!-- Acciones -->
              <div class="p-2">
                <button
                  @click="showSettings = false"
                  class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
                >
                  <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Cambiar contraseña
                </button>
              </div>

              <!-- Cerrar sesión -->
              <div class="border-t border-gray-100 dark:border-gray-800 p-2">
                <button
                  @click="logout"
                  class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                >
                  <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <button
          @click="logout"
          title="Cerrar sesión"
          class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>

      <!-- Hamburger (mobile) -->
      <button
        @click="menuOpen = !menuOpen"
        class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Menú"
      >
        <svg v-if="!menuOpen" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile menu -->
    <div v-if="menuOpen" class="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
      <nav class="flex flex-col px-4 py-3 gap-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          @click="menuOpen = false"
          :class="[
            'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
            isActive(item.to)
              ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          ]"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Mobile: user card + actions -->
      <div class="border-t border-gray-100 dark:border-gray-800">
        <!-- User info card -->
        <div v-if="auth.user" class="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/60">
          <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-700 dark:text-red-300 font-bold shrink-0">
            {{ userInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ auth.user.fullname }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ auth.user.email }}</p>
            <span
              :class="ROLE_BADGE[auth.user.roleName] ?? ROLE_BADGE.invitado"
              class="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
            >{{ auth.user.roleName }}</span>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2 px-4 py-3">
          <button
            @click="toggleTheme"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200"
          >
            <svg v-if="colorMode.value !== 'dark'" class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z" />
            </svg>
            <svg v-else class="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
            Tema
          </button>

          <button
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Contraseña
          </button>

          <button
            @click="logout"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Salir
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
