<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Schedule {
  scheduleId:    string
  classroomCode: string
  day:           string
  startTime:     string
  endTime:       string
  subject:       string
  teacherName:   string
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const DAY_COLORS: Record<string, string> = {
  'Lunes':     'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  'Martes':    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'Miércoles': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Jueves':    'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  'Viernes':   'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  'Sábado':    'bg-pink-100   text-pink-700   dark:bg-pink-900/30   dark:text-pink-400',
}

const auth    = useAuthStore()
const isAdmin = computed(() => auth.user?.roleName === 'admin')

const schedules  = ref<Schedule[]>([])
const loading    = ref(false)
const error      = ref('')
const filterDay  = ref('')
const filterCode = ref('')

// ── Paginación ─────────────────────────────────────────────────────────────
const PAGE_SIZE   = 10
const currentPage = ref(1)

async function fetchSchedules() {
  error.value   = ''
  loading.value = true
  try {
    const result = await GqlGetSchedules()
    schedules.value = result.schedules ?? []
    currentPage.value = 1
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

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

watch([filterDay, filterCode], () => { currentPage.value = 1 })

const availableCodes = computed(() =>
  [...new Set(schedules.value.map(s => s.classroomCode))]
)

onMounted(fetchSchedules)

const showImportModal = ref(false)

function buildSchedules() { showImportModal.value = true }
function onImportSuccess() {
  showImportModal.value = false
  fetchSchedules()
}
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

      <div class="flex flex-col sm:flex-row gap-2">
        <button v-if="isAdmin" @click="buildSchedules"
          class="self-start sm:self-auto flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-medium py-2 px-4 rounded-md transition-all duration-150">
          <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {{ loading ? 'Cargando...' : 'Cargar horarios' }}
        </button>

        <button @click="fetchSchedules" :disabled="loading"
          class="self-start sm:self-auto flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-md transition-all duration-150">
          <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {{ loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" role="alert"
      class="mx-2 mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </div>

    <!-- Filtros -->
    <div class="mx-2 mb-4 flex flex-col sm:flex-row gap-3">
      <div class="w-full sm:w-48">
        <label for="filter-day" class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Día</label>
        <select id="filter-day" v-model="filterDay"
          class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors">
          <option value="">Todos los días</option>
          <option v-for="day in DAYS" :key="day" :value="day">{{ day }}</option>
        </select>
      </div>

      <div class="w-full sm:w-48">
        <label for="filter-classroom" class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Aula</label>
        <select id="filter-classroom" v-model="filterCode"
          class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors">
          <option value="">Todas las aulas</option>
          <option v-for="code in availableCodes" :key="code" :value="code">Aula {{ code }}</option>
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

            <!-- Skeleton -->
            <tr v-else-if="loading" v-for="n in PAGE_SIZE" :key="n" class="animate-pulse">
              <td colspan="5" class="px-4 py-3">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </td>
            </tr>

            <!-- Filas paginadas -->
            <tr v-else v-for="s in paginated" :key="s.scheduleId"
              class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60">
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

      <!-- Footer: conteo + paginación -->
      <div v-if="!loading && filtered.length > 0"
        class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-white/10
         flex flex-col items-center gap-2">

        <!-- Conteo -->
        <span class="text-xs text-gray-400 dark:text-gray-500">
          {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, filtered.length) }}
          de {{ filtered.length }} registro{{ filtered.length !== 1 ? 's' : '' }}
        </span>

        <!-- Controles -->
        <div class="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10
                    rounded-full px-2 py-1.5 shadow-sm">

          <!-- Primera -->
          <button @click="currentPage = 1" :disabled="currentPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-full
                   text-gray-400 dark:text-gray-500
                   hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                   disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                   transition-colors"
            title="Primera página">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Anterior -->
          <button @click="currentPage--" :disabled="currentPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-full
                   text-gray-400 dark:text-gray-500
                   hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                   disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                   transition-colors"
            title="Página anterior">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Separador -->
          <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

          <!-- Números -->
          <template v-for="page in totalPages" :key="page">
            <button
              v-if="page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1"
              @click="currentPage = page"
              :class="[
                'min-w-7 h-7 px-2 rounded-full text-xs font-semibold transition-all duration-150',
                page === currentPage
                  ? 'bg-red-500 text-white shadow-sm shadow-red-200 dark:shadow-red-900/40 scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400'
              ]">
              {{ page }}
            </button>
            <span
              v-else-if="page === currentPage - 2 || page === currentPage + 2"
              class="w-7 text-center text-xs text-gray-300 dark:text-gray-600 select-none">
              …
            </span>
          </template>

          <!-- Separador -->
          <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

          <!-- Siguiente -->
          <button @click="currentPage++" :disabled="currentPage === totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-full
                   text-gray-400 dark:text-gray-500
                   hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                   disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                   transition-colors"
            title="Página siguiente">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <!-- Última -->
          <button @click="currentPage = totalPages" :disabled="currentPage === totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-full
                   text-gray-400 dark:text-gray-500
                   hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                   disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                   transition-colors"
            title="Última página">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            </svg>
          </button>

        </div>
      </div>
    </div>

    <!-- Aviso admin -->
    <p v-if="isAdmin" class="mx-2 mt-4 text-xs text-gray-400 dark:text-gray-600">
      La gestión de horarios (crear, editar, eliminar) estará disponible en una próxima versión.
    </p>

    <ModalImportExcel
      v-if="showImportModal"
      @close="showImportModal = false"
      @success="onImportSuccess"
    />

  </section>
</template>