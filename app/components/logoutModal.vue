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
            d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
        </svg>
      </div>

      <!-- Título -->
      <h2 class="text-gray-900 dark:text-gray-100 font-semibold mt-4 text-xl">Cerrar sesión</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
        ¿Estás seguro de que deseas cerrar sesión?
      </p>

      <!-- Botones -->
      <div class="mt-5 w-full flex flex-col gap-2">

        <button type="button" @click="$emit('confirm')" :disabled="loading"
          class="w-full h-10 rounded-md bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium text-sm active:scale-95 transition flex items-center justify-center gap-2">
          <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {{ loading ? 'Cerrando sesión...' : 'Sí, cerrar sesión' }}
        </button>

        <button type="button" @click="$emit('close')" :disabled="loading"
          class="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 active:scale-95 transition">
          Cancelar
        </button>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['close', 'confirm'])

defineProps<{
  loading?: boolean
}>()
</script>