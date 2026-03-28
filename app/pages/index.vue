<script setup>
const state = ref('login')
const colorMode = useColorMode()

const formData = reactive({
  name: '',
  email: '',
  password: ''
})

const handleSubmit = () => { }

const toggleState = () => {
  state.value = state.value === 'login' ? 'register' : 'login'
}

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center
              bg-transparent dark:bg-transparent transition-colors duration-300">

    <form @submit.prevent="handleSubmit" class="mx-4 w-full sm:w-87.5 text-center
             bg-white/15 dark:bg-black/10
             border border-gray-300 dark:border-white/50
             rounded-2xl px-8 transition-colors duration-300">

      <h1 class="text-gray-800 dark:text-white text-3xl mt-10 font-medium">
        {{ state === 'login' ? 'Inicio de sesión' : 'Registrarte' }}
      </h1>

      <p class="text-gray-500 dark:text-white text-sm mt-2">
        Sistema Institucional para Préstamos de Aulas
      </p>

      <!-- Name -->
      <div v-if="state !== 'login'" class="flex items-center mt-6 w-full
               bg-white/10 dark:bg-white/5
               ring-2 ring-gray-300 dark:ring-white/15
               focus-within:ring-blue-500/60
               h-12 rounded-full overflow-hidden pl-6 gap-2 transition-all">
        <input type="text" v-model="formData.name" placeholder="Nombre" class="w-full bg-transparent text-gray-800 dark:text-white
                 placeholder-gray-400 dark:placeholder-white/60
                 border-none outline-none" required />
      </div>

      <!-- Email -->
      <div class="flex items-center w-full mt-4
                  bg-white/10 dark:bg-white/5
                  ring-2 ring-gray-300 dark:ring-white/15
                  focus-within:ring-blue-500/60
                  h-12 rounded-full overflow-hidden pl-6 gap-2 transition-all">
        <input type="email" v-model="formData.email" placeholder="Identificación" class="w-full bg-transparent text-gray-800 dark:text-white
                 placeholder-gray-400 dark:placeholder-white/60
                 border-none outline-none" required />
      </div>

      <!-- Password -->
      <div class="flex items-center mt-4 w-full
                  bg-white/10 dark:bg-white/5
                  ring-2 ring-gray-300 dark:ring-white/15
                  focus-within:ring-blue-500/60
                  h-12 rounded-full overflow-hidden pl-6 gap-2 transition-all">
        <input type="password" v-model="formData.password" placeholder="Contraseña" class="w-full bg-transparent text-gray-800 dark:text-white
                 placeholder-gray-400 dark:placeholder-white/60
                 border-none outline-none" required />
      </div>

      <div v-if="state === 'login'" class="mt-4">
        <span class="text-sm text-gray-500 dark:text-white">¿Olvidaste tu contraseña? </span>
        <button type="button" class="text-sm text-blue-400 hover:underline">
          Haz click aquí
        </button>
      </div>

      <button type="submit" class="mt-2 w-full h-11 rounded-full text-white bg-red-600 hover:bg-red-500 transition">
        {{ state === 'login' ? 'Iniciar sesión' : 'Registrarse' }}
      </button>

      <p @click="toggleState" class="text-gray-500 dark:text-white text-sm mt-3 mb-11 cursor-pointer">
        {{ state === 'login' ? "¿Aún no tienes una cuenta?" : '¿Ya tienes una cuenta?' }}
        <span class="text-blue-400 hover:underline ml-1">Haz click aquí</span>
      </p>
    </form>

    <!-- Botón de tema -->
    <div class="fixed bottom-6 right-6">
      <button @click="toggleTheme"
        class="text-white dark:text- flex items-center gap-2 bg-blue-700 dark:bg-gray-800 rounded-lg px-3 py-2 hover:bg-blue-500 dark:hover:bg-gray-700 duration-300 transition-colors ease-in">
        <svg v-if="colorMode.value !== 'dark'" class="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
          viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 7a5 5 0 100 10 5 5 0 000-10z" />
        </svg>
        <svg v-else class="w-6 h-6 text-white fill-current" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
        <span class="text-slate-200">Cambiar tema</span>
      </button>
    </div>

    <!-- Soft Backdrop -->
    <div class="fixed inset-0 -z-10 pointer-events-none">
      <div
        class="absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 bg-linear-to-tr from-red-500/35 to-transparent rounded-full blur-3xl" />
      <div
        class="absolute right-12 bottom-10 w-105 h-55 bg-linear-to-bl from-blue-700/35 to-transparent rounded-full blur-2xl" />
    </div>
  </div>
</template>