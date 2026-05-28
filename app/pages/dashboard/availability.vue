<script setup>
import { ref } from 'vue'

const resultados = ref([])
const loading = ref(false)
const error = ref('')
const viewResults = ref(false)

const handleSubmit = async () => {
   
  error.value = ''
  loading.value = true

  try {
   const result =await $fetch('/api/graphql',{
    method:'POST',
    body:{
      query:`query getClassrooms{
      classrooms{
        classroomId
        code
        capacity
        }
      }`
    }
   })
   resultados.value=result.data?.classrooms ?? []
   viewResults.value=true
   
  } catch (err) {
    console.error('Error completo', err);
    error.value='Error al odtener los resultados'
    
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <section class="flex flex-col lg:flex-row m-4 gap-4 **:transition-colors **:duration-300">
    <!-- Card de filtrado -->
    <section
      class="flex flex-col items-center justify-between rounded-xl mx-2 p-6 w-full mt-2 mb-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm lg:max-w-sm shrink-0">

      <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">Comprobar disponibilidad</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Aquí podrás comprobar la disponibilidad de los espacios
        para tus actividades.</p>
      <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Filtrar por</p>

      <!-- ID de aula -->
      <div class="mt-4 w-full max-w-sm">
        <label for="ID" class="block text-xs font-medium text-gray-700 dark:text-gray-100">Búsqueda por ID de
          aula:</label>
        <div class="relative mt-2 w-full">
          <!-- Ícono izquierda: hashtag -->
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-gray-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>
          <input type="text" id="ID" name="IDinput" placeholder="NRC: 123314"
            class="py-2 pl-9 pr-9 block rounded-md border w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500" />
          <!-- Ícono derecha: lupa -->
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-gray-400 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Nombre del aula -->
      <div class="mt-4 w-full max-w-sm">
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-100">Nombre del aula:</label>
        <div class="relative mt-2 w-full">
          <!-- Ícono izquierda: edificio -->
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-gray-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <input type="text" name="Nameinput" placeholder="Aula 101"
            class="py-2 pl-9 pr-9 block rounded-md border w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500" />
          <!-- Ícono derecha: lupa -->
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-gray-400 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Ciclo -->
      <div class="mt-4 w-full max-w-sm">
        <label for="Ciclo" class="block text-xs font-medium text-gray-700 dark:text-gray-100">Seleccione el ciclo que
          desea comprobar disponibilidad:</label>
        <div class="relative mt-2 w-full">
          <!-- Ícono izquierda: libro -->
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-gray-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <!-- Ícono derecha: chevron -->
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <select id="Ciclo" name="Cicloinput"
            class="mt-2 block border w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 py-2 pl-9 pr-9 rounded-md appearance-none sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent">
            <option value="FirstCicle">Primer ciclo</option>
            <option value="SecondCicle">Segundo ciclo</option>
          </select>
        </div>
      </div>

      <!-- Fecha -->
      <div class="mt-4 mb-4 w-full max-w-sm">
        <label for="LoanDate" class="block text-xs font-medium text-gray-700 dark:text-gray-100">Fecha a comprobar
          disponibilidad:</label>
        <div class="relative mt-2 w-full">
          <!-- Ícono izquierda: calendario -->
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center cursor-pointer z-10"
            @click="$refs.dateInput.showPicker()">
            <svg class="h-4 w-4 text-gray-400 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <input ref="dateInput" type="date" id="LoanDate" name="LoanDateinput"
            class="block border w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 py-2 pl-9 pr-4 rounded-md sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent [&::-webkit-calendar-picker-indicator]:hidden" />
        </div>
      </div>

      <!-- Botón -->
      <button @click="handleSubmit" :disabled="loading"
        class="items-center w-full max-w-xs mt-auto flex justify-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-all duration-150">
        <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        {{ loading ? 'Buscando...' : 'Comprobar disponibilidad' }}
      </button>

    </section>

    <!-- Card de resultados -->
    <section
      class="mx-2 p-6 w-full mt-2 mb-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <span class="text-base font-semibold text-gray-800 dark:text-gray-100">Resultados</span>

      <!-- Sin resultados -->
      <div v-if="resultados.length === 0" class="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center py-8">
        No se encontraron resultados.
      </div>

      <!-- Lista de resultados -->
      <div v-else class="mt-4 flex flex-col gap-3">
        <div v-for="aula in resultados" :key="aula.code"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-red-700 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">Aula {{ aula.code }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Capacidad: {{ aula.capacity }} personas</p>
            </div>
          </div>
          <span
            class="shrink-0 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
            Disponible
          </span>
        </div>
      </div>
    </section>
  </section>
</template>