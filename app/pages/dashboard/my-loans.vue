<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

type LoanStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO'

interface Loan {
  loanId: string
  classroomCode: string
  userId: string
  requesterName: string
  loanDate: string
  startTime: string
  endTime: string
  reason: string
  status: LoanStatus
}

const STATUS_LABELS: Record<LoanStatus, string> = {
  PENDIENTE: 'En espera',
  APROBADO: 'Aprobada',
  RECHAZADO: 'Rechazada',
  CANCELADO: 'Cancelada',
}

const STATUS_CLASSES: Record<LoanStatus, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  APROBADO:  'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  RECHAZADO: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  CANCELADO: 'bg-gray-100   text-gray-500   dark:bg-gray-700/50   dark:text-gray-400',
}

const STATUS_ICON: Record<LoanStatus, string> = {
  PENDIENTE: '🕐',
  APROBADO:  '✅',
  RECHAZADO: '❌',
  CANCELADO: '⚫',
}

const auth = useAuthStore()

const loans = ref<Loan[]>([])
const loading = ref(false)
const error = ref('')

// ── Filtering ─────────────────────────────────────────────────────────────────
const filterStatus = ref<'ALL' | LoanStatus>('ALL')

const filtered = computed(() => {
  if (filterStatus.value === 'ALL') return loans.value
  return loans.value.filter(l => l.status === filterStatus.value)
})

// ── Pagination ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8
const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paginated = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

// Reset page when filter changes
watch(filterStatus, () => { page.value = 1 })

// ── Stats ─────────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  total: loans.value.length,
  pendiente: loans.value.filter(l => l.status === 'PENDIENTE').length,
  aprobado:  loans.value.filter(l => l.status === 'APROBADO').length,
  rechazado: loans.value.filter(l => l.status === 'RECHAZADO').length,
}))

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  error.value = ''
  page.value = 1

  try {
    const result = await GqlGetLoansByUser({ userId: auth.user!.userId })
    loans.value = result.loansByUser ?? []
  } catch (e: any) {
    error.value = e?.gqlErrors?.[0]?.message ?? 'Error al cargar las solicitudes.'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

// ── Format helpers ────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('es-CR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })
}
</script>

<template>
  <section class="m-4 min-h-[60vh] **:transition-colors **:duration-200">

    <!-- ── Page header ────────────────────────────────────────────────────── -->
    <div class="mx-2 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Mis solicitudes</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Historial de todas tus solicitudes de reservación de aula.
        </p>
      </div>
      <NuxtLink to="/dashboard/booking"
        class="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 active:scale-[.98] text-white text-sm font-semibold transition-all">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Nueva reserva
      </NuxtLink>
    </div>

    <!-- ── Error ──────────────────────────────────────────────────────────── -->
    <div v-if="error" role="alert"
      class="mx-2 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </div>

    <!-- ── Stats row ──────────────────────────────────────────────────────── -->
    <div v-if="!loading" class="mx-2 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
        <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Total</p>
        <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ stats.total }}</p>
      </div>
      <div class="rounded-xl border border-yellow-200 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-3 shadow-sm">
        <p class="text-xs text-yellow-600 dark:text-yellow-400 uppercase tracking-wide mb-0.5">En espera</p>
        <p class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{{ stats.pendiente }}</p>
      </div>
      <div class="rounded-xl border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-950/20 px-4 py-3 shadow-sm">
        <p class="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide mb-0.5">Aprobadas</p>
        <p class="text-2xl font-bold text-green-700 dark:text-green-300">{{ stats.aprobado }}</p>
      </div>
      <div class="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 px-4 py-3 shadow-sm">
        <p class="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide mb-0.5">Rechazadas</p>
        <p class="text-2xl font-bold text-red-700 dark:text-red-300">{{ stats.rechazado }}</p>
      </div>
    </div>

    <!-- ── Main card ──────────────────────────────────────────────────────── -->
    <div class="mx-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-md overflow-hidden">

      <!-- Card header with filter tabs -->
      <div class="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 text-xs font-medium">
          <button v-for="opt in [
            { key: 'ALL', label: 'Todas' },
            { key: 'PENDIENTE', label: 'En espera' },
            { key: 'APROBADO', label: 'Aprobadas' },
            { key: 'RECHAZADO', label: 'Rechazadas' },
          ]" :key="opt.key"
            @click="filterStatus = opt.key as any"
            :class="['px-3 py-1.5 rounded-md transition-colors', filterStatus === opt.key
              ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200']">
            {{ opt.label }}
          </button>
        </div>

        <button @click="loadData" :disabled="loading"
          class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50">
          <svg :class="['w-3.5 h-3.5', loading && 'animate-spin']" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="p-6 space-y-3 animate-pulse">
        <div v-for="n in 5" :key="n" class="flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div class="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div class="h-3 bg-gray-100 dark:bg-gray-700/60 rounded w-48"></div>
            <div class="h-3 bg-gray-100 dark:bg-gray-700/60 rounded w-64"></div>
          </div>
          <div class="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full self-start shrink-0"></div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="filtered.length === 0"
        class="py-20 flex flex-col items-center justify-center text-center px-6">
        <div class="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <svg class="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
          {{ filterStatus === 'ALL' ? 'Aún no tienes solicitudes.' : `No hay solicitudes ${STATUS_LABELS[filterStatus as LoanStatus]?.toLowerCase()}.` }}
        </p>
        <NuxtLink v-if="filterStatus === 'ALL'" to="/dashboard/booking"
          class="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline">
          Hacer tu primera solicitud →
        </NuxtLink>
        <button v-else @click="filterStatus = 'ALL'"
          class="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors">
          Ver todas
        </button>
      </div>

      <!-- Loan list -->
      <ul v-else class="divide-y divide-gray-100 dark:divide-white/5">
        <li v-for="loan in paginated" :key="loan.loanId"
          class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">

          <!-- Icon / status indicator -->
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
            :class="{
              'bg-yellow-100 dark:bg-yellow-900/30': loan.status === 'PENDIENTE',
              'bg-green-100  dark:bg-green-900/30':  loan.status === 'APROBADO',
              'bg-red-100    dark:bg-red-900/30':    loan.status === 'RECHAZADO',
              'bg-gray-100   dark:bg-gray-800':      loan.status === 'CANCELADO',
            }">
            {{ STATUS_ICON[loan.status] }}
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Aula {{ loan.classroomCode }}
              </span>
              <span class="text-xs text-gray-400 dark:text-gray-500">·</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ fmtDate(loan.loanDate) }}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              🕐 {{ loan.startTime }} – {{ loan.endTime }}
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-sm" :title="loan.reason">
              {{ loan.reason }}
            </p>
          </div>

          <!-- Status badge -->
          <span :class="STATUS_CLASSES[loan.status]"
            class="self-start sm:self-auto shrink-0 text-xs font-semibold px-3 py-1 rounded-full">
            {{ STATUS_LABELS[loan.status] }}
          </span>
        </li>
      </ul>

      <!-- Pagination footer -->
      <div v-if="!loading && filtered.length > 0"
        class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-white/10 flex flex-col items-center gap-2">

        <div v-if="totalPages > 1"
          class="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-full px-2 py-1.5 shadow-sm">

          <button @click="page--" :disabled="page === 1"
            class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <template v-for="p in totalPages" :key="p">
            <button v-if="p === 1 || p === totalPages || Math.abs(p - page) <= 1"
              @click="page = p"
              :class="['min-w-7 h-7 px-2 rounded-full text-xs font-semibold transition-all',
                p === page
                  ? 'bg-red-500 text-white shadow-sm scale-105'
                  : 'text-gray-500 hover:bg-red-50 hover:text-red-500 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400']">
              {{ p }}
            </button>
            <span v-else-if="p === page - 2 || p === page + 2"
              class="w-7 text-center text-xs text-gray-300 dark:text-gray-600">…</span>
          </template>

          <button @click="page++" :disabled="page === totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <span class="text-xs text-gray-400 dark:text-gray-500">
          {{ filtered.length }} solicitud{{ filtered.length !== 1 ? 'es' : '' }}
          {{ filterStatus !== 'ALL' ? `(${STATUS_LABELS[filterStatus as LoanStatus]?.toLowerCase()})` : '' }}
        </span>
      </div>
    </div>

  </section>
</template>
