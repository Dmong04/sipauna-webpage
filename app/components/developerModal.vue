<template>
  <!-- Overlay -->
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" @click.self="$emit('close')">

    <!-- Card -->
    <div
      class="flex flex-col items-center bg-white dark:bg-gray-900 shadow-md rounded-xl py-6 px-5 w-full max-w-md border border-gray-200 dark:border-gray-700">

      <!-- Ícono -->
      <div class="flex items-center justify-center p-4 bg-red-100 dark:bg-red-950 rounded-full">
        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" stroke-width="1.8"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
      </div>

      <!-- Título -->
      <h2 class="text-gray-900 dark:text-gray-100 font-semibold mt-4 text-xl">El equipo</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
        Desarrollado por estudiantes de la UNA sede Chorotega
      </p>

      <!-- Devs -->
      <div class="mt-5 w-full flex flex-col gap-3">

        <div
          class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div
            class="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-700 dark:text-red-400 font-semibold text-sm shrink-0">
            C
          </div>
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">Christopher Lamberti Chavarría</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Desarrollador Backend / Frontend</p>
          </div>
        </div>

        <div
          class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div
            class="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-700 dark:text-red-400 font-semibold text-sm shrink-0">
            D
          </div>
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">Dereck Monge Chaves</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Desarrollador Backend / Frontend</p>
          </div>
        </div>

        <div
          class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div
            class="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-700 dark:text-red-400 font-semibold text-sm shrink-0">
            P
          </div>
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">Pablo González Rodríguez</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Desarrollador Backend / Frontend</p>
          </div>
        </div>

      </div>

      <!-- Botón cerrar -->
      <button type="button" @click="$emit('close')"
        class="mt-5 w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition">
        Cerrar
      </button>

    </div>
  </div>
</template>

<script setup>
const emit = defineEmits(['close'])
</script>