<script setup>
import { ref } from 'vue'
const menuOpen = ref(false)

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const colorMode = useColorMode()

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-white py-2  dark:bg-gray-900  transition-all duration-300">
    <div class="flex items-center justify-between md:justify-around max-w-7xl mx-auto px-4">
      <img src="/img/LogoUNA.png" alt="SIPAUNA Logo" class="h-15 w-auto" />
      <nav class="hidden md:flex text-sm items-center">
        <div class="flex items-center justify-center gap-1">
          <div class="gap-1">
            <NuxtLink to="/dashboard/home"
              class="border-b-2 border-transparent hover:border-red-500 hover:text-red-500 dark:text-white text-gray-600 text-sm font-medium inline-flex items-center px-2 h-full transition-colors duration-200">
              Inicio
            </NuxtLink>
            <NuxtLink to="/dashboard/schedules"
              class="border-b-2 border-transparent hover:border-red-500 hover:text-red-500 dark:text-white text-gray-600 text-sm font-medium inline-flex items-center px-2 h-full transition-colors duration-200">
              Horarios
            </NuxtLink>
            <NuxtLink to="/dashboard/booking"
              class="border-b-2 border-transparent hover:border-red-500 hover:text-red-500 dark:text-white text-gray-600 text-sm font-medium inline-flex items-center px-2 h-full transition-colors duration-200">
              Solicitud de reservación
            </NuxtLink>
            <NuxtLink to="/dashboard/availability"
              class="border-b-2 border-transparent hover:border-red-500 hover:text-red-500 dark:text-white text-gray-600 text-sm font-medium inline-flex items-center px-2 h-full transition-colors duration-200">
              Comprobar disponibilidad
            </NuxtLink>
          </div>
        </div>
      </nav>

      <button @click="toggleTheme"
        class="hidden text-white md:flex items-center gap-2 bg-blue-700 dark:bg-gray-800 rounded-lg px-3 py-2 hover:bg-blue-500 dark:hover:bg-gray-700 duration-300 transition-colors ease-in">
        <svg v-if="colorMode.value !== 'dark'" class="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z" />
        </svg>
        <svg v-else class="w-6 h-6 text-white fill-current" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
        <span class="text-slate-200">Cambiar tema</span>
      </button>

      <!-- Botón hamburguesa -->
      <button @click="toggleMenu" class="md:hidden text-gray-800 dark:text-white">
        <svg v-if="!menuOpen" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Nav Móvil (fuera del flex) -->
    <div v-if="menuOpen"
      class="md:hidden flex flex-col px-6 pt-3 pb-4 gap-3 border-t border-gray-200 dark:border-white/10 mt-2">
      <div>
        <div class="flex flex-col gap-4">
          <NuxtLink to="/dashboard/home"
            class="border-b-2 border-transparent hover:border-red-500 hover:text-red-500 dark:text-white text-gray-600 text-sm font-medium inline-flex items-center px-2 h-full transition-colors duration-200">
            Inicio
          </NuxtLink>
          <NuxtLink to="/dashboard/schedules"
            class="border-b-2 border-transparent hover:border-red-500 hover:text-red-500 dark:text-white text-gray-600 text-sm font-medium inline-flex items-center px-2 h-full transition-colors duration-200">
            Horarios
          </NuxtLink>
          <NuxtLink to="/dashboard/booking"
            class="border-b-2 border-transparent hover:border-red-500 hover:text-red-500 dark:text-white text-gray-600 text-sm font-medium inline-flex items-center px-2 h-full transition-colors duration-200">
            Solicitud de reservación
          </NuxtLink>
          <NuxtLink to="/dashboard/availability"
            class="border-b-2 border-transparent hover:border-red-500 hover:text-red-500 dark:text-white text-gray-600 text-sm font-medium inline-flex items-center px-2 h-full transition-colors duration-200">
            Comprobar disponibilidad
          </NuxtLink>
        </div>
      </div>
      <button @click="toggleTheme"
        class="text-white dark:text- flex items-center gap-2 bg-blue-700 dark:bg-gray-800 rounded-lg px-3 py-2 hover:bg-blue-500 dark:hover:bg-gray-700 duration-300 transition-colors ease-in">
        <svg v-if="colorMode.value !== 'dark'" class="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z" />
        </svg>
        <svg v-else class="w-6 h-6 text-white fill-current" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
        <span class="text-slate-200">Cambiar tema</span>
      </button>
    </div>

  </header>
</template>