<script setup lang="ts">
const state = ref('login')
const colorMode = useColorMode()
const showPassword = ref(false)
const auth = useAuthStore()

const formData = reactive({
  name: '',
  email: '',
  password: '',
  roleName: 'estudiante',
  legalId: '',
})
const error = ref('')
const loading = ref(false)

// ── Roles que requieren validación de cédula ───────────────────────────────
const needsLegalIdCheck = computed(() =>
  ['profesor', 'estudiante', 'invitado'].includes(formData.roleName)
)

// ── Validación de cédula (genérica por rol) ────────────────────────────────
const legalIdStatus = ref<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
const legalIdError = ref('')
const legalIdHint = ref('')
let legalIdTimer: ReturnType<typeof setTimeout>

const checkLegalIdByRole = async (legalId: string) => {
  const trimmed = legalId.trim()
  if (!trimmed) {
    legalIdStatus.value = 'idle'
    legalIdError.value = ''
    legalIdHint.value = ''
    return
  }

  legalIdStatus.value = 'checking'
  legalIdError.value = ''
  legalIdHint.value = ''

  try {
    if (formData.roleName === 'profesor') {
      const { checkProfessorByLegalId } = await GqlCheckProfessorByLegalId({ legalId: trimmed })

      if (!checkProfessorByLegalId) {
        legalIdStatus.value = 'invalid'
        legalIdError.value = 'No se encontró ningún profesor con esa cédula.'
      } else if (checkProfessorByLegalId.userId) {
        legalIdStatus.value = 'invalid'
        legalIdError.value = 'Este profesor ya tiene una cuenta registrada.'
      } else {
        legalIdStatus.value = 'valid'
        legalIdHint.value = checkProfessorByLegalId.fullName
      }

    } else if (formData.roleName === 'estudiante') {
      const { checkStudentByLegalId } = await GqlCheckStudentByLegalId({ legalId: trimmed })

      if (checkStudentByLegalId?.userId) {
        // Existe y ya tiene cuenta → bloquear
        legalIdStatus.value = 'invalid'
        legalIdError.value = 'Ya existe una cuenta registrada con esa cédula.'
      } else {
        // No existe en la tabla, o existe sin userId → libre para registrarse
        legalIdStatus.value = 'valid'
        legalIdHint.value = checkStudentByLegalId?.fullName ?? ''
      }

    } else if (formData.roleName === 'invitado') {
      const { checkGuestByLegalId } = await GqlCheckGuestByLegalId({ legalId: trimmed })

      if (checkGuestByLegalId?.userId) {
        // Existe y ya tiene cuenta → bloquear
        legalIdStatus.value = 'invalid'
        legalIdError.value = 'Ya existe una cuenta registrada con esa cédula.'
      } else {
        // No existe en la tabla, o existe sin userId → libre para registrarse
        legalIdStatus.value = 'valid'
        legalIdHint.value = checkGuestByLegalId?.fullname ?? ''
      }
    }
  } catch {
    legalIdStatus.value = 'idle'
    legalIdError.value = 'No se pudo verificar la cédula. Intente de nuevo.'
  }
}

const checkLegalId = (legalId: string) => {
  clearTimeout(legalIdTimer)
  if (!legalId.trim()) {
    legalIdStatus.value = 'idle'
    legalIdError.value = ''
    legalIdHint.value = ''
    return
  }
  legalIdStatus.value = 'checking'
  legalIdTimer = setTimeout(() => checkLegalIdByRole(legalId), 500)
}

const checkLegalIdOnBlur = (legalId: string) => {
  clearTimeout(legalIdTimer)
  if (!legalId.trim() || legalIdStatus.value === 'valid') return
  checkLegalIdByRole(legalId)
}

// ── Validación de nombre (solo profesor) ──────────────────────────────────
const professorStatus = ref<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
const professorError = ref('')
let nameTimer: ReturnType<typeof setTimeout>

const checkProfessor = (fullName: string) => {
  clearTimeout(nameTimer)
  const trimmed = fullName.trim()
  if (!trimmed) {
    professorStatus.value = 'idle'
    professorError.value = ''
    return
  }
  professorStatus.value = 'checking'
  professorError.value = ''
  nameTimer = setTimeout(async () => {
    try {
      const { checkProfessorExists } = await GqlCheckProfessorExists({ fullName: trimmed })
      professorStatus.value = checkProfessorExists ? 'valid' : 'invalid'
      professorError.value = checkProfessorExists
        ? ''
        : 'No se encontró un profesor con ese nombre en el sistema.'
    } catch {
      professorStatus.value = 'idle'
      professorError.value = 'No se pudo verificar el nombre. Intente de nuevo.'
    }
  }, 500)
}

const checkProfessorOnBlur = async (fullName: string) => {
  clearTimeout(nameTimer)
  const trimmed = fullName.trim()
  if (!trimmed || professorStatus.value === 'valid') return
  professorStatus.value = 'checking'
  try {
    const { checkProfessorExists } = await GqlCheckProfessorExists({ fullName: trimmed })
    professorStatus.value = checkProfessorExists ? 'valid' : 'invalid'
    professorError.value = checkProfessorExists
      ? ''
      : 'No se encontró un profesor con ese nombre en el sistema.'
  } catch {
    professorStatus.value = 'idle'
    professorError.value = 'No se pudo verificar el nombre. Intente de nuevo.'
  }
}

// ── Reset al cambiar de rol o estado ──────────────────────────────────────
watch(() => formData.roleName, () => {
  legalIdStatus.value = 'idle'
  legalIdError.value = ''
  legalIdHint.value = ''
  professorStatus.value = 'idle'
  professorError.value = ''
  formData.legalId = ''
  formData.name = ''
})

// ── Submit ─────────────────────────────────────────────────────────────────
const handleSubmit = async () => {
  error.value = ''

  if (state.value === 'register') {
    if (needsLegalIdCheck.value && legalIdStatus.value !== 'valid') {
      error.value = 'Debés ingresar una cédula válida antes de continuar.'
      return
    }
    if (formData.roleName === 'profesor' && professorStatus.value !== 'valid') {
      error.value = 'Debes ingresar un nombre de profesor registrado en el sistema.'
      return
    }
  }

  loading.value = true
  try {
    if (state.value === 'login') {
      const { login } = await GqlLogin({ email: formData.email, password: formData.password })
      useGqlToken(login.token)
      await auth.setSession(login.token, login.user)
    } else {
      const { register } = await GqlRegister({
        fullname: formData.name,
        email: formData.email,
        password: formData.password,
        roleName: formData.roleName,
        legalId: formData.legalId,
      })
      useGqlToken(register.token)
      await auth.setSession(register.token, register.user)
    }
    navigateTo('/dashboard', { replace: true })
  } catch (e: any) {
    error.value = e?.gqlErrors?.[0]?.message ?? 'Error al procesar la solicitud. Intente de nuevo.'
  } finally {
    loading.value = false
  }
}

const toggleState = () => {
  state.value = state.value === 'login' ? 'register' : 'login'
  error.value = ''
  formData.roleName = 'estudiante'
  formData.legalId = ''
  formData.name = ''
  legalIdStatus.value = 'idle'
  legalIdError.value = ''
  legalIdHint.value = ''
  professorStatus.value = 'idle'
  professorError.value = ''
}

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

definePageMeta({ middleware: 'auth' })
</script>

<template>
  <div class="min-h-screen flex bg-white dark:bg-gray-950 transition-colors duration-300">

    <!-- ── Panel izquierdo — branding (solo desktop) ─────────────────────── -->
    <div class="hidden lg:flex lg:w-5/12 xl:w-2/5 relative overflow-hidden
                bg-linear-to-br from-red-700 via-red-800 to-red-900
                flex-col items-center justify-center p-14">
      <div class="absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -bottom-16 -left-16 w-64 h-64 bg-red-400/20 rounded-full blur-2xl pointer-events-none" />
      <div class="relative z-10 text-center select-none">
        <img src="/img/LogoUNA.png" alt="Logo UNA"
          class="h-28 w-auto mx-auto mb-8 brightness-0 invert drop-shadow-xl" />
        <h1 class="text-white font-bold text-4xl tracking-tight mb-4">SIPAUNA</h1>
        <p class="text-red-200 text-sm leading-relaxed max-w-xs mx-auto">
          Sistema Institucional para el Préstamo de Aulas
        </p>
        <p class="text-red-300/70 text-xs mt-1">Sede Regional Chorotega — Universidad Nacional</p>
      </div>
    </div>

    <!-- ── Panel derecho — formulario ────────────────────────────────────── -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">

      <!-- Toggle de tema -->
      <button @click="toggleTheme"
        :title="colorMode.value === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" class="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-lg
               bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
               text-gray-600 dark:text-gray-300 transition-colors duration-200">
        <svg v-if="colorMode.value !== 'dark'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z" />
        </svg>
        <svg v-else class="w-5 h-5 fill-current" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </button>

      <!-- Logo mobile -->
      <div class="lg:hidden mb-8 text-center">
        <img src="/img/LogoUNA.png" alt="Logo UNA" class="h-16 w-auto mx-auto mb-3" />
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Sede Regional Chorotega — Universidad Nacional</p>
      </div>

      <!-- Tarjeta del formulario -->
      <div class="w-full max-w-sm">

        <div class="mb-7">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ state === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta' }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ state === 'login'
              ? 'Ingresa tus credenciales para continuar'
              : 'Completa los campos para registrarte' }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" novalidate class="space-y-4">

          <!-- ── Campos solo registro ─────────────────────────────────────── -->
          <template v-if="state !== 'login'">

            <!-- Cédula -->
            <div>
              <label for="register-legalid" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Cédula
              </label>
              <div class="relative">
                <input id="register-legalid" type="text" v-model="formData.legalId" placeholder="Número de cédula"
                  autocomplete="off" @input="needsLegalIdCheck && checkLegalId(formData.legalId)"
                  @blur="needsLegalIdCheck && checkLegalIdOnBlur(formData.legalId)" :class="[
                    'block w-full rounded-lg border text-sm px-4 py-2.5 pr-10',
                    'bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white',
                    'placeholder-gray-400 dark:placeholder-gray-500',
                    'focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200',
                    needsLegalIdCheck && legalIdStatus === 'valid'
                      ? 'border-green-500 focus:ring-green-400'
                      : needsLegalIdCheck && legalIdStatus === 'invalid'
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-red-400'
                  ]" />
                <span v-if="needsLegalIdCheck && legalIdStatus !== 'idle'"
                  class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg v-if="legalIdStatus === 'checking'" class="animate-spin h-4 w-4 text-gray-400" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <svg v-else-if="legalIdStatus === 'valid'" class="h-4 w-4 text-green-500" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else-if="legalIdStatus === 'invalid'" class="h-4 w-4 text-red-500" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              </div>
              <p v-if="needsLegalIdCheck && legalIdError"
                class="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {{ legalIdError }}
              </p>
              <p v-else-if="needsLegalIdCheck && legalIdStatus === 'valid'"
                class="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Cédula verificada
                <span v-if="legalIdHint" class="font-semibold ml-1">— {{ legalIdHint }}</span>
              </p>
            </div>

            <!-- Nombre completo -->
            <div>
              <label for="register-name" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nombre completo
              </label>
              <div class="relative">
                <input id="register-name" type="text" v-model="formData.name" placeholder="Tu nombre completo"
                  autocomplete="name" @input="formData.roleName === 'profesor' && checkProfessor(formData.name)"
                  @blur="formData.roleName === 'profesor' && checkProfessorOnBlur(formData.name)" :class="[
                    'block w-full rounded-lg border text-sm px-4 py-2.5 pr-10',
                    'bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white',
                    'placeholder-gray-400 dark:placeholder-gray-500',
                    'focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200',
                    formData.roleName === 'profesor' && professorStatus === 'valid'
                      ? 'border-green-500 focus:ring-green-400'
                      : formData.roleName === 'profesor' && professorStatus === 'invalid'
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-red-400'
                  ]" />
                <span v-if="formData.roleName === 'profesor' && professorStatus !== 'idle'"
                  class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg v-if="professorStatus === 'checking'" class="animate-spin h-4 w-4 text-gray-400" fill="none"
                    viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <svg v-else-if="professorStatus === 'valid'" class="h-4 w-4 text-green-500" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg v-else-if="professorStatus === 'invalid'" class="h-4 w-4 text-red-500" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
              </div>
              <p v-if="formData.roleName === 'profesor' && professorError"
                class="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {{ professorError }}
              </p>
              <p v-else-if="formData.roleName === 'profesor' && professorStatus === 'valid'"
                class="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Nombre encontrado en el sistema.
              </p>
            </div>

            <!-- Rol -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tipo de cuenta
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" @click="formData.roleName = 'estudiante'" :class="[
                  'py-2 rounded-lg border text-sm font-medium transition-colors duration-150',
                  formData.roleName === 'estudiante'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-400'
                ]">Estudiante</button>
                <button type="button" @click="formData.roleName = 'profesor'" :class="[
                  'py-2 rounded-lg border text-sm font-medium transition-colors duration-150',
                  formData.roleName === 'profesor'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-400'
                ]">Profesor</button>
                <button type="button" @click="formData.roleName = 'invitado'" :class="[
                  'py-2 rounded-lg border text-sm font-medium transition-colors duration-150',
                  formData.roleName === 'invitado'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-400'
                ]">Invitado</button>
              </div>
            </div>

          </template>

          <!-- Correo -->
          <div>
            <label for="login-email" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Correo electrónico
            </label>
            <input id="login-email" type="email" v-model="formData.email" placeholder="correo@una.ac.cr"
              autocomplete="email" class="block w-full rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     text-sm px-4 py-2.5
                     focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent
                     transition-colors duration-200" required />
          </div>

          <!-- Contraseña -->
          <div>
            <label for="login-password" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Contraseña
            </label>
            <div class="relative">
              <input id="login-password" :type="showPassword ? 'text' : 'password'" v-model="formData.password"
                placeholder="Tu contraseña" :autocomplete="state === 'login' ? 'current-password' : 'new-password'"
                class="block w-full rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-800/60 text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       text-sm pl-4 pr-11 py-2.5
                       focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent
                       transition-colors duration-200" required />
              <button type="button" @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" class="absolute inset-y-0 right-0 px-3 flex items-center
                       text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300
                       transition-colors">
                <svg v-if="!showPassword" class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <svg v-else class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error global -->
          <p v-if="error" role="alert" class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {{ error }}
          </p>

          <!-- ¿Olvidaste tu contraseña? -->
          <div v-if="state === 'login'" class="text-right">
            <button type="button" class="text-xs text-red-500 dark:text-red-400 hover:underline">
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <!-- Submit -->
          <button type="submit" :disabled="loading" class="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-[.98]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-medium text-sm
                   transition-all duration-150 flex items-center justify-center gap-2">
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {{ loading ? 'Cargando...' : state === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}
          </button>

        </form>

        <!-- Alternar login / registro -->
        <p class="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          {{ state === 'login' ? '¿Aún no tienes una cuenta?' : '¿Ya tienes una cuenta?' }}
          <button type="button" @click="toggleState"
            class="text-red-500 dark:text-red-400 hover:underline font-medium ml-1">
            {{ state === 'login' ? 'Regístrate' : 'Inicia sesión' }}
          </button>
        </p>

      </div>
    </div>

    <!-- Fondo degradado sutil (mobile) -->
    <div class="lg:hidden fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <div
        class="absolute left-1/2 top-0 -translate-x-1/2 w-150 h-75 bg-red-500/15 dark:bg-red-500/10 rounded-full blur-3xl" />
      <div class="absolute right-0 bottom-0 w-64 h-64 bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-2xl" />
    </div>

  </div>
</template>