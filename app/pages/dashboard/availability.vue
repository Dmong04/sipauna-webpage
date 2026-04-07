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
    const result = await GqlGetClassrooms()
    console.log(result)
    resultados.value = result.classrooms ?? []
    viewResults.value = true
  } catch (err) {
    error.value = 'Error al obtener los datos'
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <section class="flex flex-col lg:flex-row m-4 gap-0 **:transition-colors **:duration-300">
    <!--Card de filtrado de resultados-->
    <section class="flex flex-col card min-h-[60vh] lg:min-h-[80vh] shadow-md rounded-xl mx-2 p-8 w-full mt-4 mb-2">
      <p class="text-sm text-gray-600 dark:text-gray-100">Aquí podrás comprobar la disponibilidad de los espacios para
        tus actividades.</p>

      <p class="text-sm text-gray-600 dark:text-gray-100 mt-4">Filtrar por:</p>

      <div class="mt-4 w-full max-w-sm">
        <label for="ID" class="block text-sm font-medium text-gray-700 dark:text-gray-100">Búsqueda por ID de
          aula:</label>
        <div class="relative mt-2 w-full">
          <input type="text" id="ID" name="IDinput"
            class="py-2 px-2 pr-9 block rounded-md border w-full border-gray-600 shadow-md sm:text-sm dark:text-gray-100 dark:bg-gray-900"
            placeholder="NRC: 123314" />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-gray-400 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="mt-4 w-full max-w-sm">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-100">Nombre del aula:</label>
        <div class="relative mt-2 w-full">
          <input type="text" name="Nameinput"
            class="py-2 px-2 pr-9 block rounded-md border w-full border-gray-600 shadow-md sm:text-sm dark:text-gray-100 dark:bg-gray-900"
            placeholder="Aula 101" />
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-gray-400 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div class="mt-4 w-full max-w-sm">
        <label for="Ciclo" class="block text-sm font-medium text-gray-700 dark:text-gray-100">Seleccione el ciclo que
          desea comprobar disponibilidad:</label>
        <select id="Ciclo" name="Cicloinput"
          class="mt-2 block border w-full border-gray-600 shadow-md sm:text-sm dark:text-gray-100 dark:bg-gray-900 py-2 px-2 pr-9 rounded-md">
          <option value="FirstCicle">Primer ciclo</option>
          <option value="SecondCicle">Segundo ciclo</option>
        </select>
      </div>

      <div class="mt-4 mb-4 w-full max-w-sm">
        <label for="LoanDate" class="block text-sm font-medium text-gray-700 dark:text-gray-100">Fecha a comprobar
          disponibilidad:</label>
        <input type="date" id="LoanDate" name="LoanDateinput"
          class="mt-2 block border w-full border-gray-600 shadow-md sm:text-sm dark:text-gray-100 dark:bg-gray-900 py-2 px-2 pr-9 rounded-md" />
      </div>

      <button @click="handleSubmit" :disabled="loading"
        class="w-full max-w-xs mt-auto bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md">{{
          loading ? 'Buscando...' : 'Comprobar disponibilidad' }}</button>
    </section>

    <!-- Card de resultados -->
    <section class="card shadow-md mx-2 p-8 w-full mt-4 mb-2 rounded-xl">
      <span class="text-md font-medium text-gray-900 dark:text-gray-100">Resultados:</span>

      <!-- Sin resultados -->
      <div v-if="resultados.length === 0" class="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center py-8">
        No se encontraron resultados.
      </div>

      <!-- Lista de resultados -->
      <div v-else class="mt-4 flex flex-col gap-3">
        <div v-for="aula in resultados" :key="aula.code"
          class="border border-gray-300 dark:border-gray-700 rounded-md p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ aula.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">ID: {{ aula.code }} · Capacidad: {{ aula.capacity }}
              personas</p>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>