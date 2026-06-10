<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// ── Types ──────────────────────────────────────────────────────────────────────

interface CellData {
  type: 'free' | 'event' | 'continuation'
  date?: string
  slotStart?: string
  slotEnd?: string
  event?: {
    label: string
    sublabel: string
    type: 'schedule' | 'loan' | 'pending'
    start: string
    end: string
  }
  rowspan?: number
}

interface TimeSlot {
  start: string
  end: string
  label: string
  type: 'normal' | 'break'
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const TIME_SLOTS: TimeSlot[] = [
  { start: '08:00', end: '09:00', label: '08:00', type: 'normal' },
  { start: '09:00', end: '10:00', label: '09:00', type: 'normal' },
  { start: '10:00', end: '11:00', label: '10:00', type: 'normal' },
  { start: '11:00', end: '12:00', label: '11:00', type: 'normal' },
  { start: '12:00', end: '13:00', label: 'Almuerzo', type: 'break' },
  { start: '13:00', end: '14:00', label: '13:00', type: 'normal' },
  { start: '14:00', end: '15:00', label: '14:00', type: 'normal' },
  { start: '15:00', end: '16:00', label: '15:00', type: 'normal' },
  { start: '16:00', end: '17:00', label: '16:00', type: 'normal' },
  { start: '17:00', end: '18:00', label: '17:00', type: 'normal' },
  { start: '18:00', end: '19:00', label: '18:00', type: 'normal' },
  { start: '19:00', end: '20:00', label: '19:00', type: 'normal' },
  { start: '20:00', end: '21:00', label: '20:00', type: 'normal' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function dateToStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getMonday(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

function fmtDayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })
}

// ── State ──────────────────────────────────────────────────────────────────────

const selectedDate = ref(dateToStr(new Date()))
const classroomFilter = ref('')
const loading = ref(false)
const error = ref('')

const classrooms = ref<Array<{ classroomId: string; code: string; capacity: number }>>([])
const schedules = ref<Array<{ classroomCode: string; day: string; startTime: string; endTime: string; subject: string; teacherName: string }>>([])
const loans = ref<Array<{ classroomCode: string; loanDate: string; startTime: string; endTime: string; reason: string; requesterName: string; status: string }>>([])

// ── Week navigation ────────────────────────────────────────────────────────────

const weekDates = computed(() => {
  const mon = getMonday(selectedDate.value)
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(d.getDate() + i)
    return dateToStr(d)
  })
})

const weekLabel = computed(() => {
  const mon = weekDates.value[0]
  const sat = weekDates.value[5]
  const [my, mm, md] = mon.split('-').map(Number)
  const [sy, sm, sd] = sat.split('-').map(Number)
  const fmtA = new Date(my, mm - 1, md).toLocaleDateString('es-CR', { day: 'numeric', month: 'long' })
  const fmtB = new Date(sy, sm - 1, sd).toLocaleDateString('es-CR', { day: 'numeric', month: 'long' })
  return `${fmtA} – ${fmtB}, ${my}`
})

function changeWeek(delta: number) {
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta * 7)
  selectedDate.value = dateToStr(date)
}

const todayStr = dateToStr(new Date())
const isCurrentWeek = computed(() => weekDates.value.includes(todayStr))

// ── Filtered classrooms ────────────────────────────────────────────────────────

const filteredClassrooms = computed(() => {
  const q = classroomFilter.value.trim().toLowerCase()
  if (!q) return classrooms.value
  return classrooms.value.filter(c => c.code.toLowerCase().includes(q))
})

// ── Grid computation ──────────────────────────────────────────────────────────

function buildGrid(classroomCode: string): CellData[][] {
  // grid[slotIdx][dayIdx]
  const grid: CellData[][] = TIME_SLOTS.map((slot) =>
    Array.from({ length: 6 }, (_, dayIdx) => ({
      type: 'free' as const,
      date: weekDates.value[dayIdx],
      slotStart: slot.start,
      slotEnd: slot.end,
    }))
  )

  for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
    const dayName = DAY_NAMES[dayIdx]
    const dayDate = weekDates.value[dayIdx]

    const events = [
      ...schedules.value
        .filter(s => s.classroomCode === classroomCode && s.day === dayName)
        .map(s => ({
          start: s.startTime, end: s.endTime,
          label: s.subject, sublabel: s.teacherName,
          type: 'schedule' as const,
        })),
      ...loans.value
        .filter(l =>
          l.classroomCode === classroomCode &&
          l.loanDate === dayDate &&
          (l.status === 'PENDIENTE' || l.status === 'APROBADO')
        )
        .map(l => ({
          start: l.startTime, end: l.endTime,
          label: l.reason, sublabel: l.requesterName,
          type: (l.status === 'APROBADO' ? 'loan' : 'pending') as 'loan' | 'pending',
        })),
    ]

    for (const event of events) {
      const eSt = timeToMin(event.start)
      const eEn = timeToMin(event.end)
      let first = -1, last = -1

      TIME_SLOTS.forEach((slot, si) => {
        if (slot.type === 'break') return
        const st = timeToMin(slot.start)
        const en = timeToMin(slot.end)
        if (eSt < en && eEn > st) {
          if (first === -1) first = si
          last = si
        }
      })

      if (first === -1) continue

      grid[first][dayIdx] = {
        type: 'event',
        event,
        rowspan: last - first + 1,
        date: dayDate,
        slotStart: event.start,
        slotEnd: event.end,
      }
      for (let si = first + 1; si <= last; si++) {
        grid[si][dayIdx] = { type: 'continuation' }
      }
    }
  }

  return grid
}

const classroomGrids = computed<Record<string, CellData[][]>>(() => {
  const out: Record<string, CellData[][]> = {}
  for (const c of filteredClassrooms.value) {
    out[c.code] = buildGrid(c.code)
  }
  return out
})

// ── Booking navigation ────────────────────────────────────────────────────────

const router = useRouter()

function goBook(code: string, date: string, start: string, end: string) {
  router.push(`/dashboard/booking?${new URLSearchParams({ code, date, start, end })}`)
}

// ── PDF export ────────────────────────────────────────────────────────────────

function printPage() {
  if (import.meta.client) window.print()
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [cr, sr, lr] = await Promise.all([
      GqlGetClassrooms(),
      GqlGetSchedules(),
      GqlGetLoans(),
    ])
    classrooms.value = cr.classrooms ?? []
    schedules.value = sr.schedules ?? []
    loans.value = lr.loans ?? []
  } catch (e: any) {
    error.value = e?.gqlErrors?.[0]?.message ?? 'Error al cargar los datos. Intente nuevamente.'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<!-- ── Print styles ──────────────────────────────────────────────────────────── -->
<style>
@media print {
  header, footer, nav, aside { display: none !important; }
  .no-print { display: none !important; }
  * { box-shadow: none !important; }
  body { background: white !important; color: black !important; }
  .classroom-section { page-break-inside: avoid; margin-bottom: 24px; }
}
</style>

<template>
  <div class="px-3 sm:px-4 py-3 sm:py-4 **:transition-colors **:duration-200">

    <!-- ── Filter / toolbar ───────────────────────────────────────────────── -->
    <div class="no-print mb-4">

      <!-- Page title -->
      <div class="mb-3">
        <h1 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Disponibilidad de aulas</h1>
        <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Hacé clic en un espacio libre para reservar.
        </p>
      </div>

      <!-- Controls card — stacks vertically on mobile -->
      <div class="flex flex-col gap-2 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">

        <!-- Row 1: Week navigation (full width, centered on mobile) -->
        <div class="flex items-center justify-between gap-2">
          <button @click="changeWeek(-1)"
            class="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div class="flex-1 text-center">
            <span class="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider block leading-none mb-0.5">Semana</span>
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">{{ weekLabel }}</span>
          </div>

          <button @click="changeWeek(1)"
            class="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Row 2: Filter + actions -->
        <div class="flex items-center gap-2">
          <!-- Classroom filter -->
          <div class="flex items-center gap-2 flex-1 min-w-0 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
            <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input v-model="classroomFilter" type="text" placeholder="Buscar aula (ej: A-101)"
              class="flex-1 min-w-0 bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 outline-none" />
            <button v-if="classroomFilter" @click="classroomFilter = ''" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Refresh -->
          <button @click="loadData" :disabled="loading"
            class="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-50 transition-colors shrink-0"
            :title="loading ? 'Cargando...' : 'Actualizar'">
            <svg :class="['w-4 h-4', loading && 'animate-spin']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <!-- Print (hidden on very small screens) -->
          <button @click="printPage"
            class="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
            title="Exportar PDF">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>

          <!-- "Hoy" chip -->
          <button v-if="!isCurrentWeek" @click="selectedDate = todayStr"
            class="shrink-0 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 active:scale-[.97] transition-all">
            Hoy
          </button>
        </div>
      </div>

      <!-- Legend — 2-col grid on mobile -->
      <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-5 gap-y-1.5 mt-2.5 px-1 text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-800/60 border border-blue-300 dark:border-blue-700 shrink-0"></span>
          Clase programada
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-red-200 dark:bg-red-800/60 border border-red-300 dark:border-red-700 shrink-0"></span>
          Reserva aprobada
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-800/60 border border-amber-300 dark:border-amber-700 shrink-0"></span>
          Solicitud pendiente
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 shrink-0"></span>
          Libre — toca para reservar
        </div>
      </div>
    </div>

    <!-- ── Error ──────────────────────────────────────────────────────────── -->
    <div v-if="error" class="mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </div>

    <!-- ── Loading skeleton ───────────────────────────────────────────────── -->
    <div v-if="loading && !classrooms.length" class="space-y-6">
      <div v-for="i in 2" :key="i" class="animate-pulse rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div class="h-10 bg-gray-300 dark:bg-gray-700"></div>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <tbody>
              <tr v-for="j in 6" :key="j">
                <td v-for="k in 7" :key="k" class="border border-gray-100 dark:border-gray-800 p-3">
                  <div class="h-4 rounded" :class="Math.random() > 0.6 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'"></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── Classrooms grids ───────────────────────────────────────────────── -->
    <div v-else class="space-y-6">

      <!-- No results -->
      <div v-if="filteredClassrooms.length === 0 && !loading"
        class="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-20 px-6 text-center">
        <svg class="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
        </svg>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          {{ classrooms.length === 0 ? 'Cargando aulas...' : 'No hay aulas que coincidan con el filtro.' }}
        </p>
        <button v-if="classroomFilter" @click="classroomFilter = ''"
          class="mt-2 text-xs text-red-500 hover:text-red-600 underline">
          Limpiar filtro
        </button>
      </div>

      <!-- One section per classroom (like PDF pages) -->
      <div v-for="classroom in filteredClassrooms" :key="classroom.classroomId" class="classroom-section rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">

        <!-- Classroom header (dark, like PDF) -->
        <div class="flex items-center justify-between px-4 py-2.5 bg-gray-800 dark:bg-gray-950">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
            </svg>
            <span class="text-sm font-bold text-white tracking-wide">AULA {{ classroom.code }}</span>
          </div>
          <span class="text-xs text-gray-400">Capacidad: {{ classroom.capacity }} personas</span>
        </div>

        <!-- Schedule grid table -->
        <div class="overflow-x-auto bg-white dark:bg-gray-900">
          <table class="w-full border-collapse text-xs" style="min-width: 640px;">
            <!-- Day headers -->
            <thead>
              <tr class="bg-gray-100 dark:bg-gray-800">
                <th class="sticky left-0 z-20 border border-gray-200 dark:border-gray-700 px-2 py-2.5 text-center font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16 whitespace-nowrap bg-gray-100 dark:bg-gray-800">
                  HORA
                </th>
                <th v-for="(dayName, di) in DAY_NAMES" :key="di"
                  class="border border-gray-200 dark:border-gray-700 px-2 py-2.5 text-center font-semibold text-gray-700 dark:text-gray-300 min-w-28">
                  <div>{{ dayName }}</div>
                  <div class="text-[10px] font-normal text-gray-400 dark:text-gray-500 mt-0.5">
                    {{ fmtDayDate(weekDates[di]) }}
                    <span v-if="weekDates[di] === todayStr" class="ml-1 text-red-500 font-semibold">● Hoy</span>
                  </div>
                </th>
              </tr>
            </thead>

            <!-- Rows -->
            <tbody>
              <tr v-for="(slot, slotIdx) in TIME_SLOTS" :key="slot.start"
                :class="slot.type === 'break' ? 'bg-orange-50 dark:bg-orange-950/20' : ''">

                <!-- Break (almuerzo) row -->
                <template v-if="slot.type === 'break'">
                  <td colspan="7"
                    class="border border-gray-200 dark:border-gray-700 px-4 py-1.5 text-center font-semibold text-orange-500 dark:text-orange-400 text-[11px] tracking-widest uppercase">
                    ☕ Almuerzo · 12:00 – 13:00
                  </td>
                </template>

                <!-- Normal time slot row -->
                <template v-else>
                  <!-- Time label -->
                  <td class="sticky left-0 z-10 border border-gray-200 dark:border-gray-700 px-1.5 py-1 text-center bg-gray-50 dark:bg-gray-800 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap w-16">
                    <div class="font-semibold text-[11px]">{{ slot.label }}</div>
                    <div class="text-[10px] text-gray-400 dark:text-gray-500">{{ slot.end }}</div>
                  </td>

                  <!-- Day cells (use pre-computed grid) -->
                  <template v-for="(cell, dayIdx) in (classroomGrids[classroom.code]?.[slotIdx] ?? [])" :key="dayIdx">

                    <!-- Event cell (schedule / loan / pending) -->
                    <td v-if="cell.type === 'event'"
                      :rowspan="cell.rowspan"
                      class="border border-gray-200 dark:border-gray-700 px-2 py-1 align-top"
                      :class="{
                        'bg-blue-100 dark:bg-blue-950/50 border-l-2 border-l-blue-400': cell.event?.type === 'schedule',
                        'bg-red-100 dark:bg-red-950/50 border-l-2 border-l-red-400': cell.event?.type === 'loan',
                        'bg-amber-100 dark:bg-amber-950/50 border-l-2 border-l-amber-400': cell.event?.type === 'pending',
                      }">
                      <!-- Professor / requester name -->
                      <p class="font-semibold leading-tight mb-0.5"
                        :class="{
                          'text-blue-800 dark:text-blue-300': cell.event?.type === 'schedule',
                          'text-red-700 dark:text-red-300': cell.event?.type === 'loan',
                          'text-amber-700 dark:text-amber-300': cell.event?.type === 'pending',
                        }">
                        {{ cell.event?.sublabel }}
                      </p>
                      <!-- Course / reason -->
                      <p class="text-[10px] leading-tight"
                        :class="{
                          'text-blue-600 dark:text-blue-400': cell.event?.type === 'schedule',
                          'text-red-500 dark:text-red-400': cell.event?.type === 'loan',
                          'text-amber-600 dark:text-amber-400': cell.event?.type === 'pending',
                        }">
                        {{ cell.event?.label }}
                      </p>
                      <!-- Time range -->
                      <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono">
                        {{ cell.event?.start }} – {{ cell.event?.end }}
                      </p>
                      <!-- Type badge -->
                      <span v-if="cell.event?.type === 'pending'"
                        class="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 dark:bg-amber-800/40 text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                        Pendiente
                      </span>
                    </td>

                    <!-- Free cell (clickable → booking) -->
                    <td v-else-if="cell.type === 'free'"
                      class="border border-gray-200 dark:border-gray-700 cursor-pointer group transition-colors hover:bg-green-50 dark:hover:bg-green-950/30"
                      :title="`Reservar Aula ${classroom.code} el ${fmtDayDate(cell.date!)} de ${slot.label} a ${slot.end}`"
                      @click="goBook(classroom.code, cell.date!, slot.start, slot.end)">
                      <div class="min-h-10 flex flex-col items-center justify-center gap-0.5 px-1">
                        <svg class="w-4 h-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <span class="text-[10px] text-green-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Reservar
                        </span>
                      </div>
                    </td>

                    <!-- Continuation: no <td> — parent rowspan covers this slot -->

                  </template>
                </template>

              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Print title (only visible in print) -->
      <div class="hidden print:block text-center text-sm text-gray-500 mt-4">
        Horario generado el {{ new Date().toLocaleDateString('es-CR') }} · SIPAUNA
      </div>

    </div>
  </div>
</template>
