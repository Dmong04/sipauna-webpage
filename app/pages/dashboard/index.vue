<template>
   <main class="m-4 **:transition-colors **:duration-300">

      <!-- Hero banner -->
      <section
         class="relative overflow-hidden bg-linear-to-br from-red-700 via-red-800 to-red-900 dark:from-red-950 dark:via-gray-900 dark:to-gray-900 text-white rounded-2xl py-14 px-6 mb-10 text-center">
         <div class="absolute inset-0 pointer-events-none">
            <div class="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
            <div class="absolute -bottom-10 -left-10 w-56 h-56 bg-red-400/15 rounded-full blur-2xl" />
         </div>
         <div class="relative">
            <img src="/img/LogoUNA.png" alt="Logo UNA"
               class="h-16 w-auto mx-auto mb-5 brightness-0 invert drop-shadow-lg" />
            <h1 class="font-bold text-4xl sm:text-5xl tracking-tight">SIPAUNA</h1>
            <p class="text-red-200 mt-3 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
               Sistema Institucional para el Préstamo de Aulas — Sede Regional Chorotega, Universidad Nacional de Costa Rica.
            </p>
         </div>
      </section>

      <section>
         <div class="mb-10 mx-2">
            <h2
               class="text-red-800 dark:text-red-400 font-semibold mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
               ¿Cómo empezar a reservar?
            </h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
               SIPAUNA cuenta con la posibilidad de ver los horarios de aulas
               y cuándo estarán ocupadas para ciertas actividades o para los cursos que se toman durante el
               día en la universidad. Para esto puede ir a la sección de horarios y ver los horarios de cada aula. En
               caso de buscar un aula específica, puede ir al apartado de
               comprobar disponibilidad y ahí verificar que el aula esté disponible. Además, en el apartado de solicitud
               de reservación podrá ver sus solicitudes.
            </p>
         </div>

         <div class="mb-10 mx-2">
            <h2
               class="text-red-800 dark:text-red-400 font-semibold mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
               ¿Quiénes pueden reservar?
            </h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
               Cualquier persona en la universidad puede llevar a cabo una
               reservación. Su solicitud será atendida y validada en cuanto un usuario administrador confirme que
               efectivamente puede llevarse a cabo.
            </p>
         </div>

         <div class="mb-10 mx-2">
            <h2
               class="text-red-800 dark:text-red-400 font-semibold mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
               Principales funcionalidades
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
               <!-- Ver horarios -->
               <div
                  class="h-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div class="flex gap-4 items-start">
                     <div
                        class="w-10 h-10 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5 text-red-700 dark:text-red-400" fill="none" stroke="currentColor"
                           stroke-width="1.5" viewBox="0 0 24 24">
                           <path stroke-linecap="round" stroke-linejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                     </div>
                     <div>
                        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">Ver horarios de aulas
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                           Permite a los usuarios consultar los horarios de las aulas disponibles en la universidad,
                           facilitando la planificación de eventos y actividades académicas.
                        </p>
                     </div>
                  </div>
               </div>

               <!-- Comprobar disponibilidad -->
               <div
                  class="h-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div class="flex gap-4 items-start">
                     <div
                        class="w-10 h-10 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5 text-red-700 dark:text-red-400" fill="none" viewBox="0 0 24 24"
                           stroke-width="1.5" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                     </div>
                     <div>
                        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">Ver disponibilidad
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                           Permite comprobar de manera más específica la disponibilidad de un aula en un horario
                           determinado, facilitando la planificación de eventos y actividades académicas.
                        </p>
                     </div>
                  </div>
               </div>

               <!-- Solicitar y comprobar solicitudes -->
               <div
                  class="h-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div class="flex gap-4 items-start">
                     <div
                        class="w-10 h-10 bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5 text-red-700 dark:text-red-400" fill="none" viewBox="0 0 24 24"
                           stroke-width="1.5" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round"
                              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                           <path stroke-linecap="round" stroke-linejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                     </div>
                     <div>
                        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">Comprobar solicitudes
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                           Permite comprobar si ya un usuario administrador ha validado su solicitud de reservación, ha
                           sido cancelada o si aún sigue en trámite, según los criterios de la persona
                           administradora encargada.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
   </main>
</template>
<script setup lang="ts">
definePageMeta({
   middleware: 'auth'
})
</script>
