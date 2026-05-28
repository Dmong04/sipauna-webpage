<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// ── Types ─────────────────────────────────────────────────────────────────────

interface BusySlot {
  start:  string
  end:    string
  label:  string
  type:   'schedule' | 'loan' | 'pending'
}

interface ClassroomResult {
  classroomId: string
  code:        string
  capacity:    number
  status:      'free' | 'partial' | 'busy'
  busySlots:   BusySlot[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_MAP: Record<number, string> = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes',
}

// Timeline covers 07:00 – 21:00
const TIMELINE_START = 7 * 60   // 420 min
const TIMELINE_END   = 21 * 60  // 1260 min
const TIMELINE_SPAN  = TIMELINE_END - TIMELINE_START  // 840 min

const HOURS = Array.from({ length: 8 }, (_, i) => 7 + i * 2) // 7,9,11,13,15,17,19,21

// ── State ─────────────────────────────────────────────────────────────────────

const filterDate  = ref('')
const filterStart = ref('')
const filterEnd   = ref('')
const filterCode  = ref('')
const viewMode    = ref<'list' | 'timeline'>('list')

const results   = ref<ClassroomResult[]>([])
const searched  = ref(false)
const loading   = ref(false)
const error     = ref('')

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function overlaps(s1: string, e1: string, s2: string, e2: string) {
  return s1 < e2 && e1 > s2
}

function pct(time: string) {
  return Math.max(0, Math.min(100, (toMin(time) - TIMELINE_START) / TIMELINE_SPAN * 100))
}

function pctWidth(start: string, end: string) {
  const s = Math.max(toMin(start), TIMELINE_START)
  const e = Math.min(toMin(end),   TIMELINE_END)
  return Math.max(0, (e - s) / TIMELINE_SPAN * 100)
}

function fmtTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'a.m.' : 'p.m.'}`
}

const selectedDayName = computed(() => {
  if (!filterDate.value) return ''
  const [y, m, d] = filterDate.value.split('-').map(Number)
  return DAY_MAP[new Date(y, m - 1, d).getDay()] ?? ''
})

const isWeekend = computed(() => filterDate.value && !selectedDayName.value)

const formattedDate = computed(() => {
  if (!filterDate.value) return ''
  const [y, m, d] = filterDate.value.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
})

// ── Search ────────────────────────────────────────────────────────────────────

async function search() {
  error.value = ''
  if (!filterDate.value)  { error.value = 'La fecha es obligatoria.'; return }
  if (!filterStart.value) { error.value = 'La hora de inicio es obligatoria.'; return }
  if (!filterEnd.value)   { error.value = 'La hora de fin es obligatoria.'; return }
  if (filterStart.value >= filterEnd.value) {
    error.value = 'La hora de inicio debe ser anterior a la hora de fin.'; return
  }

  loading.value  = true
  searched.value = false

  try {
    const [classroomsRes, schedulesRes, loansRes] = await Promise.all([
      GqlGetClassrooms(),
      GqlGetSchedules(),
      GqlGetLoans(),
    ])

    const classrooms = classroomsRes.classrooms ?? []
    const schedules  = schedulesRes.schedules   ?? []
    const loans      = loansRes.loans           ?? []
    const dayName    = selectedDayName.value

    const mapped: ClassroomResult[] = classrooms
      .filter(c => !filterCode.value || c.code.toLowerCase().includes(filterCode.value.toLowerCase()))
      .map(c => {
        const busy: BusySlot[] = []

        schedules
          .filter(s => s.classroomCode === c.code && s.day === dayName)
          .forEach(s => busy.push({ start: s.startTime, end: s.endTime, label: `${s.subject} · ${s.teacherName}`, type: 'schedule' }))

        loans
          .filter(l => l.classroomCode === c.code && l.loanDate?.slice(0, 10) === filterDate.value)
          .forEach(l => busy.push({ start: l.startTime, end: l.endTime, label: l.reason, type: l.status === 'APROBADO' ? 'loan' : 'pending' }))

        busy.sort((a, b) => a.start.localeCompare(b.start))

        const confirmed = busy.filter(b => b.type !== 'pending')
        const pending   = busy.filter(b => b.type === 'pending')
        const hasConflict = confirmed.some(b => overlaps(filterStart.value, filterEnd.value, b.start, b.end))
        const hasPending  = pending.some(b =>  overlaps(filterStart.value, filterEnd.value, b.start, b.end))

        const status: ClassroomResult['status'] = hasConflict ? 'busy' : hasPending ? 'partial' : 'free'

        return { classroomId: c.classroomId, code: c.code, capacity: c.capacity, status, busySlots: busy }
      })

    const ORDER = { free: 0, partial: 1, busy: 2 }
    results.value  = mapped.sort((a, b) => ORDER[a.status] - ORDER[b.status])
    searched.value = true
  } catch (e: any) {
    error.value = e?.gqlErrors?.[0]?.message ?? 'Error al consultar la disponibilidad.'
  } finally {
    loading.value = false
  }
}

// ── Booking link ──────────────────────────────────────────────────────────────

function bookingLink(code: string) {
  const q = new URLSearchParams({ code, date: filterDate.value, start: filterStart.value, end: filterEnd.value })
  return `/dashboard/booking?${q}`
}

// ── Status styles ─────────────────────────────────────────────────────────────

const STATUS = {
  free:    { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', bar: 'bg-green-500', label: 'Disponible', dot: 'bg-green-500' },
  partial: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', bar: 'bg-amber-400', label: 'Solicitud pendiente', dot: 'bg-amber-400' },
  busy:    { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         bar: 'bg-red-500',  label: 'Ocupado', dot: 'bg-red-500' },
}

const SLOT_COLOR = {
  schedule: 'bg-blue-500/80',
  loan:     'bg-red-500/80',
  pending:  'bg-amber-400/80',
}

const SLOT_LABEL_COLOR = {
  schedule: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  loan:     'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
  pending:  'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
}

const counts = computed(() => ({
  free:    results.value.filter(r => r.status === 'free').length,
  partial: results.value.filter(r => r.status === 'partial').length,
  busy:    results.value.filter(r => r.status === 'busy').length,
}))
</script>

<template>
  <div class="m-4 **:transition-colors **:duration-200">

    <!-- Page header -->
    <div class="mx-2 mb-5">
      <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Disponibilidad de aulas</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
        Indicá cuándo necesitás el aula y mirá cuáles están libres.
      </p>
    </div>

    <div class="flex flex-col lg:flex-row gap-4 lg:items-start mx-2">

      <!-- ── Filter panel ──────────────────────────────────────────────────── -->
      <aside class="w-full lg:w-64 shrink-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-5">

        <form @submit.prevent="search" class="flex flex-col gap-4">

          <!-- Date -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
              Fecha
            </label>
            <input v-model="filterDate" type="date" required
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-400 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:dark:invert" />
            <p v-if="filterDate && formattedDate" class="mt-1 text-xs text-gray-400 dark:text-gray-500 capitalize">{{ formattedDate }}</p>
            <p v-if="isWeekend" class="mt-1 text-xs text-amber-600 dark:text-amber-400">Fin de semana — sin clases regulares</p>
          </div>

          <!-- Time range -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
              Horario
            </label>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Desde</label>
                <input v-model="filterStart" type="time" required
                  class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
                <input v-model="filterEnd" type="time" required
                  class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>
          </div>

          <!-- Optional classroom filter -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
              Aula <span class="font-normal text-gray-400">(opcional)</span>
            </label>
            <input v-model="filterCode" type="text" placeholder="Ej: A-101"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-gray-400 dark:placeholder-gray-500" />
          </div>

          <p v-if="error" class="text-xs text-red-600 dark:text-red-400 -mt-1">{{ error }}</p>

          <button type="submit" :disabled="loading"
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all">
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            {{ loading ? 'Consultando...' : 'Consultar' }}
          </button>

        </form>

        <!-- Summary -->
        <div v-if="searched" class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Resumen</p>
          <div v-for="(k) in (['free','partial','busy'] as const)" :key="k" class="flex items-center gap-2 text-sm">
            <span class="w-2 h-2 rounded-full shrink-0" :class="STATUS[k].dot"></span>
            <span class="text-gray-600 dark:text-gray-400">{{ STATUS[k].label }}</span>
            <span class="ml-auto font-semibold text-gray-800 dark:text-gray-200">{{ counts[k] }}</span>
          </div>
        </div>

        <!-- Legend -->
        <div v-if="searched" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Referencias</p>
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span class="w-3 h-2.5 rounded-sm bg-blue-500/80 shrink-0"></span> Clase regular
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span class="w-3 h-2.5 rounded-sm bg-red-500/80 shrink-0"></span> Reserva aprobada
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span class="w-3 h-2.5 rounded-sm bg-amber-400/80 shrink-0"></span> Solicitud pendiente
          </div>
        </div>
      </aside>

      <!-- ── Results area ──────────────────────────────────────────────────── -->
      <div class="flex-1 min-w-0">

        <!-- Empty state -->
        <div v-if="!searched && !loading"
          class="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-24 px-6 text-center">
          <div class="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
            <svg class="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Indicá fecha y horario para consultar</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Los resultados mostrarán qué aulas están libres en ese momento.</p>
        </div>

        <!-- Loading skeleton -->
        <div v-else-if="loading" class="flex flex-col gap-3 w-full">
          <div v-for="i in 4" :key="i" class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden animate-pulse">
            <!-- Status bar placeholder -->
            <div class="h-0.5 w-full bg-gray-200 dark:bg-gray-700"></div>
            <div class="px-4 py-3.5 flex items-start gap-3">
              <!-- Icon -->
              <div class="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0"></div>
              <!-- Info lines -->
              <div class="flex-1 min-w-0 pt-0.5">
                <div class="flex items-center gap-2 mb-2.5">
                  <div class="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16"></div>
                  <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20 ml-1"></div>
                </div>
                <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-48"></div>
              </div>
              <!-- Button placeholder (desktop) -->
              <div class="hidden sm:block h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0"></div>
            </div>
          </div>
        </div>

        <!-- Results -->
        <template v-else-if="searched">

          <!-- Toolbar -->
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p class="text-sm text-gray-500 dark:text-gray-400 min-w-0">
              <span class="font-medium text-gray-700 dark:text-gray-300 capitalize">{{ formattedDate }}</span>
              <span class="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
              <span class="whitespace-nowrap">{{ fmtTime(filterStart) }} – {{ fmtTime(filterEnd) }}</span>
            </p>
            <!-- View toggle -->
            <div class="flex shrink-0 items-center rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 text-xs font-medium">
              <button @click="viewMode = 'list'" :class="['px-3 py-1.5 transition-colors', viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400']">
                Lista
              </button>
              <button @click="viewMode = 'timeline'" :class="['px-3 py-1.5 transition-colors', viewMode === 'timeline' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400']">
                Línea de tiempo
              </button>
            </div>
          </div>

          <!-- Empty results -->
          <div v-if="results.length === 0" class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col items-center py-16 text-gray-400">
            <p class="text-sm">No hay aulas que coincidan con el filtro.</p>
          </div>

          <!-- ── LIST VIEW ──────────────────────────────────────────────────── -->
          <div v-else-if="viewMode === 'list'" class="flex flex-col gap-3">
            <div v-for="room in results" :key="room.classroomId"
              class="rounded-xl border bg-white dark:bg-gray-900 shadow-sm overflow-hidden"
              :class="room.status === 'free' ? 'border-gray-200 dark:border-gray-700'
                    : room.status === 'partial' ? 'border-amber-200 dark:border-amber-800/50'
                    : 'border-red-200 dark:border-red-900/50'">

              <!-- Status bar (top edge) -->
              <div class="h-0.5 w-full" :class="STATUS[room.status].bar"></div>

              <div class="px-4 py-3.5">
                <div class="flex items-start gap-3">
                  <!-- Icon -->
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    :class="room.status === 'free' ? 'bg-green-50 dark:bg-green-950/30' : room.status === 'partial' ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-red-50 dark:bg-red-950/30'">
                    <svg class="w-5 h-5"
                      :class="room.status === 'free' ? 'text-green-600 dark:text-green-400' : room.status === 'partial' ? 'text-amber-600 dark:text-amber-400' : 'text-red-500 dark:text-red-400'"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">Aula {{ room.code }}</span>
                      <span class="text-xs text-gray-400 dark:text-gray-500">· {{ room.capacity }} personas</span>
                      <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="STATUS[room.status].badge">
                        {{ STATUS[room.status].label }}
                      </span>
                    </div>

                    <!-- Free message -->
                    <p v-if="room.status === 'free'" class="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Disponible de {{ fmtTime(filterStart) }} a {{ fmtTime(filterEnd) }}
                      <span v-if="room.busySlots.length" class="text-gray-400 dark:text-gray-500 ml-1">(tiene ocupaciones fuera de tu horario)</span>
                    </p>

                    <!-- Busy slots that conflict -->
                    <div v-if="room.status !== 'free' && room.busySlots.length" class="mt-2 flex flex-col gap-1.5">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Conflictos en el horario solicitado:</p>
                      <div v-for="(slot, i) in room.busySlots.filter(s => overlaps(filterStart, filterEnd, s.start, s.end))" :key="i"
                        class="flex items-start gap-2 text-xs rounded-lg border px-3 py-1.5"
                        :class="SLOT_LABEL_COLOR[slot.type]">
                        <span class="font-medium shrink-0">{{ fmtTime(slot.start) }}–{{ fmtTime(slot.end) }}</span>
                        <span class="text-gray-400 shrink-0">·</span>
                        <span class="truncate">{{ slot.label }}</span>
                        <span v-if="slot.type === 'pending'" class="shrink-0 opacity-60">(pendiente)</span>
                      </div>
                    </div>

                    <!-- Non-conflicting slots (info) -->
                    <div v-if="room.busySlots.filter(s => !overlaps(filterStart, filterEnd, s.start, s.end)).length" class="mt-1.5">
                      <p class="text-xs text-gray-400 dark:text-gray-500">
                        +{{ room.busySlots.filter(s => !overlaps(filterStart, filterEnd, s.start, s.end)).length }}
                        ocupación{{ room.busySlots.filter(s => !overlaps(filterStart, filterEnd, s.start, s.end)).length > 1 ? 'es' : '' }}
                        fuera del horario solicitado
                      </p>
                    </div>

                    <!-- Booking CTA (mobile – full width below info) -->
                    <NuxtLink v-if="room.status === 'free'" :to="bookingLink(room.code)"
                      class="sm:hidden mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors active:scale-[.97]">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Reservar
                    </NuxtLink>
                  </div>

                  <!-- Booking CTA (desktop – inline) -->
                  <NuxtLink v-if="room.status === 'free'" :to="bookingLink(room.code)"
                    class="hidden sm:flex shrink-0 self-start items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors active:scale-[.97]">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Reservar
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <!-- ── TIMELINE VIEW ──────────────────────────────────────────────── -->
          <div v-else class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div class="min-w-[560px] bg-white dark:bg-gray-900 overflow-hidden">

              <!-- Hour header -->
              <div class="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                <div class="w-24 shrink-0 px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-r border-gray-200 dark:border-gray-700">
                  Aula
                </div>
                <div class="flex-1 relative" style="height: 32px;">
                  <div v-for="h in HOURS" :key="h"
                    class="absolute top-0 flex flex-col items-center"
                    :style="{ left: `${(h * 60 - TIMELINE_START) / TIMELINE_SPAN * 100}%` }">
                    <span class="text-xs text-gray-400 dark:text-gray-500 -translate-x-1/2 pt-2">{{ h }}:00</span>
                  </div>
                </div>
                <!-- Action column header (sticky) -->
                <div class="w-24 shrink-0 sticky right-0 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60"></div>
              </div>

              <!-- Rows -->
              <div v-for="(room, ri) in results" :key="room.classroomId"
                class="group flex hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                :class="{ 'border-t border-gray-100 dark:border-gray-800': ri > 0 }">

                <!-- Classroom label -->
                <div class="w-24 shrink-0 px-3 py-3 border-r border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                  <div class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="STATUS[room.status].dot"></span>
                    <span class="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{{ room.code }}</span>
                  </div>
                  <span class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{{ room.capacity }} pers.</span>
                </div>

                <!-- Timeline track -->
                <div class="flex-1 relative" style="height: 48px;">

                  <!-- Vertical hour guides -->
                  <div v-for="h in HOURS" :key="h"
                    class="absolute top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-800"
                    :style="{ left: `${(h * 60 - TIMELINE_START) / TIMELINE_SPAN * 100}%` }">
                  </div>

                  <!-- Requested time highlight -->
                  <div v-if="filterStart && filterEnd"
                    class="absolute top-1 bottom-1 rounded bg-green-100 dark:bg-green-950/40 border border-green-300 dark:border-green-800 opacity-60"
                    :style="{ left: `${pct(filterStart)}%`, width: `${pctWidth(filterStart, filterEnd)}%` }">
                  </div>

                  <!-- Busy blocks -->
                  <div v-for="(slot, si) in room.busySlots" :key="si"
                    class="absolute top-2 bottom-2 rounded flex items-center overflow-hidden"
                    :class="SLOT_COLOR[slot.type]"
                    :style="{ left: `${pct(slot.start)}%`, width: `${pctWidth(slot.start, slot.end)}%` }"
                    :title="`${slot.start}–${slot.end} · ${slot.label}`">
                    <span class="text-white text-[10px] font-medium px-1.5 truncate leading-none select-none">
                      {{ slot.label }}
                    </span>
                  </div>

                </div>

                <!-- Action column (sticky) -->
                <div class="w-24 shrink-0 sticky right-0 border-l border-gray-100 dark:border-gray-800 flex items-center justify-center px-2 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-white/[0.02] transition-colors duration-100">
                  <NuxtLink v-if="room.status === 'free'" :to="bookingLink(room.code)"
                    class="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors active:scale-[.97] whitespace-nowrap">
                    <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Reservar
                  </NuxtLink>
                  <span v-else class="text-[10px] text-center text-gray-400 dark:text-gray-500 leading-tight px-1">
                    {{ room.status === 'partial' ? 'Pendiente' : 'Ocupado' }}
                  </span>
                </div>

              </div>

            </div>
          </div>

        </template>
      </div>
    </div>
  </div>
</template>
