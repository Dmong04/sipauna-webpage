layouts/default.vue
<template>
  <div class="flex flex-col min-h-screen">
    <HeaderApp />

    <section class="">
      <nav
        class="bg-white border-b border-gray-200 dark:border-white/10  dark:bg-slate-900 transition-all duration-300 px-4 ">
        <div class=" flex flex-col items-center px-6 ">
          <div class="flex items-center h-12 gap-1">
            <NuxtLink to="/dashboard/schedules"
              class="border-b-2 border-transparent hover:border-red-500 hover:text-red-500 dark:text-white text-gray-600 text-sm font-medium inline-flex items-center px-2 h-full transition-colors duration-200">
              Horarios
            </NuxtLink>
            <NuxtLink to="/dashboard/booking"
              class="border-b-2 border-transparent hover:border-red-500 hover:text-red-500 dark:text-white text-gray-600 text-sm font-medium inline-flex items-center px-2 h-full transition-colors duration-200">
              Solicitud de reservación
            </NuxtLink>
            <NuxtLink to="/dashboard/availability"
              class="border-b-2 border-transparent hover:border-red-500 hover:text-red-500 dark:text-white text-gray-600 text-sm font-medium inline-flex items-center px-2 h-full transition-colors duration-200">
              Comprobar disponibilidad
            </NuxtLink>
          </div>
        </div>
      </nav>
    </section>
    <main class="">
      <NuxtPage />
    </main>

    <FooterApp />
  </div>
</template>
