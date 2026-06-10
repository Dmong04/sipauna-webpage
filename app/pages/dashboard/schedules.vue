<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

// ── Types ─────────────────────────────────────────────────────────────────────

interface Schedule {
  scheduleId:    string
  classroomCode: string
  day:           string
  startTime:     string
  endTime:       string
  subject:       string
  teacherName:   string
}

interface ModalForm {
  day:             string
  classroomCode:   string
  subject:         string
  professorUserId: string
  startTime:       string
  endTime:         string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const DAY_COLORS: Record<string, string> = {
  'Lunes':     'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  'Martes':    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'Miércoles': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Jueves':    'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
  'Viernes':   'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  'Sábado':    'bg-pink-100   text-pink-700   dark:bg-pink-900/30   dark:text-pink-400',
}

// ── Auth ──────────────────────────────────────────────────────────────────────

const auth    = useAuthStore()
const isAdmin = computed(() => auth.user?.roleName === 'admin')

// ── Schedule list state ───────────────────────────────────────────────────────

const schedules  = ref<Schedule[]>([])
const loading    = ref(false)
const error      = ref('')
const filterDay  = ref('')
const filterCode = ref('')

const PAGE_SIZE   = 10
const currentPage = ref(1)

async function fetchSchedules() {
  error.value   = ''
  loading.value = true
  try {
    const result = await GqlGetSchedules()
    schedules.value = result.schedules ?? []
    currentPage.value = 1
    selected.value = []
  } catch {
    error.value = 'No se pudieron cargar los horarios. Intentá de nuevo.'
  } finally {
    loading.value = false
  }
}

const filtered = computed(() =>
  schedules.value.filter(s => {
    const matchDay  = filterDay.value  ? s.day === filterDay.value : true
    const matchCode = filterCode.value ? s.classroomCode === filterCode.value : true
    return matchDay && matchCode
  })
)

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

watch([filterDay, filterCode], () => {
  currentPage.value = 1
  selected.value = []
})

const availableCodes = computed(() =>
  [...new Set(schedules.value.map(s => s.classroomCode))].sort()
)

// ── Selection ─────────────────────────────────────────────────────────────────

const selected = ref<string[]>([])

function isSelected(id: string) { return selected.value.includes(id) }

function toggleSelect(id: string) {
  const idx = selected.value.indexOf(id)
  if (idx === -1) selected.value.push(id)
  else selected.value.splice(idx, 1)
}

const allPageSelected = computed(() =>
  paginated.value.length > 0 &&
  paginated.value.every(s => selected.value.includes(s.scheduleId))
)

const somePageSelected = computed(() =>
  paginated.value.some(s => selected.value.includes(s.scheduleId)) && !allPageSelected.value
)

function toggleAllPage() {
  const pageIds = paginated.value.map(s => s.scheduleId)
  if (allPageSelected.value) {
    selected.value = selected.value.filter(id => !pageIds.includes(id))
  } else {
    selected.value = [...new Set([...selected.value, ...pageIds])]
  }
}

// ── Modal data (classrooms + professors, lazy loaded) ─────────────────────────

const classroomsModal  = ref<{ classroomId: string; code: string; capacity: number }[]>([])
const professorsModal  = ref<{ userId: string | null; fullName: string }[]>([])
const loadingModalData = ref(false)

const professorsWithAccount = computed(() =>
  professorsModal.value.filter(p => p.userId)
)

async function fetchModalData() {
  if (classroomsModal.value.length && professorsModal.value.length) return
  loadingModalData.value = true
  try {
    const [clsRes, profRes] = await Promise.all([
      GqlGetClassrooms(),
      GqlGetProfessors(),
    ])
    classroomsModal.value = clsRes.classrooms ?? []
    professorsModal.value = (profRes.professors ?? []) as any[]
  } catch {
    // Non-critical — user will see empty selects
  } finally {
    loadingModalData.value = false
  }
}

// ── Create / Edit modal ───────────────────────────────────────────────────────

const showModal      = ref(false)
const modalMode      = ref<'create' | 'edit'>('create')
const editingId      = ref('')
const modalForm      = reactive<ModalForm>({
  day: '', classroomCode: '', subject: '', professorUserId: '', startTime: '', endTime: '',
})
const modalError  = ref('')
const modalSaving = ref(false)

function openCreateModal() {
  modalMode.value = 'create'
  editingId.value = ''
  modalForm.day             = ''
  modalForm.classroomCode   = ''
  modalForm.subject         = ''
  modalForm.professorUserId = ''
  modalForm.startTime       = ''
  modalForm.endTime         = ''
  modalError.value = ''
  fetchModalData()
  showModal.value = true
}

function openEditModal(s: Schedule) {
  modalMode.value           = 'edit'
  editingId.value           = s.scheduleId
  modalForm.day             = s.day
  modalForm.classroomCode   = s.classroomCode
  modalForm.subject         = s.subject
  modalForm.startTime       = s.startTime
  modalForm.endTime         = s.endTime
  modalError.value          = ''
  // Try to match professor by name for pre-selection
  fetchModalData().then(() => {
    const match = professorsWithAccount.value.find(p => p.fullName === s.teacherName)
    modalForm.professorUserId = match?.userId ?? ''
  })
  showModal.value = true
}

function closeModal() { showModal.value = false }

function validateModal(): string | null {
  if (!modalForm.day)           return 'Seleccioná un día.'
  if (!modalForm.classroomCode) return 'Seleccioná un aula.'
  if (!modalForm.subject.trim()) return 'Ingresá el nombre de la materia.'
  if (modalMode.value === 'create' && !modalForm.professorUserId)
    return 'Seleccioná un docente.'
  if (!modalForm.startTime)     return 'Ingresá la hora de inicio.'
  if (!modalForm.endTime)       return 'Ingresá la hora de fin.'
  if (modalForm.startTime >= modalForm.endTime)
    return 'La hora de inicio debe ser anterior a la hora de fin.'
  return null
}

async function saveModal() {
  const err = validateModal()
  if (err) { modalError.value = err; return }

  modalError.value = ''
  modalSaving.value = true
  try {
    if (modalMode.value === 'create') {
      const res = await GqlCreateSchedule({
        classroomCode:   modalForm.classroomCode,
        subject:         modalForm.subject.trim(),
        professorUserId: modalForm.professorUserId,
        day:             modalForm.day,
        startTime:       modalForm.startTime,
        endTime:         modalForm.endTime,
      })
      if (res.createSchedule) schedules.value.unshift(res.createSchedule as Schedule)
    } else {
      const res = await GqlUpdateSchedule({
        scheduleId:      editingId.value,
        classroomCode:   modalForm.classroomCode || undefined,
        subject:         modalForm.subject.trim()  || undefined,
        professorUserId: modalForm.professorUserId || undefined,
        day:             modalForm.day             || undefined,
        startTime:       modalForm.startTime       || undefined,
        endTime:         modalForm.endTime         || undefined,
      })
      if (res.updateSchedule) {
        const idx = schedules.value.findIndex(s => s.scheduleId === editingId.value)
        if (idx !== -1) schedules.value[idx] = res.updateSchedule as Schedule
      }
    }
    closeModal()
  } catch (e: any) {
    modalError.value = e?.gqlErrors?.[0]?.message ?? 'No se pudo guardar el horario.'
  } finally {
    modalSaving.value = false
  }
}

// ── Delete single ─────────────────────────────────────────────────────────────

const showDeleteModal = ref(false)
const deleteTargetId  = ref('')
const deleting        = ref(false)
const deleteError     = ref('')

function confirmDelete(id: string) {
  deleteTargetId.value = id
  deleteError.value    = ''
  showDeleteModal.value = true
}

async function executeDelete() {
  deleting.value = true
  deleteError.value = ''
  try {
    await GqlDeleteSchedule({ scheduleId: deleteTargetId.value })
    schedules.value = schedules.value.filter(s => s.scheduleId !== deleteTargetId.value)
    selected.value  = selected.value.filter(id => id !== deleteTargetId.value)
    showDeleteModal.value = false
  } catch (e: any) {
    deleteError.value = e?.gqlErrors?.[0]?.message ?? 'No se pudo eliminar el horario.'
  } finally {
    deleting.value = false
  }
}

// ── Delete selected (bulk) ────────────────────────────────────────────────────

const showBulkDeleteModal = ref(false)
const bulkDeleting        = ref(false)
const bulkDeleteError     = ref('')

async function executeBulkDelete() {
  bulkDeleting.value = true
  bulkDeleteError.value = ''
  try {
    await GqlDeleteSchedules({ scheduleIds: selected.value })
    const deletedSet = new Set(selected.value)
    schedules.value = schedules.value.filter(s => !deletedSet.has(s.scheduleId))
    selected.value  = []
    showBulkDeleteModal.value = false
  } catch (e: any) {
    bulkDeleteError.value = e?.gqlErrors?.[0]?.message ?? 'No se pudieron eliminar los horarios.'
  } finally {
    bulkDeleting.value = false
  }
}

// ── Clear schedule data ───────────────────────────────────────────────────────

const showClearModal   = ref(false)
const clearConfirmText = ref('')
const clearing         = ref(false)
const clearError       = ref('')
const clearOk          = computed(() => clearConfirmText.value === 'CONFIRMAR')

function openClearModal() {
  clearConfirmText.value = ''
  clearError.value       = ''
  showClearModal.value   = true
}

async function executeClear() {
  if (!clearOk.value) return
  clearing.value   = true
  clearError.value = ''
  try {
    await GqlClearScheduleData()
    schedules.value = []
    selected.value  = []
    currentPage.value = 1
    showClearModal.value = false
  } catch (e: any) {
    clearError.value = e?.gqlErrors?.[0]?.message ?? 'No se pudo limpiar la base de datos.'
  } finally {
    clearing.value = false
  }
}

// ── Import modal ──────────────────────────────────────────────────────────────

const showImportModal = ref(false)
function onImportSuccess() { showImportModal.value = false; fetchSchedules() }

// ── Classrooms panel ──────────────────────────────────────────────────────────

const showClassroomsPanel  = ref(false)
const classroomsList       = ref<{ classroomId: string; code: string; capacity: number }[]>([])
const classroomsListLoading = ref(false)
const classroomsListError  = ref('')

const showClassroomForm   = ref(false)
const classroomFormMode   = ref<'create' | 'edit'>('create')
const classroomForm       = reactive({ classroomId: '', code: '', capacity: '' })
const classroomFormError  = ref('')
const classroomFormSaving = ref(false)

const showClassroomDeleteConfirm = ref(false)
const classroomDeleteTarget = ref('')
const classroomDeleting     = ref(false)
const classroomDeleteError  = ref('')

async function fetchClassroomsList() {
  classroomsListLoading.value = true
  classroomsListError.value = ''
  try {
    const res = await GqlGetClassrooms()
    classroomsList.value = (res.classrooms ?? []) as any[]
    classroomsModal.value = [] // invalidate schedule-modal cache
  } catch {
    classroomsListError.value = 'No se pudieron cargar las aulas.'
  } finally {
    classroomsListLoading.value = false
  }
}

function openClassroomsPanel() {
  showClassroomsPanel.value = true
  fetchClassroomsList()
}

function openClassroomCreate() {
  classroomFormMode.value = 'create'
  classroomForm.classroomId = ''
  classroomForm.code = ''
  classroomForm.capacity = ''
  classroomFormError.value = ''
  showClassroomForm.value = true
}

function openClassroomEdit(c: { classroomId: string; code: string; capacity: number }) {
  classroomFormMode.value = 'edit'
  classroomForm.classroomId = c.classroomId
  classroomForm.code = c.code
  classroomForm.capacity = String(c.capacity)
  classroomFormError.value = ''
  showClassroomForm.value = true
}

async function saveClassroomForm() {
  classroomFormError.value = ''
  if (!classroomForm.code.trim()) { classroomFormError.value = 'El código es obligatorio.'; return }
  const cap = parseInt(classroomForm.capacity)
  if (!classroomForm.capacity || isNaN(cap) || cap <= 0) { classroomFormError.value = 'La capacidad debe ser un número positivo.'; return }

  classroomFormSaving.value = true
  try {
    if (classroomFormMode.value === 'create') {
      const res = await GqlCreateClassroom({ code: classroomForm.code.trim().toUpperCase(), capacity: cap })
      if (res.createClassroom) classroomsList.value.push(res.createClassroom as any)
    } else {
      const res = await GqlUpdateClassroom({ classroomId: classroomForm.classroomId, code: classroomForm.code.trim().toUpperCase(), capacity: cap })
      if (res.updateClassroom) {
        const idx = classroomsList.value.findIndex(c => c.classroomId === classroomForm.classroomId)
        if (idx !== -1) classroomsList.value[idx] = res.updateClassroom as any
      }
    }
    classroomsModal.value = []
    showClassroomForm.value = false
  } catch (e: any) {
    classroomFormError.value = e?.gqlErrors?.[0]?.message ?? 'No se pudo guardar el aula.'
  } finally {
    classroomFormSaving.value = false
  }
}

async function executeDeleteClassroom() {
  classroomDeleting.value = true
  classroomDeleteError.value = ''
  try {
    await GqlDeleteClassroom({ classroomId: classroomDeleteTarget.value })
    classroomsList.value = classroomsList.value.filter(c => c.classroomId !== classroomDeleteTarget.value)
    classroomsModal.value = []
    showClassroomDeleteConfirm.value = false
  } catch (e: any) {
    classroomDeleteError.value = e?.gqlErrors?.[0]?.message ?? 'No se pudo eliminar el aula.'
  } finally {
    classroomDeleting.value = false
  }
}

// ── Professors panel ──────────────────────────────────────────────────────────

interface ProfessorDetail { professorId: string; fullName: string; legalId: string; userId: string | null }

const showProfessorsPanel   = ref(false)
const professorsList        = ref<ProfessorDetail[]>([])
const professorsListLoading = ref(false)
const professorsListError   = ref('')

const showProfessorForm   = ref(false)
const professorFormMode   = ref<'create' | 'edit'>('create')
const professorForm       = reactive({ professorId: '', fullName: '', legalId: '' })
const professorFormError  = ref('')
const professorFormSaving = ref(false)

const showProfessorDeleteConfirm = ref(false)
const professorDeleteTarget = ref('')
const professorDeleting     = ref(false)
const professorDeleteError  = ref('')

async function fetchProfessorsList() {
  professorsListLoading.value = true
  professorsListError.value = ''
  try {
    const res = await GqlGetProfessorsFull()
    professorsList.value = (res.professorsFull ?? []) as any[]
    professorsModal.value = [] // invalidate schedule-modal cache
  } catch {
    professorsListError.value = 'No se pudieron cargar los profesores.'
  } finally {
    professorsListLoading.value = false
  }
}

function openProfessorsPanel() {
  showProfessorsPanel.value = true
  fetchProfessorsList()
}

function openProfessorCreate() {
  professorFormMode.value = 'create'
  professorForm.professorId = ''
  professorForm.fullName = ''
  professorForm.legalId = ''
  professorFormError.value = ''
  showProfessorForm.value = true
}

function openProfessorEdit(p: ProfessorDetail) {
  professorFormMode.value = 'edit'
  professorForm.professorId = p.professorId
  professorForm.fullName = p.fullName
  professorForm.legalId = p.legalId
  professorFormError.value = ''
  showProfessorForm.value = true
}

async function saveProfessorForm() {
  professorFormError.value = ''
  if (!professorForm.fullName.trim()) { professorFormError.value = 'El nombre es obligatorio.'; return }
  if (!professorForm.legalId.trim())  { professorFormError.value = 'La cédula es obligatoria.'; return }

  professorFormSaving.value = true
  try {
    if (professorFormMode.value === 'create') {
      const res = await GqlCreateProfessor({ fullName: professorForm.fullName.trim(), legalId: professorForm.legalId.trim() })
      if (res.createProfessor) professorsList.value.push(res.createProfessor as any)
    } else {
      const res = await GqlUpdateProfessor({ professorId: professorForm.professorId, fullName: professorForm.fullName.trim(), legalId: professorForm.legalId.trim() })
      if (res.updateProfessor) {
        const idx = professorsList.value.findIndex(p => p.professorId === professorForm.professorId)
        if (idx !== -1) professorsList.value[idx] = res.updateProfessor as any
      }
    }
    professorsModal.value = []
    showProfessorForm.value = false
  } catch (e: any) {
    professorFormError.value = e?.gqlErrors?.[0]?.message ?? 'No se pudo guardar el profesor.'
  } finally {
    professorFormSaving.value = false
  }
}

async function executeDeleteProfessor() {
  professorDeleting.value = true
  professorDeleteError.value = ''
  try {
    await GqlDeleteProfessor({ professorId: professorDeleteTarget.value })
    professorsList.value = professorsList.value.filter(p => p.professorId !== professorDeleteTarget.value)
    professorsModal.value = []
    showProfessorDeleteConfirm.value = false
  } catch (e: any) {
    professorDeleteError.value = e?.gqlErrors?.[0]?.message ?? 'No se pudo eliminar el profesor.'
  } finally {
    professorDeleting.value = false
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(fetchSchedules)
</script>

<template>
  <section class="m-4 **:transition-colors **:duration-300">

    <!-- ── Encabezado ───────────────────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 mx-2">
      <div>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Horarios de aulas</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ isAdmin ? 'Visualización completa de todos los horarios registrados.' : 'Horarios disponibles para consulta.' }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <!-- Nuevo horario (admin) -->
        <button v-if="isAdmin" @click="openCreateModal"
          class="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-sm font-medium py-2 px-3 rounded-lg transition-all">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </button>

        <!-- Cargar horarios (admin) -->
        <button v-if="isAdmin" @click="showImportModal = true"
          class="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-sm font-medium py-2 px-3 rounded-lg transition-all">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Cargar
        </button>

        <!-- Actualizar -->
        <button @click="fetchSchedules" :disabled="loading"
          class="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-3 rounded-lg transition-all">
          <svg class="w-4 h-4 shrink-0" :class="{ 'animate-spin': loading }"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ loading ? 'Cargando...' : 'Actualizar' }}
        </button>

        <!-- Limpiar BD (admin) -->
        <button v-if="isAdmin" @click="openClearModal"
          class="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400 text-sm font-medium py-2 px-3 rounded-lg transition-all">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Limpiar BD
        </button>

        <!-- Separador visual -->
        <div v-if="isAdmin" class="w-px h-6 bg-gray-200 dark:bg-gray-700 self-center" />

        <!-- Aulas (admin) -->
        <button v-if="isAdmin" @click="openClassroomsPanel"
          class="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 text-sm font-medium py-2 px-3 rounded-lg transition-all">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Aulas
        </button>

        <!-- Profesores (admin) -->
        <button v-if="isAdmin" @click="openProfessorsPanel"
          class="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-500 dark:hover:text-violet-400 text-sm font-medium py-2 px-3 rounded-lg transition-all">
          <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Profesores
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" role="alert"
      class="mx-2 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </div>

    <!-- ── Barra de selección múltiple ──────────────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="isAdmin && selected.length > 0"
        class="mx-2 mb-3 flex items-center justify-between bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl px-4 py-2.5">
        <span class="text-sm font-medium text-red-700 dark:text-red-400">
          {{ selected.length }} seleccionado{{ selected.length !== 1 ? 's' : '' }}
        </span>
        <div class="flex items-center gap-2">
          <button @click="selected = []"
            class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            Deseleccionar
          </button>
          <button @click="showBulkDeleteModal = true"
            class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar seleccionados
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Filtros ───────────────────────────────────────────────────────────── -->
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

    <!-- ── Tabla ─────────────────────────────────────────────────────────────── -->
    <div class="mx-2 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-white/10">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs tracking-wide">
            <tr>
              <!-- Checkbox col -->
              <th v-if="isAdmin" class="px-3 py-3 w-10">
                <input type="checkbox"
                  :checked="allPageSelected"
                  :indeterminate="somePageSelected"
                  @change="toggleAllPage"
                  class="rounded border-gray-300 dark:border-gray-600 text-red-500 focus:ring-red-400 cursor-pointer" />
              </th>
              <th class="px-4 py-3 text-left">Día</th>
              <th class="px-4 py-3 text-left">Horario</th>
              <th class="px-4 py-3 text-left">Aula</th>
              <th class="px-4 py-3 text-left">Materia</th>
              <th class="px-4 py-3 text-left">Docente</th>
              <!-- Actions col -->
              <th v-if="isAdmin" class="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-white/5">

            <!-- Sin datos -->
            <tr v-if="!loading && filtered.length === 0">
              <td :colspan="isAdmin ? 7 : 5" class="px-4 py-10 text-center text-gray-400 dark:text-gray-500">
                No se encontraron horarios con los filtros seleccionados.
              </td>
            </tr>

            <!-- Skeleton -->
            <tr v-else-if="loading" v-for="n in PAGE_SIZE" :key="n" class="animate-pulse">
              <td :colspan="isAdmin ? 7 : 5" class="px-4 py-3">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </td>
            </tr>

            <!-- Filas paginadas -->
            <tr v-else v-for="s in paginated" :key="s.scheduleId"
              class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              :class="isSelected(s.scheduleId) ? 'bg-red-50/50 dark:bg-red-950/10' : ''">

              <!-- Checkbox -->
              <td v-if="isAdmin" class="px-3 py-3 w-10">
                <input type="checkbox"
                  :checked="isSelected(s.scheduleId)"
                  @change="toggleSelect(s.scheduleId)"
                  class="rounded border-gray-300 dark:border-gray-600 text-red-500 focus:ring-red-400 cursor-pointer" />
              </td>

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

              <!-- Actions -->
              <td v-if="isAdmin" class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="openEditModal(s)" title="Editar"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button @click="confirmDelete(s.scheduleId)" title="Eliminar"
                    class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>

            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer paginación -->
      <div v-if="!loading && filtered.length > 0"
        class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-white/10 flex flex-col items-center gap-2">

        <span class="text-xs text-gray-400 dark:text-gray-500">
          {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, filtered.length) }}
          de {{ filtered.length }} registro{{ filtered.length !== 1 ? 's' : '' }}
        </span>

        <div class="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-full px-2 py-1.5 shadow-sm">

          <button @click="currentPage = 1" :disabled="currentPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>
          <button @click="currentPage--" :disabled="currentPage === 1"
            class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

          <template v-for="page in totalPages" :key="page">
            <button
              v-if="page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1"
              @click="currentPage = page"
              :class="['min-w-7 h-7 px-2 rounded-full text-xs font-semibold transition-all',
                page === currentPage
                  ? 'bg-red-500 text-white shadow-sm scale-105'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400']">
              {{ page }}
            </button>
            <span v-else-if="page === currentPage - 2 || page === currentPage + 2"
              class="w-7 text-center text-xs text-gray-300 dark:text-gray-600 select-none">…</span>
          </template>

          <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

          <button @click="currentPage++" :disabled="currentPage === totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button @click="currentPage = totalPages" :disabled="currentPage === totalPages"
            class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Import modal ──────────────────────────────────────────────────────── -->
    <ModalImportExcel
      v-if="showImportModal"
      @close="showImportModal = false"
      @success="onImportSuccess"
    />

    <!-- ════════════════════════════════════════════════════════════════════════
         MODAL: Crear / Editar horario
    ════════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 **:transition-colors **:duration-200">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal" />

        <div class="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
              {{ modalMode === 'create' ? 'Nuevo horario' : 'Editar horario' }}
            </h3>
            <button @click="closeModal"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-5 space-y-4">

            <!-- Error -->
            <div v-if="modalError"
              class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2.5 text-sm text-red-600 dark:text-red-400">
              {{ modalError }}
            </div>

            <!-- Día + Aula -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Día <span class="text-red-500">*</span>
                </label>
                <select v-model="modalForm.day"
                  class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors">
                  <option value="" disabled>Seleccioná</option>
                  <option v-for="d in DAYS" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Aula <span class="text-red-500">*</span>
                </label>
                <select v-model="modalForm.classroomCode" :disabled="loadingModalData"
                  class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent disabled:opacity-50 transition-colors">
                  <option value="" disabled>{{ loadingModalData ? 'Cargando…' : 'Seleccioná' }}</option>
                  <option v-for="c in classroomsModal" :key="c.classroomId" :value="c.code">
                    {{ c.code }} (cap. {{ c.capacity }})
                  </option>
                </select>
              </div>
            </div>

            <!-- Materia -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Materia <span class="text-red-500">*</span>
              </label>
              <input v-model="modalForm.subject" type="text" placeholder="Nombre del curso"
                class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
            </div>

            <!-- Docente -->
            <div>
              <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Docente
                <span class="text-red-500" v-if="modalMode === 'create'">*</span>
                <span v-else class="font-normal normal-case ml-1 text-gray-400">(opcional — vacío mantiene el actual)</span>
              </label>
              <select v-model="modalForm.professorUserId" :disabled="loadingModalData"
                class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent disabled:opacity-50 transition-colors">
                <option value="">{{ modalMode === 'edit' ? 'Sin cambios' : 'Seleccioná un docente' }}</option>
                <option v-for="p in professorsWithAccount" :key="p.userId!" :value="p.userId">
                  {{ p.fullName }}
                </option>
              </select>
              <p v-if="professorsWithAccount.length === 0 && !loadingModalData"
                class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Solo docentes con cuenta activa aparecen en esta lista.
              </p>
            </div>

            <!-- Hora inicio + fin -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Hora inicio <span class="text-red-500">*</span>
                </label>
                <input v-model="modalForm.startTime" type="time"
                  class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                  Hora fin <span class="text-red-500">*</span>
                </label>
                <input v-model="modalForm.endTime" type="time"
                  class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-gray-800/50">
            <button @click="closeModal"
              class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Cancelar
            </button>
            <button @click="saveModal" :disabled="modalSaving"
              class="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-colors">
              <svg v-if="modalSaving" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {{ modalSaving ? 'Guardando…' : (modalMode === 'create' ? 'Crear horario' : 'Guardar cambios') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════════════
         MODAL: Confirmar eliminación individual
    ════════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 **:transition-colors **:duration-200">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showDeleteModal = false" />
        <div class="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Eliminar horario</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <div v-if="deleteError"
            class="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {{ deleteError }}
          </div>
          <div class="flex gap-2 justify-end">
            <button @click="showDeleteModal = false"
              class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Cancelar
            </button>
            <button @click="executeDelete" :disabled="deleting"
              class="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-colors">
              <svg v-if="deleting" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {{ deleting ? 'Eliminando…' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════════════
         MODAL: Confirmar eliminación múltiple
    ════════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showBulkDeleteModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 **:transition-colors **:duration-200">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showBulkDeleteModal = false" />
        <div class="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Eliminar {{ selected.length }} horario{{ selected.length !== 1 ? 's' : '' }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Esta acción no se puede deshacer.</p>
            </div>
          </div>
          <div v-if="bulkDeleteError"
            class="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {{ bulkDeleteError }}
          </div>
          <div class="flex gap-2 justify-end">
            <button @click="showBulkDeleteModal = false"
              class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Cancelar
            </button>
            <button @click="executeBulkDelete" :disabled="bulkDeleting"
              class="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-colors">
              <svg v-if="bulkDeleting" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {{ bulkDeleting ? 'Eliminando…' : 'Eliminar todos' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════════════
         MODAL: Limpiar base de datos
    ════════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showClearModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 **:transition-colors **:duration-200">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div class="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">

          <!-- Warning header -->
          <div class="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 px-6 py-4 flex items-center gap-3">
            <svg class="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 class="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Acción irreversible — Limpiar base de datos
            </h3>
          </div>

          <div class="px-6 py-5 space-y-4">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Esto eliminará <strong>todos los horarios, cursos y áreas</strong> de la base de datos.
              Las <strong>aulas y profesores</strong> no se verán afectados.
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              Para confirmar, escribí <strong class="font-mono text-gray-700 dark:text-gray-200">CONFIRMAR</strong> en el campo a continuación.
            </p>

            <input v-model="clearConfirmText" type="text" placeholder="Escribí CONFIRMAR" autocomplete="off"
              class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2.5 px-3 font-mono focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />

            <div v-if="clearError"
              class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {{ clearError }}
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-gray-800/50">
            <button @click="showClearModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Cancelar
            </button>
            <button @click="executeClear" :disabled="!clearOk || clearing"
              class="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-all">
              <svg v-if="clearing" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {{ clearing ? 'Limpiando…' : 'Limpiar base de datos' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════════════
         PANEL: Gestión de Aulas
    ════════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showClassroomsPanel"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 **:transition-colors **:duration-200">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showClassroomsPanel = false; showClassroomForm = false" />

        <div class="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">Gestión de Aulas</h3>
              <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {{ classroomsList.length }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button @click="openClassroomCreate"
                class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nueva aula
              </button>
              <button @click="showClassroomsPanel = false; showClassroomForm = false"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Form inline (create/edit) -->
          <Transition name="slide-down">
            <div v-if="showClassroomForm" class="px-6 py-4 bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/30 shrink-0">
              <p class="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-wide">
                {{ classroomFormMode === 'create' ? 'Nueva aula' : 'Editar aula' }}
              </p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Código <span class="text-red-500">*</span></label>
                  <input v-model="classroomForm.code" type="text" placeholder="Ej: A-101"
                    class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors uppercase" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Capacidad <span class="text-red-500">*</span></label>
                  <input v-model="classroomForm.capacity" type="number" min="1" placeholder="Ej: 30"
                    class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors" />
                </div>
              </div>
              <div v-if="classroomFormError" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ classroomFormError }}</div>
              <div class="flex items-center justify-end gap-2 mt-3">
                <button @click="showClassroomForm = false" class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2">Cancelar</button>
                <button @click="saveClassroomForm" :disabled="classroomFormSaving"
                  class="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors">
                  <svg v-if="classroomFormSaving" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {{ classroomFormSaving ? 'Guardando…' : (classroomFormMode === 'create' ? 'Crear' : 'Guardar') }}
                </button>
              </div>
            </div>
          </Transition>

          <!-- Error de carga -->
          <div v-if="classroomsListError" class="px-6 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 shrink-0">
            {{ classroomsListError }}
          </div>

          <!-- Tabla de aulas -->
          <div class="overflow-y-auto flex-1">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide sticky top-0">
                <tr>
                  <th class="px-5 py-3 text-left">Código</th>
                  <th class="px-5 py-3 text-left">Capacidad</th>
                  <th class="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-white/5">
                <tr v-if="classroomsListLoading" v-for="n in 4" :key="n" class="animate-pulse">
                  <td colspan="3" class="px-5 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"/></td>
                </tr>
                <tr v-else-if="!classroomsList.length">
                  <td colspan="3" class="px-5 py-8 text-center text-gray-400 dark:text-gray-500 text-xs">
                    No hay aulas registradas. Crea la primera.
                  </td>
                </tr>
                <tr v-else v-for="c in classroomsList" :key="c.classroomId"
                  class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                  <td class="px-5 py-3">
                    <span class="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {{ c.code }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-gray-600 dark:text-gray-300">{{ c.capacity }} personas</td>
                  <td class="px-5 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button @click="openClassroomEdit(c)" title="Editar"
                        class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                      </button>
                      <button @click="classroomDeleteTarget = c.classroomId; classroomDeleteError = ''; showClassroomDeleteConfirm = true" title="Eliminar"
                        class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Confirmar eliminación de aula (inline en footer) -->
          <Transition name="slide-down">
            <div v-if="showClassroomDeleteConfirm"
              class="px-6 py-4 border-t shrink-0 transition-colors duration-200"
              :class="classroomDeleteError
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50'
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-white/10'">

              <!-- Error prominente -->
              <Transition name="slide-down">
                <div v-if="classroomDeleteError"
                  class="flex items-start gap-2.5 mb-4 p-3 rounded-lg bg-white dark:bg-gray-900 border border-red-200 dark:border-red-700 shadow-sm">
                  <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p class="text-sm text-red-700 dark:text-red-300 leading-snug">{{ classroomDeleteError }}</p>
                </div>
              </Transition>

              <p class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-0.5">¿Eliminar esta aula?</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Esta acción no se puede deshacer.</p>
              <div class="flex items-center gap-2">
                <button @click="showClassroomDeleteConfirm = false; classroomDeleteError = ''"
                  class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2">
                  Cancelar
                </button>
                <button @click="executeDeleteClassroom" :disabled="classroomDeleting"
                  class="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition-colors">
                  <svg v-if="classroomDeleting" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {{ classroomDeleting ? 'Eliminando…' : 'Eliminar' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════════════
         PANEL: Gestión de Profesores
    ════════════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showProfessorsPanel"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 **:transition-colors **:duration-200">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showProfessorsPanel = false; showProfessorForm = false" />

        <div class="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">Gestión de Profesores</h3>
              <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                {{ professorsList.length }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button @click="openProfessorCreate"
                class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nuevo
              </button>
              <button @click="showProfessorsPanel = false; showProfessorForm = false"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Form inline (create/edit) -->
          <Transition name="slide-down">
            <div v-if="showProfessorForm" class="px-6 py-4 bg-violet-50/50 dark:bg-violet-950/20 border-b border-violet-100 dark:border-violet-900/30 shrink-0">
              <p class="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-3 uppercase tracking-wide">
                {{ professorFormMode === 'create' ? 'Nuevo profesor' : 'Editar profesor' }}
              </p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre completo <span class="text-red-500">*</span></label>
                  <input v-model="professorForm.fullName" type="text" placeholder="Nombre del profesor"
                    class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-colors" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Cédula <span class="text-red-500">*</span></label>
                  <input v-model="professorForm.legalId" type="text" placeholder="Número de cédula"
                    class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-colors" />
                </div>
              </div>
              <div v-if="professorFormError" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ professorFormError }}</div>
              <div class="flex items-center justify-end gap-2 mt-3">
                <button @click="showProfessorForm = false" class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2">Cancelar</button>
                <button @click="saveProfessorForm" :disabled="professorFormSaving"
                  class="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white transition-colors">
                  <svg v-if="professorFormSaving" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {{ professorFormSaving ? 'Guardando…' : (professorFormMode === 'create' ? 'Crear' : 'Guardar') }}
                </button>
              </div>
            </div>
          </Transition>

          <!-- Error de carga -->
          <div v-if="professorsListError" class="px-6 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 shrink-0">
            {{ professorsListError }}
          </div>

          <!-- Tabla de profesores -->
          <div class="overflow-y-auto flex-1">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide sticky top-0">
                <tr>
                  <th class="px-5 py-3 text-left">Nombre</th>
                  <th class="px-5 py-3 text-left">Cédula</th>
                  <th class="px-5 py-3 text-left">Cuenta</th>
                  <th class="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-white/5">
                <tr v-if="professorsListLoading" v-for="n in 5" :key="n" class="animate-pulse">
                  <td colspan="4" class="px-5 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"/></td>
                </tr>
                <tr v-else-if="!professorsList.length">
                  <td colspan="4" class="px-5 py-8 text-center text-gray-400 dark:text-gray-500 text-xs">
                    No hay profesores registrados. Crea el primero.
                  </td>
                </tr>
                <tr v-else v-for="p in professorsList" :key="p.professorId"
                  class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                  <td class="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">{{ p.fullName }}</td>
                  <td class="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{{ p.legalId }}</td>
                  <td class="px-5 py-3">
                    <span v-if="p.userId"
                      class="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                      Activa
                    </span>
                    <span v-else class="text-xs text-gray-400 dark:text-gray-500">Sin cuenta</span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button @click="openProfessorEdit(p)" title="Editar"
                        class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-900/30 dark:hover:text-violet-400 transition-colors">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                        </svg>
                      </button>
                      <button @click="professorDeleteTarget = p.professorId; professorDeleteError = ''; showProfessorDeleteConfirm = true"
                        :disabled="!!p.userId" :title="p.userId ? 'Tiene cuenta activa' : 'Eliminar'"
                        class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Confirmar eliminación de profesor (inline en footer) -->
          <Transition name="slide-down">
            <div v-if="showProfessorDeleteConfirm"
              class="px-6 py-4 border-t shrink-0 transition-colors duration-200"
              :class="professorDeleteError
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50'
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-white/10'">

              <!-- Error prominente -->
              <Transition name="slide-down">
                <div v-if="professorDeleteError"
                  class="flex items-start gap-2.5 mb-4 p-3 rounded-lg bg-white dark:bg-gray-900 border border-red-200 dark:border-red-700 shadow-sm">
                  <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p class="text-sm text-red-700 dark:text-red-300 leading-snug">{{ professorDeleteError }}</p>
                </div>
              </Transition>

              <p class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-0.5">¿Eliminar este profesor?</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Esta acción no se puede deshacer.</p>
              <div class="flex items-center gap-2">
                <button @click="showProfessorDeleteConfirm = false; professorDeleteError = ''"
                  class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors px-2">
                  Cancelar
                </button>
                <button @click="executeDeleteProfessor" :disabled="professorDeleting"
                  class="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition-colors">
                  <svg v-if="professorDeleting" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  {{ professorDeleting ? 'Eliminando…' : 'Eliminar' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Teleport>

  </section>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
