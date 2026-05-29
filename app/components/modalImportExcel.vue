<script setup lang="ts">
const emit = defineEmits(['close', 'success'])

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const loading = ref(false)
const result = ref<{
  success: boolean
  professors: number
  areas: number
  classrooms: number
  courses: number
  schedules: number
  skipped: number
  errors: string[]
} | null>(null)

function openFilePicker() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
  result.value = null
}

async function handleImport() {
  if (!selectedFile.value) return

  loading.value = true
  result.value = null

  try {
    const token = useCookie('gql:token').value ?? localStorage.getItem('gql:token')

    const body = new FormData()
    body.append('operations', JSON.stringify({
      query: `mutation ImportExcel($file: Upload!) {
        importExcel(file: $file) {
          success professors areas classrooms courses schedules skipped errors
        }
      }`,
      variables: { file: null },
    }))
    body.append('map', JSON.stringify({ '0': ['variables.file'] }))
    body.append('0', selectedFile.value)

    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    })

    const json = await res.json()

    if (json.errors?.length) {
      throw new Error(json.errors[0].message)
    }

    result.value = json.data.importExcel
    if (result.value?.success) emit('success')

  } catch (e: any) {
    result.value = {
      success: false,
      professors: 0, areas: 0, classrooms: 0, courses: 0,
      schedules: 0, skipped: 0,
      errors: [e?.message ?? 'Error al procesar el archivo.'],
    }
  } finally {
    loading.value = false
  }
}

function reset() {
  selectedFile.value = null
  result.value = null
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <!-- Overlay -->
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" @click.self="$emit('close')">
    <!-- Card -->
    <div
      class="flex flex-col items-center bg-white dark:bg-gray-900 shadow-md rounded-xl py-6 px-5 w-full max-w-md border border-gray-200 dark:border-gray-700">

      <!-- Input file oculto -->
      <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="onFileChange" />

      <!-- Ícono -->
      <div class="flex items-center justify-center p-4 bg-red-100 dark:bg-red-950 rounded-full">
        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" stroke-width="1.8"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>

      <!-- Título -->
      <h2 class="text-gray-900 dark:text-gray-100 font-semibold mt-4 text-xl">Cargar horarios</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
        Selecciona el archivo Excel con los horarios a importar.
      </p>

      <!-- Selector de archivo -->
      <div class="mt-5 w-full">
        <button type="button" @click="openFilePicker" :disabled="loading"
          class="w-full flex items-center justify-between gap-3 p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500 bg-gray-50 dark:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <div class="flex items-center gap-3 min-w-0">
            <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span class="text-sm truncate"
              :class="selectedFile ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'">
              {{ selectedFile ? selectedFile.name : 'Ningún archivo seleccionado' }}
            </span>
          </div>
          <span class="text-xs font-medium text-red-500 shrink-0">Examinar</span>
        </button>
      </div>

      <!-- Resultado -->
      <div v-if="result" class="mt-4 w-full rounded-lg border p-4 text-sm" :class="result.success
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'">
        <!-- Éxito -->
        <template v-if="result.success">
          <p class="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Importación exitosa
          </p>
          <div class="grid grid-cols-2 gap-2">
            <div
              class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-green-100 dark:border-green-900">
              <span class="text-gray-500 dark:text-gray-400">Profesores</span>
              <span class="font-semibold text-gray-800 dark:text-gray-200">{{ result.professors }}</span>
            </div>
            <div
              class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-green-100 dark:border-green-900">
              <span class="text-gray-500 dark:text-gray-400">Áreas</span>
              <span class="font-semibold text-gray-800 dark:text-gray-200">{{ result.areas }}</span>
            </div>
            <div
              class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-green-100 dark:border-green-900">
              <span class="text-gray-500 dark:text-gray-400">Aulas</span>
              <span class="font-semibold text-gray-800 dark:text-gray-200">{{ result.classrooms }}</span>
            </div>
            <div
              class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-green-100 dark:border-green-900">
              <span class="text-gray-500 dark:text-gray-400">Cursos</span>
              <span class="font-semibold text-gray-800 dark:text-gray-200">{{ result.courses }}</span>
            </div>
            <div
              class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-green-100 dark:border-green-900 col-span-2">
              <span class="text-gray-500 dark:text-gray-400">Horarios creados</span>
              <span class="font-semibold text-gray-800 dark:text-gray-200">{{ result.schedules }}</span>
            </div>
            <div v-if="result.skipped > 0"
              class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md px-3 py-2 border border-green-100 dark:border-green-900 col-span-2">
              <span class="text-gray-500 dark:text-gray-400">Filas omitidas</span>
              <span class="font-semibold text-amber-600 dark:text-amber-400">{{ result.skipped }}</span>
            </div>
          </div>
        </template>

        <!-- Error -->
        <template v-else>
          <p class="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1.5">
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Error en la importación
          </p>
          <ul class="space-y-1 max-h-32 overflow-y-auto">
            <li v-for="(err, i) in result.errors" :key="i" class="text-red-600 dark:text-red-400 text-xs">
              • {{ err }}
            </li>
          </ul>
        </template>
      </div>

      <!-- Acciones -->
      <div class="mt-5 w-full flex flex-col gap-2">
        <button v-if="!result" type="button" @click="handleImport" :disabled="!selectedFile || loading"
          class="w-full h-10 rounded-md bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm flex items-center justify-center gap-2 transition-all">
          <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {{ loading ? 'Importando...' : 'Importar' }}
        </button>

        <button v-if="result" type="button" @click="reset"
          class="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition">
          Importar otro archivo
        </button>

        <button type="button" @click="$emit('close')"
          class="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition">
          Cerrar
        </button>
      </div>

    </div>
  </div>
</template>