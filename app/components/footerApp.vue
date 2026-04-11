<script>

</script>
<template>
    <footer class="px-6 border-t border-gray-200 dark:border-gray-800 md:px-16 lg:px-24 xl:px-32 pt-8 w-full text-gray-500">
        <div class="flex flex-col md:flex-row justify-between w-full gap-10 ">
            <div class="md:max-w-96">
                <div class="flex items-center">
                    <img src="/img/LogoUNA.png" alt="Logo" class="h-32 w-40">
                    <div class="flex flex-col">
                        <span class="dark:text-white text-4xl">SIPAUNA</span>
                        <span class="dark:text-white">Sistema Institucional para Préstamo de Aulas de la Universidad Nacional SRCH</span>
                    </div>
                </div>
                <p class="mt-6 text-sm dark:text-white">
                    Nacido de un proyecto universitario, al servicio de la institución.
                </p>
            </div>
            <div class="flex-1 flex items-start md:justify-end gap-20">
                <div>
                    <h2 class="font-semibold mb-5 dark:text-white text-gray-800">Información</h2>
                    <ul class="dark:text-white text-sm space-y-2">
                        <li><a href="/about">Acerca de SIPAUNA</a></li>
                        <li><a href="#">Desarrolladores</a></li>
                        <li><a href="https://www.directorio.una.ac.cr/" target="_blank" rel="Directorio">Contacto</a></li>
                        <li><a href="https://www.una.ac.cr/" target="_blank" rel="UNA" >UNA</a></li>
                    </ul>
                </div>
                <div>
                    <h2 class="font-semibold dark:text-white mb-5 text-gray-800">¿Te interesa saber más?</h2>
                    <div class="text-sm space-y-2 dark:text-white">
                        <p>Envíanos tu información y te contactaremos para contarte más acerca de SIPAUNA, cómo funciona
                            y si gustarías apoyarnos.</p>
                        <div class="flex items-center gap-2 pt-4">
                            <input
                                class="border dark:border-white border-gray-500/30 dark:placeholder-white placeholder-gray-500 focus:ring-2 ring-red-500 outline-none w-full max-w-64 h-9 rounded px-2"
                                type="email" placeholder="Digita tu correo institucional">
                            <button class="bg-red-500 w-24 h-9 text-white rounded">Enviar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <p class="pt-4 text-center text-sm dark:text-white md:text-sm pb-5">
            Copyright 2026 &copy;SIPAUNA. Todos los derechos reservados.
        </p>
    </footer>
</template>