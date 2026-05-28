<script setup lang="ts">
const state = ref('login')
const colorMode = useColorMode()
const showPassword = ref(false)

const formData = reactive({ name: '', email: '', password: '' })
<<<<<<< HEAD
const error = ref('')
const loading = ref(false)
=======
const error    = ref('')
const loading  = ref(false)
>>>>>>> parent of 6f7f2da (Updates)

const handleSubmit = async () => {
  error.value = ''
  loading.value = true
  try {
    const { token, user } = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: formData.email, password: formData.password }
    })

    const auth = useAuthStore()
    await auth.setSession(token, user)
    await navigateTo('/dashboard', { replace: true })

<<<<<<< HEAD
=======
    if (state.value === 'login') {
      const { login } = await GqlLogin({ email: formData.email, password: formData.password })
      useGqlToken(login.token)               // envía Authorization: Bearer <jwt>
      await auth.setSession(login.token, login.user)
    } else {
      const { register } = await GqlRegister({
        fullname: formData.name,
        email:    formData.email,
        password: formData.password,
      })
      useGqlToken(register.token)
      await auth.setSession(register.token, register.user)
    }

    navigateTo('/dashboard', { replace: true })
>>>>>>> parent of 6f7f2da (Updates)
  } catch (e: any) {
    error.value = 'Credenciales incorrectas. Intente de nuevo.'
  } finally {
    loading.value = false
  }
}

const toggleState = () => {
  state.value = state.value === 'login' ? 'register' : 'login'
  error.value = ''
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

      <!-- Blobs decorativos -->
      <div class="absolute -top-24 -right-24 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute -bottom-16 -left-16 w-64 h-64 bg-red-400/20 rounded-full blur-2xl pointer-events-none" />

      <div class="relative z-10 text-center select-none">
        <img src="/img/LogoUNA.png" alt="Logo UNA"
          class="h-28 w-auto mx-auto mb-8 brightness-0 invert drop-shadow-xl" />
        <h1 class="text-white font-bold text-4xl tracking-tight mb-4">SIPAUNA</h1>
        <p class="text-red-200 text-sm leading-relaxed max-w-xs mx-auto">
          Sistema Institucional para el Préstamo de Aulas
        </p>
        <p class="text-red-300/70 text-xs mt-1">Sede Chorotega — Universidad Nacional</p>
      </div>
    </div>

    <!-- ── Panel derecho — formulario ────────────────────────────────────── -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">

      <!-- Toggle de tema (esquina superior derecha) -->
      <button @click="toggleTheme"
        :title="colorMode.value === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" class="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-lg
               bg-gray-100 dark:bg-gray-800
               hover:bg-gray-200 dark:hover:bg-gray-700
               text-gray-600 dark:text-gray-300
               transition-colors duration-200">
        <svg v-if="colorMode.value !== 'dark'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z" />
        </svg>
        <svg v-else class="w-5 h-5 fill-current" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </button>

      <!-- Logo + título (solo mobile) -->
      <div class="lg:hidden mb-8 text-center">
        <img src="/img/LogoUNA.png" alt="Logo UNA" class="h-16 w-auto mx-auto mb-3" />
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Sede Chorotega — Universidad Nacional</p>
      </div>

      <!-- Tarjeta del formulario -->
      <div class="w-full max-w-sm">

        <!-- Encabezado del form -->
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

          <!-- Nombre (solo registro) -->
          <div v-if="state !== 'login'">
            <label for="register-name" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre completo
            </label>
            <input id="register-name" type="text" v-model="formData.name" placeholder="Tu nombre" autocomplete="name"
              class="block w-full rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800/60
                     text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     text-sm px-4 py-2.5
                     focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent
<<<<<<< HEAD
                     transition-colors duration-200" />
=======
                     transition-colors duration-200"
            />
>>>>>>> parent of 6f7f2da (Updates)
          </div>

          <!-- Correo -->
          <div>
            <label for="login-email" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Correo electrónico
            </label>
            <input id="login-email" type="email" v-model="formData.email" placeholder="correo@una.ac.cr"
              autocomplete="email" class="block w-full rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-800/60
                     text-gray-900 dark:text-white
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
                       bg-white dark:bg-gray-800/60
                       text-gray-900 dark:text-white
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

          <!-- Error -->
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

          <!-- Botón submit -->
          <button type="submit" :disabled="loading" class="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-[.98]
                   disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-medium text-sm
                   transition-all duration-150 flex items-center justify-center gap-2">
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {{ loading ? 'Iniciando sesión...' : state === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}
          </button>

        </form>

        <!-- Link alternar login / registro -->
        <p class="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          {{ state === 'login' ? '¿Aún no tienes una cuenta?' : '¿Ya tienes una cuenta?' }}
          <button type="button" @click="toggleState"
            class="text-red-500 dark:text-red-400 hover:underline font-medium ml-1">
            {{ state === 'login' ? 'Regístrate' : 'Inicia sesión' }}
          </button>
        </p>

      </div>
    </div>

    <!-- Fondo degradado sutil (mobile / tablet) -->
    <div class="lg:hidden fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <div
        class="absolute left-1/2 top-0 -translate-x-1/2 w-150 h-75 bg-red-500/15 dark:bg-red-500/10 rounded-full blur-3xl" />
      <div class="absolute right-0 bottom-0 w-64 h-64 bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-2xl" />
    </div>

  </div>
</template>
