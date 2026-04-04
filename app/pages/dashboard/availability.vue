<script>

</script>
<template>
  <div class="card shadow-md rounded-lg p-6">
    <p class="text-sm text-gray-600">Aquí podrás comprobar la disponibilidad de los espacios para tus actividades.</p>

    <div class="mt-4">
      <label for="ID" class="block text-sm font-medium text-gray-700">Búsqueda por ID de aula:</label>

      <div class="relative mt-2 w-80">
        <input type="text" id="ID" name="IDinput"
          class="py-2 px-2 pr-9 block rounded-md border w-full border-gray-600 shadow-md focus:border-red-500 focus:ring-red-500 sm:text-sm"
          placeholder="NRC: 123314" />

        <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>