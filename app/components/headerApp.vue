<script setup>
const menuOpen = ref(false)
const colorMode = useColorMode()
const route = useRoute()
const auth = useAuthStore()

const showLogoutModal = ref(false)
const loggingOut = ref(false)

const navItems = computed(() => {
  const items = [
    { to: '/dashboard', label: 'Inicio' },
    { to: '/dashboard/schedules', label: 'Horarios' },
    { to: '/dashboard/booking', label: 'Solicitud de reservación' },
    { to: '/dashboard/availability', label: 'Comprobar disponibilidad' },
    { to: '/dashboard/my-bookings', label: 'Mis reservas' },
  ]
  if (auth.user?.roleName === 'admin') {
    items.push({ to: '/dashboard/loans', label: 'Préstamos' })
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

async function handleLogout() {
  loggingOut.value = true
  await auth.clearSession()
  loggingOut.value = false
  showLogoutModal.value = false
  navigateTo('/login', { replace: true })
}
</script>

<template>
  <!-- Modal de cierre de sesión -->
  <LogoutModal v-if="showLogoutModal" :loading="loggingOut" @close="showLogoutModal = false" @confirm="handleLogout" />

  <header
    class="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
    <div class="flex items-center justify-between max-w-7xl mx-auto px-4 h-16">

      <!-- Logo -->
      <NuxtLink to="/dashboard" class="flex items-center gap-2.5 shrink-0">
        <img src="/img/LogoUNA.png" alt="SIPAUNA" class="h-10 w-auto" />
        <span class="font-semibold text-gray-800 dark:text-white text-sm hidden sm:inline">SIPAUNA</span>
      </NuxtLink>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" :class="[
          'border-b-2 text-sm font-medium inline-flex items-center px-3 h-16 transition-colors duration-200',
          isActive(item.to)
            ? 'border-red-500 text-red-600 dark:text-red-400'
            : 'border-transparent text-gray-600 dark:text-gray-300 hover:border-red-400 hover:text-red-500 dark:hover:text-red-400'
        ]">
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Right side (desktop) -->
      <div class="hidden md:flex items-center gap-3">
        <button @click="toggleTheme"
          class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          :title="colorMode.value === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
          <svg v-if="colorMode.value !== 'dark'" class="w-5 h-5 text-gray-600" xmlns="http://www.w3.org/2000/svg"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z" />
          </svg>
          <svg v-else class="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        </button>

        <!-- Botón logout desktop -->
        <button @click="showLogoutModal = true" title="Cerrar sesión"
          class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>

        <div v-if="auth.user" class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-700 dark:text-red-300 font-semibold text-xs shrink-0 transition-colors duration-200">
            {{ userInitial }}
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-300 max-w-36 truncate transition-colors duration-200">{{
            auth.user.fullname }}</span>
        </div>
      </div>

      <!-- Hamburger (mobile) -->
      <button @click="menuOpen = !menuOpen"
        class="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        aria-label="Menú">
        <svg v-if="!menuOpen" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile menu -->
    <div v-if="menuOpen"
      class="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-200">
      <nav class="flex flex-col px-4 py-3 gap-1">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" @click="menuOpen = false" :class="[
          'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200',
          isActive(item.to)
            ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        ]">
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="flex flex-col px-4 py-3 gap-3 border-t border-gray-100 dark:border-gray-800">

        <!-- Usuario -->
        <div v-if="auth.user" class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-700 dark:text-red-300 font-semibold text-xs shrink-0">
            {{ userInitial }}
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-300 truncate">{{ auth.user.fullname }}</span>
        </div>

        <!-- Botones -->
        <div class="flex items-center gap-2">
          <button @click="toggleTheme"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
            <svg v-if="colorMode.value !== 'dark'" class="w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z" />
            </svg>
            <svg v-else class="w-4 h-4 shrink-0 fill-current" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
            Cambiar tema
          </button>

          <!-- Botón logout mobile -->
          <button @click="menuOpen = false; showLogoutModal = true"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Salir
          </button>
        </div>

      </div>
    </div>
  </header>
</template>