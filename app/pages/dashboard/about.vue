<template>
    <main class="m-4 **:transition-colors **:duration-300">
        <!-- Banner del about -->
        <section class="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-red-900 dark:from-red-950 dark:via-gray-900 dark:to-gray-900 text-white rounded-2xl py-12 px-6 mb-10 text-center">
            <div class="absolute inset-0 pointer-events-none">
                <div class="absolute -top-12 -right-12 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
                <div class="absolute -bottom-8 -left-8 w-44 h-44 bg-red-400/15 rounded-full blur-2xl" />
            </div>
            <div class="relative">
                <h1 class="font-bold text-3xl sm:text-4xl tracking-tight">Acerca de SIPAUNA</h1>
                <p class="text-red-200 mt-2 text-sm sm:text-base max-w-lg mx-auto">
                    Sistema institucional para el préstamo de aulas de la Universidad Nacional, Sede Chorotega
                </p>
            </div>
        </section>

        <section class="mb-10 mx-2">
            <h2 class="font-semibold text-red-800 dark:text-red-400 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">¿Qué es SIPAUNA?</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
                SIPAUNA es un sistema institucional
                para el prestamo de aulas de la Universidad Nacional de la sede chorotega,
                desarrollado por estudiantes de la carrera de Informatica, con el objetivo
                de facilitar el proceso de reserva y gestion de aulas para eventos academicos y administrativos.
                El sistema permite a los usuarios solicitar el prestamo de aulas, verificar la disponibilidad,
                y gestionar las reservas de manera eficiente. Con una interfaz intuitiva y funcionalidades avanzadas,
                SIPAUNA busca optimizar el uso de los recursos educativos y mejorar la experiencia de los usuarios en la
                universidad.
            </p>
        </section>

        <section class="mb-10 mx-2">
            <h2 class="font-semibold text-red-800 dark:text-red-400 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">Nuestros valores</h2>

            <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                En SIPAUNA, nuestros valores fundamentales guían cada aspecto de nuestro trabajo y definen quiénes somos
                como organización.
                Nos comprometemos a la excelencia, la innovación, la colaboración, la integridad y el servicio.
                Creemos en brindar soluciones de alta calidad que superen las expectativas de nuestros usuarios,
                fomentando un ambiente de trabajo colaborativo y ético.
                Nuestro objetivo es crear un impacto positivo en la comunidad universitaria a través de nuestro
                compromiso con estos valores.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-3 dark:text-gray-300">Misión</h3>
                    <p class="text-gray-600 leading-relaxed dark:text-gray-300">
                        Brindar una herramienta eficiente, accesible y confiable que permita
                        a docentes y administrativos gestionar el préstamo de aulas de manera
                        ágil y transparente.
                    </p>
                </div>

                <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <h3 class="text-xl font-semibold text-gray-800 mb-3 dark:text-gray-300">Visión</h3>
                    <p class="text-gray-600 leading-relaxed dark:text-gray-300">
                        Ser el sistema de referencia para la gestión de espacios académicos
                        en la Universidad Nacional, promoviendo la digitalización y la
                        eficiencia institucional.
                    </p>
                </div>
            </div>
        </section>
    </main>
</template>

<script setup>
</script>