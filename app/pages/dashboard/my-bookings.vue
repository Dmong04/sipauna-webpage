<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()

type LoanStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO'

interface Loan {
  loanId:        string
  classroomCode: string
  loanDate:      string
  startTime:     string
  endTime:       string
  reason:        string
  status:        LoanStatus
}

const loans   = ref<Loan[]>([])
const loading = ref(false)
const error   = ref('')

// ── Status styles ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<LoanStatus, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  APROBADO:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  RECHAZADO: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELADO: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const STATUS_LABEL: Record<LoanStatus, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO:  'Aprobado',
  RECHAZADO: 'Rechazado',
  CANCELADO: 'Cancelado',
}

const STATUS_BAR: Record<LoanStatus, string> = {
  PENDIENTE: 'bg-amber-400',
  APROBADO:  'bg-green-500',
  RECHAZADO: 'bg-red-500',
  CANCELADO: 'bg-gray-300 dark:bg-gray-600',
}

const STATUS_ICON_BG: Record<LoanStatus, string> = {
  PENDIENTE: 'bg-amber-50 dark:bg-amber-950/30',
  APROBADO:  'bg-green-50 dark:bg-green-950/30',
  RECHAZADO: 'bg-red-50 dark:bg-red-950/30',
  CANCELADO: 'bg-gray-100 dark:bg-gray-800',
}

const STATUS_ICON_COLOR: Record<LoanStatus, string> = {
  PENDIENTE: 'text-amber-600 dark:text-amber-400',
  APROBADO:  'text-green-600 dark:text-green-400',
  RECHAZADO: 'text-red-500 dark:text-red-400',
  CANCELADO: 'text-gray-400 dark:text-gray-500',
}

const CARD_BORDER: Record<LoanStatus, string> = {
  PENDIENTE: 'border-amber-200 dark:border-amber-800/40',
  APROBADO:  'border-green-200 dark:border-green-800/40',
  RECHAZADO: 'border-red-200 dark:border-red-900/50',
  CANCELADO: 'border-gray-200 dark:border-gray-700',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('es-CR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour < 12 ? 'a.m.' : 'p.m.'}`
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function fetchLoans() {
  if (!auth.user?.userId) return
  error.value   = ''
  loading.value = true
  try {
    const res = await GqlGetLoansByUser({ userId: auth.user.userId })
    loans.value = (res.loansByUser ?? []) as Loan[]
  } catch (e: any) {
    error.value = e?.gqlErrors?.[0]?.message ?? 'No se pudieron cargar las reservas.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchLoans)
</script>

<template>
  <div class="m-4 **:transition-colors **:duration-200">

    <!-- Page header -->
    <div class="mx-2 mb-5">
      <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Mis reservas</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
        Seguí el estado de tus solicitudes de préstamo de aulas.
      </p>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="flex flex-col gap-3 mx-2 w-full">
      <div v-for="i in 4" :key="i"
        class="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden animate-pulse">
        <div class="h-0.5 bg-gray-200 dark:bg-gray-700"></div>
        <div class="px-4 py-3.5 flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 shrink-0"></div>
          <div class="flex-1 pt-0.5">
            <div class="flex gap-2 mb-2.5">
              <div class="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
            </div>
            <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-56 mb-1.5"></div>
            <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-40"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error"
      class="mx-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </div>

    <!-- Empty state -->
    <div v-else-if="loans.length === 0"
      class="mx-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center py-20 px-6 text-center">
      <div class="w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
        <svg class="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-600 dark:text-gray-400">No tenés solicitudes todavía</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-5">
        Las reservas que hagas aparecerán acá con su estado.
      </p>
      <NuxtLink to="/dashboard/availability"
        class="text-xs font-semibold px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors">
        Buscar un aula disponible
      </NuxtLink>
    </div>

    <!-- Loan cards -->
    <div v-else class="mx-2 flex flex-col gap-3">
      <div v-for="loan in loans" :key="loan.loanId"
        class="rounded-xl border bg-white dark:bg-gray-900 shadow-sm overflow-hidden"
        :class="CARD_BORDER[loan.status]">

        <!-- Status bar -->
        <div class="h-0.5 w-full" :class="STATUS_BAR[loan.status]"></div>

        <div class="px-4 py-3.5 flex items-start gap-3">

          <!-- Icon -->
          <div class="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
            :class="STATUS_ICON_BG[loan.status]">
            <svg class="w-5 h-5" :class="STATUS_ICON_COLOR[loan.status]"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1.5">
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Aula {{ loan.classroomCode }}
              </span>
              <span class="text-xs font-medium px-2 py-0.5 rounded-full" :class="STATUS_BADGE[loan.status]">
                {{ STATUS_LABEL[loan.status] }}
              </span>
            </div>

            <div class="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="capitalize">{{ fmtDate(loan.loanDate) }}</span>
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
                {{ fmtTime(loan.startTime) }} – {{ fmtTime(loan.endTime) }}
              </span>
            </div>

            <p v-if="loan.reason" class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              <span class="font-medium">Motivo:</span> {{ loan.reason }}
            </p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
