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

interface Classroom {
  classroomId: string
  code: string
  capacity: number
}

interface LoanForm {
  classroomCode: string
  date: string
  startTime: string
  endTime: string
  reason: string
}

const STATUS_LABELS: Record<LoanStatus, string> = {
  PENDIENTE: 'En espera',
  APROBADO: 'Aprobada',
  RECHAZADO: 'Rechazada',
  CANCELADO: 'Cancelada',
}

const STATUS_CLASSES: Record<LoanStatus, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  APROBADO: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  RECHAZADO: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  CANCELADO: 'bg-gray-100   text-gray-500   dark:bg-gray-700/50   dark:text-gray-400',
}

const auth = useAuthStore()
const isAdmin = computed(() => auth.user?.roleName === 'admin')

// ── Estado compartido ──
const bookings = ref<Loan[]>([])
const classrooms = ref<Classroom[]>([])
const loadingData = ref(false)
const globalError = ref('')

// ── Estado del formulario (solo rol no-admin) ──
const form = reactive<LoanForm>({
  classroomCode: '',
  date: '',
  startTime: '',
  endTime: '',
  reason: '',
})
const formError = ref('')
const formSuccess = ref('')
const submitting = ref(false)

// ── Estado de acciones admin ──
const updatingId = ref<string | null>(null)

// ── Paginación ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 10
const adminPage = ref(1)
const userPage = ref(1)

const adminTotalPages = computed(() => Math.max(1, Math.ceil(bookings.value.length / PAGE_SIZE)))
const userTotalPages = computed(() => Math.max(1, Math.ceil(bookings.value.length / PAGE_SIZE)))

const adminPaginated = computed(() => {
  const start = (adminPage.value - 1) * PAGE_SIZE
  return bookings.value.slice(start, start + PAGE_SIZE)
})

const userPaginated = computed(() => {
  const start = (userPage.value - 1) * PAGE_SIZE
  return bookings.value.slice(start, start + PAGE_SIZE)
})

// Fecha mínima = hoy
const today = new Date().toISOString().split('T')[0]

onMounted(() => {
  const q = useRoute().query
  if (q.code) form.classroomCode = String(q.code)
  if (q.date) form.date = String(q.date)
  if (q.start) form.startTime = String(q.start)
  if (q.end) form.endTime = String(q.end)
})

async function fetchData() {
  globalError.value = ''
  loadingData.value = true
  adminPage.value = 1
  userPage.value = 1

  try {
    const [classroomsResult, loansResult] = await Promise.all([
      GqlGetClassrooms(),
      isAdmin.value
        ? GqlGetLoans()
        : GqlGetLoansByUser({ userId: auth.user!.userId }),
    ])

    classrooms.value = classroomsResult.classrooms ?? []
    bookings.value = (isAdmin.value
      ? (loansResult as Awaited<ReturnType<typeof GqlGetLoans>>).loans
      : (loansResult as Awaited<ReturnType<typeof GqlGetLoansByUser>>).loansByUser
    ) ?? [] as Loan[]

  } catch {
    globalError.value = 'Error al cargar los datos. Intente nuevamente.'
  } finally {
    loadingData.value = false
  }
}

function validateForm(): string | null {
  if (!form.classroomCode) return 'Seleccione un aula.'
  if (!form.date) return 'Seleccione una fecha.'
  if (!form.startTime) return 'Ingrese la hora de inicio.'
  if (!form.endTime) return 'Ingrese la hora de fin.'
  if (form.startTime >= form.endTime)
    return 'La hora de inicio debe ser anterior a la hora de fin.'
  if (form.reason.trim().length < 10)
    return 'El motivo debe tener al menos 10 caracteres.'
  return null
}

async function submitBooking() {
  formError.value = ''
  formSuccess.value = ''

  const validationError = validateForm()
  if (validationError) { formError.value = validationError; return }
  if (!auth.user) return

  submitting.value = true
  try {
    await GqlCreateLoan({
      classroomCode: form.classroomCode,
      userId: auth.user.userId,
      loanDate: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      reason: form.reason.trim(),
    })

    formSuccess.value = 'Solicitud enviada. Queda en espera de aprobación.'
    form.classroomCode = ''
    form.date = ''
    form.startTime = ''
    form.endTime = ''
    form.reason = ''

    await fetchData()
  } catch {
    formError.value = 'No se pudo enviar la solicitud. Intente nuevamente.'
  } finally {
    submitting.value = false
  }
}

async function updateStatus(loanId: string, status: LoanStatus) {
  updatingId.value = loanId
  try {
    await GqlUpdateLoanStatus({ loanId, status })
    const loan = bookings.value.find(b => b.loanId === loanId)
    if (loan) loan.status = status
  } catch {
    globalError.value = 'No se pudo actualizar el estado.'
  } finally {
    updatingId.value = null
  }
}

onMounted(fetchData)
</script>

<template>
  <section class="m-4 min-h-[60vh] **:transition-colors **:duration-300">

    <!-- Error global -->
    <div v-if="globalError" role="alert"
      class="mx-2 mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {{ globalError }}
    </div>

    <!-- ═══════════════════════════════════════
         VISTA: DOCENTE / ESTUDIANTE
         ═══════════════════════════════════════ -->
    <template v-if="!isAdmin">
      <div class="flex flex-col lg:flex-row gap-4">

        <!-- Formulario -->
        <div
          class="shadow-md rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 p-6 w-full lg:w-96 shrink-0">
          <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1">Nueva solicitud</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-5">Completa todos los campos para enviar tu solicitud de
            reservación.</p>

          <div v-if="formError" role="alert"
            class="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {{ formError }}
          </div>
          <div v-if="formSuccess" role="status"
            class="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 text-xs text-green-600 dark:text-green-400">
            {{ formSuccess }}
          </div>

          <div class="mb-4">
            <label for="booking-classroom" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Aula <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <select id="booking-classroom" v-model="form.classroomCode"
              class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors">
              <option value="" disabled>Seleccione un aula</option>
              <option v-for="c in classrooms" :key="c.classroomId" :value="c.code">
                Aula {{ c.code }} (cap. {{ c.capacity }})
              </option>
            </select>
          </div>

          <div class="mb-4">
            <label for="booking-date" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input id="booking-date" v-model="form.date" type="date" :min="today" autocomplete="off"
              class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
          </div>

          <div class="mb-4 flex gap-3">
            <div class="flex-1">
              <label for="booking-start" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora inicio <span class="text-red-500" aria-hidden="true">*</span>
              </label>
              <input id="booking-start" v-model="form.startTime" type="time" autocomplete="off"
                class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
            </div>
            <div class="flex-1">
              <label for="booking-end" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora fin <span class="text-red-500" aria-hidden="true">*</span>
              </label>
              <input id="booking-end" v-model="form.endTime" type="time" autocomplete="off"
                class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
            </div>
          </div>

          <div class="mb-5">
            <label for="booking-reason" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo <span class="text-red-500" aria-hidden="true">*</span>
              <span class="text-gray-400 font-normal ml-1">(mín. 10 caracteres)</span>
            </label>
            <textarea id="booking-reason" v-model="form.reason" rows="3" maxlength="300"
              placeholder="Describe el motivo de la reservación..."
              class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 resize-none" />
            <p class="text-right text-xs text-gray-400 mt-0.5" aria-live="polite">{{ form.reason.length }}/300</p>
          </div>

          <button @click="submitBooking" :disabled="submitting || loadingData"
            class="w-full bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-md transition-all duration-150">
            {{ submitting ? 'Enviando...' : 'Enviar solicitud' }}
          </button>
        </div>

        <!-- Mis solicitudes -->
        <div
          class="flex-1 shadow-md rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 dark:border-white/10">
            <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">Mis solicitudes</h2>
          </div>

          <!-- Skeleton -->
          <div v-if="loadingData" class="p-6 space-y-3 animate-pulse">
            <div v-for="n in PAGE_SIZE" :key="n" class="h-16 bg-gray-100 dark:bg-gray-800 rounded-md" />
          </div>

          <!-- Sin solicitudes -->
          <div v-else-if="bookings.length === 0" class="p-10 text-center text-sm text-gray-400 dark:text-gray-500">
            No has realizado solicitudes aún.
          </div>

          <!-- Lista paginada -->
          <template v-else>
            <ul class="divide-y divide-gray-100 dark:divide-white/5">
              <li v-for="b in userPaginated" :key="b.loanId"
                class="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-100">Aula {{ b.classroomCode }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ b.loanDate }} · {{ b.startTime }}–{{ b.endTime }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-xs">{{ b.reason }}</p>
                </div>
                <span :class="STATUS_CLASSES[b.status]"
                  class="self-start sm:self-auto shrink-0 text-xs font-medium px-2.5 py-1 rounded-full">
                  {{ STATUS_LABELS[b.status] }}
                </span>
              </li>
            </ul>

            <!-- Footer paginación usuario -->
            <div v-if="userTotalPages > 1" class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-white/10
                     flex flex-col items-center gap-2">
              <div class="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10
                          rounded-full px-2 py-1.5 shadow-sm">

                <button @click="userPage = 1" :disabled="userPage === 1" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                         hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                         transition-colors" title="Primera página">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
                  </svg>
                </button>

                <button @click="userPage--" :disabled="userPage === 1" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                         hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                         transition-colors" title="Página anterior">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

                <template v-for="page in userTotalPages" :key="page">
                  <button v-if="page === 1 || page === userTotalPages || Math.abs(page - userPage) <= 1"
                    @click="userPage = page" :class="[
                      'min-w-7 h-7 px-2 rounded-full text-xs font-semibold transition-all duration-150',
                      page === userPage
                        ? 'bg-red-500 text-white shadow-sm shadow-red-200 dark:shadow-red-900/40 scale-105'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                    ]">
                    {{ page }}
                  </button>
                  <span v-else-if="page === userPage - 2 || page === userPage + 2"
                    class="w-7 text-center text-xs text-gray-300 dark:text-gray-600 select-none">…</span>
                </template>

                <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

                <button @click="userPage++" :disabled="userPage === userTotalPages" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                         hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                         transition-colors" title="Página siguiente">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button @click="userPage = userTotalPages" :disabled="userPage === userTotalPages" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                         hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                         disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                         transition-colors" title="Última página">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
                  </svg>
                </button>

              </div>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                {{ (userPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(userPage * PAGE_SIZE, bookings.length) }}
                de {{ bookings.length }} solicitud{{ bookings.length !== 1 ? 'es' : '' }}
              </span>
            </div>

            <!-- Conteo simple si solo hay una página -->
            <div v-else
              class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-white/10 text-xs text-gray-400 dark:text-gray-500">
              {{ bookings.length }} solicitud{{ bookings.length !== 1 ? 'es' : '' }}
            </div>
          </template>
        </div>

      </div>
    </template>

    <!-- ════════════════════════════
         VISTA: ADMINISTRADOR
         ════════════════════════════ -->
    <template v-else>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 mx-2">
        <div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Solicitudes de reservación</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Revisa y gestiona todas las solicitudes.</p>
        </div>
        <button @click="fetchData" :disabled="loadingData"
          class="self-start sm:self-auto flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-md transition-all duration-150">
          <svg v-if="loadingData" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {{ loadingData ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>

      <div class="mx-2 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-white/10">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs tracking-wide">
              <tr>
                <th class="px-4 py-3 text-left">Solicitante</th>
                <th class="px-4 py-3 text-left">Aula</th>
                <th class="px-4 py-3 text-left">Fecha</th>
                <th class="px-4 py-3 text-left">Horario</th>
                <th class="px-4 py-3 text-left">Motivo</th>
                <th class="px-4 py-3 text-left">Estado</th>
                <th class="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-white/5">

              <tr v-if="loadingData" v-for="n in PAGE_SIZE" :key="n" class="animate-pulse">
                <td colspan="7" class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </td>
              </tr>

              <tr v-else-if="bookings.length === 0">
                <td colspan="7" class="px-4 py-10 text-center text-gray-400 dark:text-gray-500">
                  No hay solicitudes registradas.
                </td>
              </tr>

              <tr v-else v-for="b in adminPaginated" :key="b.loanId"
                class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td class="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium whitespace-nowrap">
                  {{ b.requesterName }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-block bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-mono px-2 py-0.5 rounded">
                    {{ b.classroomCode }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ b.loanDate }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {{ b.startTime }}–{{ b.endTime }}
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate" :title="b.reason">
                  {{ b.reason }}
                </td>
                <td class="px-4 py-3">
                  <span :class="STATUS_CLASSES[b.status]"
                    class="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                    {{ STATUS_LABELS[b.status] }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1.5">
                    <button v-if="b.status !== 'APROBADO'" @click="updateStatus(b.loanId, 'APROBADO')"
                      :disabled="updatingId === b.loanId"
                      class="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 active:scale-95 disabled:opacity-40 transition-all duration-150">
                      Aprobar
                    </button>
                    <button v-if="b.status !== 'RECHAZADO'" @click="updateStatus(b.loanId, 'RECHAZADO')"
                      :disabled="updatingId === b.loanId"
                      class="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 active:scale-95 disabled:opacity-40 transition-all duration-150">
                      Rechazar
                    </button>
                    <svg v-if="updatingId === b.loanId" class="animate-spin h-3.5 w-3.5 text-gray-400" fill="none"
                      viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        <!-- Footer paginación admin -->
        <div v-if="!loadingData && bookings.length > 0" class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-white/10
                 flex flex-col items-center gap-2">

          <div v-if="adminTotalPages > 1" class="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10
                   rounded-full px-2 py-1.5 shadow-sm">

            <button @click="adminPage = 1" :disabled="adminPage === 1" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                     hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                     transition-colors" title="Primera página">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
              </svg>
            </button>

            <button @click="adminPage--" :disabled="adminPage === 1" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                     hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                     transition-colors" title="Página anterior">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

            <template v-for="page in adminTotalPages" :key="page">
              <button v-if="page === 1 || page === adminTotalPages || Math.abs(page - adminPage) <= 1"
                @click="adminPage = page" :class="[
                  'min-w-7 h-7 px-2 rounded-full text-xs font-semibold transition-all duration-150',
                  page === adminPage
                    ? 'bg-red-500 text-white shadow-sm shadow-red-200 dark:shadow-red-900/40 scale-105'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                ]">
                {{ page }}
              </button>
              <span v-else-if="page === adminPage - 2 || page === adminPage + 2"
                class="w-7 text-center text-xs text-gray-300 dark:text-gray-600 select-none">…</span>
            </template>

            <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

            <button @click="adminPage++" :disabled="adminPage === adminTotalPages" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                     hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                     transition-colors" title="Página siguiente">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button @click="adminPage = adminTotalPages" :disabled="adminPage === adminTotalPages" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                     hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                     transition-colors" title="Última página">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
              </svg>
            </button>

          </div>

          <span class="text-xs text-gray-400 dark:text-gray-500">
            {{ adminTotalPages > 1
              ? `${(adminPage - 1) * PAGE_SIZE + 1}–${Math.min(adminPage * PAGE_SIZE, bookings.length)} de `
              : '' }}{{ bookings.length }} solicitud{{ bookings.length !== 1 ? 'es' : '' }}
          </span>
        </div>
      </div>

    </template>

  </section>
</template>