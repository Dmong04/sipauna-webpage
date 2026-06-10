<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()

const userInitial = computed(() => auth.user?.fullname?.charAt(0)?.toUpperCase() ?? '?')
const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  profesor: 'Profesor',
  estudiante: 'Estudiante',
  invitado: 'Invitado',
}

// ── Perfil ────────────────────────────────────────────────────────────────
const profileForm = reactive({
  fullname: auth.user?.fullname ?? '',
  email: auth.user?.email ?? '',
})
const profileLoading = ref(false)
const profileSuccess = ref('')
const profileError = ref('')

const profileDirty = computed(
  () => profileForm.fullname !== auth.user?.fullname || profileForm.email !== auth.user?.email
)

async function saveProfile() {
  profileSuccess.value = ''
  profileError.value = ''
  profileLoading.value = true
  try {
    const result = await GqlUpdateProfile({
      userId: auth.user!.userId,
      fullname: profileForm.fullname.trim() || undefined,
      email: profileForm.email.trim() || undefined,
    })
    if (result.updateProfile) {
      auth.restoreSession(auth.token!, result.updateProfile as any)
      profileForm.fullname = result.updateProfile.fullname
      profileForm.email = result.updateProfile.email
      profileSuccess.value = 'Perfil actualizado correctamente.'
    }
  } catch (e: any) {
    profileError.value = e?.gqlErrors?.[0]?.message ?? e?.message ?? 'Error al actualizar el perfil.'
  } finally {
    profileLoading.value = false
  }
}

// ── Contraseña ────────────────────────────────────────────────────────────
const passForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passLoading = ref(false)
const passSuccess = ref('')
const passError = ref('')
const showCurrentPass = ref(false)
const showNewPass = ref(false)
const showConfirmPass = ref(false)

const passMatch = computed(() =>
  !passForm.confirmPassword || passForm.newPassword === passForm.confirmPassword
)

// Indicador de fortaleza
const passStrength = computed(() => {
  const p = passForm.newPassword
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return Math.min(s, 4)
})
const strengthMeta = computed(() => {
  const map = [
    { label: '', color: 'bg-gray-200 dark:bg-gray-700' },
    { label: 'Débil', color: 'bg-red-500' },
    { label: 'Regular', color: 'bg-orange-400' },
    { label: 'Buena', color: 'bg-yellow-400' },
    { label: 'Fuerte', color: 'bg-green-500' },
  ]
  return map[passStrength.value]
})

async function changePassword() {
  passSuccess.value = ''
  passError.value = ''
  if (!passMatch.value) { passError.value = 'Las contraseñas nuevas no coinciden.'; return }
  if (passForm.newPassword.length < 8) { passError.value = 'La nueva contraseña debe tener al menos 8 caracteres.'; return }
  passLoading.value = true
  try {
    await GqlChangePassword({
      userId: auth.user!.userId,
      currentPassword: passForm.currentPassword,
      newPassword: passForm.newPassword,
    })
    passSuccess.value = 'Contraseña actualizada correctamente.'
    passForm.currentPassword = ''
    passForm.newPassword = ''
    passForm.confirmPassword = ''
  } catch (e: any) {
    passError.value = e?.gqlErrors?.[0]?.message ?? e?.message ?? 'Error al cambiar la contraseña.'
  } finally {
    passLoading.value = false
  }
}

// ── Accesibilidad ─────────────────────────────────────────────────────────
const A11Y_KEY = 'sipauna-a11y'
interface A11yPrefs { textLg: boolean; highContrast: boolean; reduceMotion: boolean }

const a11y = reactive<A11yPrefs>({ textLg: false, highContrast: false, reduceMotion: false })

function applyA11y() {
  const html = document.documentElement
  html.classList.toggle('text-lg-base', a11y.textLg)
  html.classList.toggle('high-contrast', a11y.highContrast)
  html.classList.toggle('reduce-motion', a11y.reduceMotion)
  localStorage.setItem(A11Y_KEY, JSON.stringify({ ...a11y }))
}
watch(a11y, applyA11y, { deep: true })
onMounted(() => {
  try {
    const saved = localStorage.getItem(A11Y_KEY)
    if (saved) Object.assign(a11y, JSON.parse(saved))
  } catch {}
  applyA11y()
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">

    <!-- ── Tarjeta de usuario ──────────────────────────────────────────────── -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-700 p-6 text-white shadow-lg">
      <!-- Decoración de fondo -->
      <div class="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
      <div class="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5" />

      <div class="relative flex items-center gap-4">
        <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white ring-2 ring-white/30 shrink-0">
          {{ userInitial }}
        </div>
        <div class="min-w-0">
          <h1 class="text-xl font-bold truncate">{{ auth.user?.fullname }}</h1>
          <p class="text-sm text-red-100 truncate mt-0.5">{{ auth.user?.email }}</p>
          <span class="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
            {{ roleLabel[auth.user?.roleName ?? ''] ?? auth.user?.roleName }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Sección 1: Perfil ──────────────────────────────────────────────── -->
    <section class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

      <!-- Header -->
      <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Información del perfil</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">Actualiza tu nombre y correo electrónico.</p>
        </div>
      </div>

      <form @submit.prevent="saveProfile" class="px-6 py-5 space-y-4">

        <!-- Nombre y email en grid en pantallas medianas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Nombre completo
            </label>
            <input v-model="profileForm.fullname" type="text" required
              class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all duration-200"
              placeholder="Tu nombre completo" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              Correo electrónico
            </label>
            <input v-model="profileForm.email" type="email" required
              class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all duration-200"
              placeholder="tu@correo.com" />
          </div>
        </div>

        <!-- Mensajes -->
        <Transition name="slide-fade">
          <div v-if="profileSuccess"
            class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {{ profileSuccess }}
          </div>
        </Transition>
        <Transition name="slide-fade">
          <div v-if="profileError"
            class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {{ profileError }}
          </div>
        </Transition>

        <div class="flex justify-end pt-1">
          <button type="submit" :disabled="profileLoading || !profileDirty"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium shadow-sm shadow-red-200 dark:shadow-none transition-all duration-200 hover:shadow-md hover:shadow-red-200 dark:hover:shadow-none">
            <svg v-if="profileLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {{ profileLoading ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </section>

    <!-- ── Sección 2: Contraseña ──────────────────────────────────────────── -->
    <section class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

      <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Contraseña</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">Cambia tu contraseña de acceso al sistema.</p>
        </div>
      </div>

      <form @submit.prevent="changePassword" class="px-6 py-5 space-y-4">

        <!-- Contraseña actual -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            Contraseña actual
          </label>
          <div class="relative">
            <input v-model="passForm.currentPassword" :type="showCurrentPass ? 'text' : 'password'" required
              class="w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all duration-200"
              placeholder="••••••••" />
            <button type="button" @click="showCurrentPass = !showCurrentPass"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md">
              <svg v-if="!showCurrentPass" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Nueva contraseña + indicador de fortaleza -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            Nueva contraseña
          </label>
          <div class="relative">
            <input v-model="passForm.newPassword" :type="showNewPass ? 'text' : 'password'" required minlength="8"
              class="w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all duration-200"
              placeholder="••••••••  (mín. 8 caracteres)" />
            <button type="button" @click="showNewPass = !showNewPass"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md">
              <svg v-if="!showNewPass" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>

          <!-- Barra de fortaleza -->
          <Transition name="slide-fade">
            <div v-if="passForm.newPassword" class="mt-2.5 space-y-1.5">
              <div class="flex gap-1.5">
                <div v-for="i in 4" :key="i"
                  class="h-1.5 flex-1 rounded-full transition-all duration-300"
                  :class="i <= passStrength ? strengthMeta.color : 'bg-gray-200 dark:bg-gray-600'" />
              </div>
              <p class="text-xs" :class="{
                'text-red-500': passStrength === 1,
                'text-orange-500': passStrength === 2,
                'text-yellow-600 dark:text-yellow-400': passStrength === 3,
                'text-green-600 dark:text-green-400': passStrength === 4,
              }">
                {{ strengthMeta.label }}
              </p>
            </div>
          </Transition>
        </div>

        <!-- Confirmar nueva contraseña -->
        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            Confirmar nueva contraseña
          </label>
          <div class="relative">
            <input v-model="passForm.confirmPassword" :type="showConfirmPass ? 'text' : 'password'" required
              :class="[
                'w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white dark:focus:bg-gray-700 transition-all duration-200',
                passMatch ? 'border-gray-200 dark:border-gray-600 focus:ring-red-500' : 'border-red-400 dark:border-red-500 focus:ring-red-400 bg-red-50/30 dark:bg-red-900/10'
              ]"
              placeholder="••••••••" />
            <button type="button" @click="showConfirmPass = !showConfirmPass"
              class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md">
              <svg v-if="!showConfirmPass" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
          <Transition name="slide-fade">
            <p v-if="!passMatch" class="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <svg class="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              Las contraseñas no coinciden.
            </p>
          </Transition>
        </div>

        <!-- Mensajes de resultado -->
        <Transition name="slide-fade">
          <div v-if="passSuccess"
            class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {{ passSuccess }}
          </div>
        </Transition>
        <Transition name="slide-fade">
          <div v-if="passError"
            class="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {{ passError }}
          </div>
        </Transition>

        <div class="flex justify-end pt-1">
          <button type="submit" :disabled="passLoading || !passMatch"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium shadow-sm shadow-red-200 dark:shadow-none transition-all duration-200 hover:shadow-md hover:shadow-red-200 dark:hover:shadow-none">
            <svg v-if="passLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {{ passLoading ? 'Actualizando...' : 'Cambiar contraseña' }}
          </button>
        </div>
      </form>
    </section>

    <!-- ── Sección 3: Accesibilidad ───────────────────────────────────────── -->
    <section class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">

      <div class="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Accesibilidad</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">Ajusta la visualización según tus necesidades.</p>
        </div>
      </div>

      <div class="divide-y divide-gray-100 dark:divide-gray-700">

        <!-- Toggle: Texto más grande -->
        <button type="button" @click="a11y.textLg = !a11y.textLg"
          class="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150 text-left group">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">Texto más grande</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Aumenta el tamaño base del texto para mejor legibilidad.</p>
          </div>
          <!-- Toggle track -->
          <div class="shrink-0 w-11 h-6 rounded-full relative transition-colors duration-200"
            :class="a11y.textLg ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-600'">
            <!-- Thumb -->
            <div class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
              :class="a11y.textLg ? 'translate-x-5' : 'translate-x-0'" />
          </div>
        </button>

        <!-- Toggle: Alto contraste -->
        <button type="button" @click="a11y.highContrast = !a11y.highContrast"
          class="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150 text-left group">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">Alto contraste</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Incrementa el contraste de colores para mayor visibilidad.</p>
          </div>
          <div class="shrink-0 w-11 h-6 rounded-full relative transition-colors duration-200"
            :class="a11y.highContrast ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-600'">
            <div class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
              :class="a11y.highContrast ? 'translate-x-5' : 'translate-x-0'" />
          </div>
        </button>

        <!-- Toggle: Reducir animaciones -->
        <button type="button" @click="a11y.reduceMotion = !a11y.reduceMotion"
          class="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150 text-left group">
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">Reducir animaciones</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Minimiza las transiciones y animaciones de la interfaz.</p>
          </div>
          <div class="shrink-0 w-11 h-6 rounded-full relative transition-colors duration-200"
            :class="a11y.reduceMotion ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-600'">
            <div class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
              :class="a11y.reduceMotion ? 'translate-x-5' : 'translate-x-0'" />
          </div>
        </button>

      </div>
    </section>

  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
