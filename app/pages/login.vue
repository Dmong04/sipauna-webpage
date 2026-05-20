<script setup lang="ts">
import { useAuthStore } from '~/composables/auth'

const state = ref('login')
const colorMode = useColorMode()
const showPassword = ref(false)

const formData = reactive({
  name: '',
  email: '',
  password: ''
})

const error = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    const result = await GqlLogin({
      email: formData.email,
      password: formData.password
    })

    const auth = useAuthStore()
    await auth.setSession(result.login.token, result.login.user)
    navigateTo('/dashboard', { replace: true })

  } catch (e) {
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

definePageMeta({
  middleware: 'auth'
})
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center
              bg-transparent dark:bg-transparent transition-colors duration-300">

    <form @submit.prevent="handleSubmit"
      class="mx-4 w-full sm:w-96 text-center
             bg-white/15 dark:bg-black/10
             border border-gray-300 dark:border-white/50
             rounded-2xl px-8 transition-colors duration-300">

      <h1 class="text-gray-800 dark:text-white text-3xl mt-10 font-medium">
        {{ state === 'login' ? 'Inicio de sesión' : 'Registrarse' }}
      </h1>

      <p class="text-gray-500 dark:text-white/80 text-sm mt-2">
        Sistema Institucional para Préstamos de Aulas
      </p>

      <!-- Name -->
      <div v-if="state !== 'login'" class="mt-6 text-left">
        <label for="register-name" class="block text-xs font-medium text-gray-500 dark:text-white/70 mb-1.5">
          Nombre completo
        </label>
        <div class="flex items-center w-full
                 bg-white/10 dark:bg-white/5
                 ring-2 ring-gray-300 dark:ring-white/15
                 focus-within:ring-blue-500/60
                 h-12 rounded-full overflow-hidden pl-6 gap-2 transition-all">
          <input
            id="register-name"
            type="text"
            v-model="formData.name"
            placeholder="Tu nombre"
            autocomplete="name"
            class="w-full bg-transparent text-gray-800 dark:text-white
                   placeholder-gray-400 dark:placeholder-white/40
                   border-none outline-none text-sm"
            required />
        </div>
      </div>

      <!-- Email -->
      <div class="mt-4 text-left">
        <label for="login-email" class="block text-xs font-medium text-gray-500 dark:text-white/70 mb-1.5">
          Correo electrónico
        </label>
        <div class="flex items-center w-full
                    bg-white/10 dark:bg-white/5
                    ring-2 ring-gray-300 dark:ring-white/15
                    focus-within:ring-blue-500/60
                    h-12 rounded-full overflow-hidden pl-6 gap-2 transition-all">
          <input
            id="login-email"
            type="email"
            v-model="formData.email"
            placeholder="correo@una.ac.cr"
            autocomplete="email"
            class="w-full bg-transparent text-gray-800 dark:text-white
                   placeholder-gray-400 dark:placeholder-white/40
                   border-none outline-none text-sm"
            required />
        </div>
      </div>

      <!-- Password -->
      <div class="mt-4 text-left">
        <label for="login-password" class="block text-xs font-medium text-gray-500 dark:text-white/70 mb-1.5">
          Contraseña
        </label>
        <div class="flex items-center w-full
                    bg-white/10 dark:bg-white/5
                    ring-2 ring-gray-300 dark:ring-white/15
                    focus-within:ring-blue-500/60
                    h-12 rounded-full overflow-hidden pl-6 pr-4 gap-2 transition-all">
          <input
            id="login-password"
            :type="showPassword ? 'text' : 'password'"
            v-model="formData.password"
            placeholder="Tu contraseña"
            :autocomplete="state === 'login' ? 'current-password' : 'new-password'"
            class="w-full bg-transparent text-gray-800 dark:text-white
                   placeholder-gray-400 dark:placeholder-white/40
                   border-none outline-none text-sm"
            required />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="shrink-0 text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white/80 transition-colors"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          >
            <!-- Ojo abierto -->
            <svg v-if="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <!-- Ojo cerrado -->
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Error -->
      <p v-if="error" role="alert" class="text-red-500 dark:text-red-400 text-sm mt-3 text-left">
        {{ error }}
      </p>

      <!-- Forgot password -->
      <div v-if="state === 'login'" class="mt-3 text-left">
        <button type="button" class="text-sm text-blue-500 dark:text-blue-400 hover:underline">
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="mt-4 w-full h-11 rounded-full text-white bg-red-600 hover:bg-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm">
        {{ loading ? 'Cargando...' : state === 'login' ? 'Iniciar sesión' : 'Registrarse' }}
      </button>

      <div class="mt-3 mb-10 text-sm text-gray-500 dark:text-white/70">
        {{ state === 'login' ? '¿Aún no tienes una cuenta?' : '¿Ya tienes una cuenta?' }}
        <button
          type="button"
          @click="toggleState"
          class="text-blue-500 dark:text-blue-400 hover:underline ml-1 font-medium"
        >
          {{ state === 'login' ? 'Regístrate' : 'Inicia sesión' }}
        </button>
      </div>
    </form>

    <!-- Botón de tema -->
    <div class="fixed bottom-6 right-6">
      <button
        @click="toggleTheme"
        class="w-10 h-10 flex items-center justify-center rounded-xl bg-white/20 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-700 transition-colors duration-200"
        :aria-label="colorMode.value === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        :title="colorMode.value === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      >
        <svg v-if="colorMode.value !== 'dark'" class="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z" />
        </svg>
        <svg v-else class="w-5 h-5 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </button>
    </div>

    <!-- Soft Backdrop -->
    <div class="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <div class="absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 bg-linear-to-tr from-red-500/35 to-transparent rounded-full blur-3xl" />
      <div class="absolute right-12 bottom-10 w-105 h-55 bg-linear-to-bl from-blue-700/35 to-transparent rounded-full blur-2xl" />
    </div>
  </div>
</template>
