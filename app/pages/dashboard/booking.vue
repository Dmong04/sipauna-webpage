<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()

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

// ── State ─────────────────────────────────────────────────────────────────────
const classrooms  = ref<Classroom[]>([])
const loadingData = ref(false)
const globalError = ref('')

const form = reactive<LoanForm>({
  classroomCode: '',
  date: '',
  startTime: '',
  endTime: '',
  reason: '',
})
const formError   = ref('')
const formSuccess = ref('')
const submitting  = ref(false)

const today = new Date().toISOString().split('T')[0]

// Pre-fill from query params (comes from availability page)
onMounted(async () => {
  const q = useRoute().query
  if (q.code)  form.classroomCode = String(q.code)
  if (q.date)  form.date          = String(q.date)
  if (q.start) form.startTime     = String(q.start)
  if (q.end)   form.endTime       = String(q.end)

  loadingData.value = true
  try {
    const res = await GqlGetClassrooms()
    classrooms.value = res.classrooms ?? []
  } catch {
    globalError.value = 'Error al cargar las aulas. Intentá de nuevo.'
  } finally {
    loadingData.value = false
  }
})

// ── Form ──────────────────────────────────────────────────────────────────────

function validateForm(): string | null {
  if (!form.classroomCode) return 'Seleccioná un aula.'
  if (!form.date) return 'Seleccioná una fecha.'
  if (!form.startTime) return 'Ingresá la hora de inicio.'
  if (!form.endTime) return 'Ingresá la hora de fin.'
  if (form.startTime >= form.endTime) return 'La hora de inicio debe ser anterior a la hora de fin.'
  if (form.reason.trim().length < 10) return 'El motivo debe tener al menos 10 caracteres.'
  return null
}

async function submitBooking() {
  formError.value   = ''
  formSuccess.value = ''

  const err = validateForm()
  if (err) { formError.value = err; return }
  if (!auth.user) return

  submitting.value = true
  try {
    await GqlCreateLoan({
      classroomCode: form.classroomCode,
      userId:        auth.user.userId,
      loanDate:      form.date,
      startTime:     form.startTime,
      endTime:       form.endTime,
      reason:        form.reason.trim(),
    })

    formSuccess.value = '¡Solicitud enviada! Quedá pendiente de aprobación.'
    form.classroomCode = ''
    form.date          = ''
    form.startTime     = ''
    form.endTime       = ''
    form.reason        = ''
  } catch (e: any) {
    formError.value = e?.gqlErrors?.[0]?.message ?? 'No se pudo enviar la solicitud. Intentá de nuevo.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="m-4 min-h-[60vh] **:transition-colors **:duration-300">

    <!-- Global error -->
    <div v-if="globalError" role="alert"
      class="mx-2 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {{ globalError }}
    </div>

    <div class="max-w-lg mx-auto">

      <!-- Page header -->
      <div class="mb-5 mx-2">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Nueva solicitud de reserva</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Completá todos los campos para enviar tu solicitud.
        </p>
      </div>

      <!-- Card -->
      <div class="mx-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-md overflow-hidden">

        <!-- Card header -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-800 dark:text-gray-100">Datos de la reserva</h2>
          <NuxtLink to="/dashboard/my-bookings"
            class="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Ver mis solicitudes
          </NuxtLink>
        </div>

        <!-- Form body -->
        <div class="px-6 py-5">

          <!-- Alerts -->
          <div v-if="formError" role="alert"
            class="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
            <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {{ formError }}
          </div>

          <div v-if="formSuccess" role="status"
            class="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
            <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ formSuccess }}
            <NuxtLink to="/dashboard/my-bookings"
              class="ml-auto underline text-green-700 dark:text-green-300 hover:no-underline whitespace-nowrap">
              Ver mis solicitudes →
            </NuxtLink>
          </div>

          <!-- Classroom select -->
          <div class="mb-4">
            <label for="booking-classroom"
              class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Aula <span class="text-red-500">*</span>
            </label>
            <select id="booking-classroom" v-model="form.classroomCode" :disabled="loadingData"
              class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent disabled:opacity-50 transition-colors">
              <option value="" disabled>
                {{ loadingData ? 'Cargando aulas...' : 'Seleccioné un aula' }}
              </option>
              <option v-for="c in classrooms" :key="c.classroomId" :value="c.code">
                Aula {{ c.code }} (cap. {{ c.capacity }})
              </option>
            </select>
          </div>

          <!-- Date -->
          <div class="mb-4">
            <label for="booking-date"
              class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Fecha <span class="text-red-500">*</span>
            </label>
            <input id="booking-date" v-model="form.date" type="date" :min="today" autocomplete="off"
              class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:dark:invert" />
          </div>

          <!-- Time range -->
          <div class="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label for="booking-start"
                class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Hora inicio <span class="text-red-500">*</span>
              </label>
              <input id="booking-start" v-model="form.startTime" type="time" autocomplete="off"
                class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
            </div>
            <div>
              <label for="booking-end"
                class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Hora fin <span class="text-red-500">*</span>
              </label>
              <input id="booking-end" v-model="form.endTime" type="time" autocomplete="off"
                class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
            </div>
          </div>

          <!-- Reason -->
          <div class="mb-5">
            <label for="booking-reason"
              class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Motivo <span class="text-red-500">*</span>
              <span class="text-gray-400 font-normal normal-case ml-1">(mín. 10 caracteres)</span>
            </label>
            <textarea id="booking-reason" v-model="form.reason" rows="4" maxlength="300"
              placeholder="Describí el motivo de la reservación..."
              class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors"></textarea>
            <p class="text-right text-xs text-gray-400 mt-1">{{ form.reason.length }}/300</p>
          </div>

          <!-- Submit -->
          <button @click="submitBooking" :disabled="submitting || loadingData"
            class="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all">
            <svg v-if="submitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {{ submitting ? 'Enviando...' : 'Enviar solicitud' }}
          </button>
        </div>
      </div>

      <!-- Link to history -->
      <div class="mt-4 mx-2 text-center">
        <NuxtLink to="/dashboard/my-bookings"
          class="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Ver historial de mis solicitudes
        </NuxtLink>
      </div>

    </div>
  </section>
</template>
