<script setup>
import { ref } from 'vue'
const menuOpen=ref(false)

const toggleMenu=()=>{
  menuOpen.value=!menuOpen.value
}
</script>

<template>
  <header class="bg-white py-5 shadow-sm dark:bg-gray-900 dark:border-b dark:border-white/10">
    
    
    <div class="flex items-center justify-between max-w-7xl mx-auto px-4">
      
     
      <img src="/img/LogoUNA.png" alt="SIPAUNA Logo" class="h-15 w-auto" />

  
      <nav class="hidden md:flex gap-6 text-sm">
        <NuxtLink to="/" class="text-gray-800 dark:text-white hover:text-blue-400 transition-colors duration-200">Acerca de SIPAUNA</NuxtLink>
        <NuxtLink to="/" class="text-gray-800 dark:text-white hover:text-blue-400 transition-colors duration-200">Acerca de la U</NuxtLink>
        <NuxtLink to="/" class="text-gray-800 dark:text-white hover:text-blue-400 transition-colors duration-200">Consultas</NuxtLink>
      </nav>

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
    <div v-if="menuOpen" class="md:hidden flex flex-col px-6 pt-3 pb-4 gap-3 border-t border-gray-200 dark:border-white/10 mt-2">
      <NuxtLink to="/" class="text-gray-800 dark:text-white hover:text-blue-400 transition-colors duration-200">Acerca de SIPAUNA</NuxtLink>
      <NuxtLink to="/" class="text-gray-800 dark:text-white hover:text-blue-400 transition-colors duration-200">Acerca de la U</NuxtLink>
      <NuxtLink to="/" class="text-gray-800 dark:text-white hover:text-blue-400 transition-colors duration-200">Consultas</NuxtLink>
    </div>

  </header>
</template>