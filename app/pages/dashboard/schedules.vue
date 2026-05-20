<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Schedule {
  id: string
  classroomCode: string
  day: string
  startTime: string
  endTime: string
  subject: string
  teacherName: string
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

const DAY_COLORS: Record<string, string> = {
  'Lunes':     'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  'Martes':    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'Miércoles': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Jueves':    'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  'Viernes':   'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
}

const auth     = useAuthStore()
const isAdmin  = computed(() => auth.user?.roleId === 1)

const schedules  = ref<Schedule[]>([])
const loading    = ref(false)
const error      = ref('')
const filterDay  = ref('')
const filterCode = ref('')

async function fetchSchedules() {
  error.value   = ''
  loading.value = true

  try {
    const result = await GqlGetSchedules()
    schedules.value = result.schedules ?? []
  } catch {
    error.value = 'No se pudieron cargar los horarios. Intente nuevamente.'
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  return schedules.value.filter(s => {
    const matchDay  = filterDay.value  ? s.day === filterDay.value : true
    const matchCode = filterCode.value ? s.classroomCode === filterCode.value : true
    return matchDay && matchCode
  })
})

// Clases únicas de aulas presentes en los datos para el selector
const availableCodes = computed(() =>
  [...new Set(schedules.value.map(s => s.classroomCode))]
)

onMounted(fetchSchedules)
</script>

<template>
  <section class="m-4 **:transition-colors **:duration-300">

    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 mx-2">
      <div>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Horarios de aulas</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ isAdmin ? 'Visualización completa de todos los horarios registrados.' : 'Horarios disponibles para consulta.' }}
        </p>
      </div>

      <button
        @click="fetchSchedules"
        :disabled="loading"
        class="self-start sm:self-auto flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-md transition-all duration-150"
      >
        <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        {{ loading ? 'Cargando...' : 'Actualizar' }}
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" role="alert" class="mx-2 mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </div>

    <!-- Filtros -->
    <div class="mx-2 mb-4 flex flex-col sm:flex-row gap-3">
      <div class="w-full sm:w-48">
        <label for="filter-day" class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Día</label>
        <select
          id="filter-day"
          v-model="filterDay"
          class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors"
        >
          <option value="">Todos los días</option>
          <option v-for="day in DAYS" :key="day" :value="day">{{ day }}</option>
        </select>
      </div>

      <div class="w-full sm:w-48">
        <label for="filter-classroom" class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Aula</label>
        <select
          id="filter-classroom"
          v-model="filterCode"
          class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors"
        >
          <option value="">Todas las aulas</option>
          <option v-for="code in availableCodes" :key="code" :value="code">
            Aula {{ code }}
          </option>
        </select>
      </div>
    </div>

    <!-- Tabla -->
    <div class="mx-2 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-white/10">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs tracking-wide">
            <tr>
              <th class="px-4 py-3 text-left">Día</th>
              <th class="px-4 py-3 text-left">Horario</th>
              <th class="px-4 py-3 text-left">Aula</th>
              <th class="px-4 py-3 text-left">Materia</th>
              <th class="px-4 py-3 text-left">Docente</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-white/5">

            <!-- Sin datos -->
            <tr v-if="!loading && filtered.length === 0">
              <td colspan="5" class="px-4 py-10 text-center text-gray-400 dark:text-gray-500">
                No se encontraron horarios con los filtros seleccionados.
              </td>
            </tr>

            <!-- Skeleton mientras carga -->
            <tr v-else-if="loading" v-for="n in 5" :key="n" class="animate-pulse">
              <td colspan="5" class="px-4 py-3">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </td>
            </tr>

            <!-- Filas reales -->
            <tr
              v-else
              v-for="s in filtered"
              :key="s.id"
              class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60"
            >
              <td class="px-4 py-3">
                <span :class="DAY_COLORS[s.day] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'"
                  class="inline-block text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                  {{ s.day }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {{ s.startTime }} – {{ s.endTime }}
              </td>
              <td class="px-4 py-3">
                <span class="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-mono px-2 py-0.5 rounded">
                  {{ s.classroomCode }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-200">{{ s.subject }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ s.teacherName }}</td>
            </tr>

          </tbody>
        </table>
      </div>

      <!-- Conteo -->
      <div v-if="!loading && filtered.length > 0" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-white/10 text-xs text-gray-400 dark:text-gray-500">
        {{ filtered.length }} registro{{ filtered.length !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- Aviso rol administrador -->
    <p v-if="isAdmin" class="mx-2 mt-4 text-xs text-gray-400 dark:text-gray-600">
      La gestión de horarios (crear, editar, eliminar) estará disponible en una próxima versión.
    </p>

  </section>
</template>
