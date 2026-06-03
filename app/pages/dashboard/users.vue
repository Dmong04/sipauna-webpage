<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()

if (auth.user?.roleName !== 'admin') {
  navigateTo('/dashboard', { replace: true })
}

interface User {
  userId: string
  fullname: string
  email: string
  roleId: string
  roleName: string
}

interface Role {
  roleId: string
  name: string
}

const users = ref<User[]>([])
const roles = ref<Role[]>([])
const loading = ref(false)
const error = ref('')

const showCreate = ref(false)
const creating = ref(false)
const createErr = ref('')
const newUser = reactive({ fullname: '', email: '', password: '', roleName: 'estudiante', legalId: '' })

const editingId = ref<string | null>(null)
const editRole = ref('')
const savingRole = ref(false)

const deletingId = ref<string | null>(null)

// ── Paginación ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 10
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(users.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return users.value.slice(start, start + PAGE_SIZE)
})

async function fetchData() {
  error.value = ''
  loading.value = true
  currentPage.value = 1
  try {
    const [usersRes, rolesRes] = await Promise.all([GqlGetUsers(), GqlGetRoles()])
    users.value = usersRes.users ?? []
    roles.value = rolesRes.roles ?? []
  } catch {
    error.value = 'No se pudieron cargar los usuarios.'
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  createErr.value = ''
  creating.value = true
  try {
    await GqlCreateUser({
      fullname: newUser.fullname,
      email: newUser.email,
      password: newUser.password,
      roleName: newUser.roleName,
      legalId: newUser.legalId,
    })
    showCreate.value = false
    Object.assign(newUser, { fullname: '', email: '', password: '', roleName: 'estudiante', legalId: '' })
    await fetchData()
  } catch (e: any) {
    createErr.value = e?.gqlErrors?.[0]?.message ?? 'Error al crear el usuario.'
  } finally {
    creating.value = false
  }
}

function startEdit(user: User) {
  editingId.value = user.userId
  editRole.value = user.roleName
}

async function saveRole(userId: string) {
  savingRole.value = true
  try {
    await GqlUpdateUserRole({ userId, roleName: editRole.value })
    editingId.value = null
    await fetchData()
  } catch (e: any) {
    error.value = e?.gqlErrors?.[0]?.message ?? 'Error al actualizar el rol.'
  } finally {
    savingRole.value = false
  }
}

async function deleteUser(userId: string) {
  if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
  deletingId.value = userId
  try {
    await GqlDeleteUser({ userId })
    await fetchData()
  } catch (e: any) {
    error.value = e?.gqlErrors?.[0]?.message ?? 'Error al eliminar el usuario.'
  } finally {
    deletingId.value = null
  }
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  profesor: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  estudiante: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  invitado: 'bg-gray-100   text-gray-600   dark:bg-gray-800      dark:text-gray-400',
}

onMounted(fetchData)
</script>

<template>
  <section class="m-4 **:transition-colors **:duration-300">

    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 mx-2">
      <div>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Gestión de usuarios</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Administra cuentas, roles y accesos del sistema.</p>
      </div>
      <div class="flex gap-2 self-start sm:self-auto">
        <button @click="fetchData" :disabled="loading"
          class="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-4 rounded-md transition-all">
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar
        </button>
        <button @click="showCreate = !showCreate"
          class="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-medium py-2 px-4 rounded-md transition-all">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </button>
      </div>
    </div>

    <!-- Formulario creación -->
    <div v-if="showCreate"
      class="mx-2 mb-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Crear nuevo usuario</h3>
      <form @submit.prevent="handleCreate" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre completo</label>
          <input v-model="newUser.fullname" type="text" required placeholder="Nombre completo"
            class="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Correo electrónico</label>
          <input v-model="newUser.email" type="email" required placeholder="correo@una.ac.cr"
            class="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Contraseña</label>
          <input v-model="newUser.password" type="password" required placeholder="Mínimo 8 caracteres"
            class="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Identificación</label>
          <input v-model="newUser.legalId" type="text" required placeholder="Cédula o ID"
            class="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rol</label>
          <select v-model="newUser.roleName"
            class="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400">
            <option v-for="r in roles" :key="r.roleId" :value="r.name">{{ r.name }}</option>
          </select>
        </div>
        <div class="flex flex-col justify-end gap-2">
          <p v-if="createErr" class="text-xs text-red-600 dark:text-red-400">{{ createErr }}</p>
          <div class="flex gap-2">
            <button type="submit" :disabled="creating"
              class="flex-1 text-sm font-medium py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white transition-all">
              {{ creating ? 'Creando...' : 'Crear' }}
            </button>
            <button type="button" @click="showCreate = false"
              class="text-sm font-medium py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-all">
              Cancelar
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Error global -->
    <p v-if="error" class="mx-2 mb-3 text-sm text-red-600 dark:text-red-400">{{ error }}</p>

    <!-- Tabla -->
    <div
      class="mx-2 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">

      <div v-if="loading" class="flex justify-center items-center py-16">
        <svg class="animate-spin h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>

      <div v-else-if="users.length === 0"
        class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <svg class="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p class="text-sm">No hay usuarios registrados.</p>
      </div>

      <template v-else>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
              <th class="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Usuario</th>
              <th
                class="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 hidden sm:table-cell">
                Correo</th>
              <th class="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Rol</th>
              <th class="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="user in paginated" :key="user.userId"
              class="hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-700 dark:text-red-300 font-semibold text-xs shrink-0">
                    {{ user.fullname?.charAt(0)?.toUpperCase() ?? '?' }}
                  </div>
                  <span class="font-medium text-gray-800 dark:text-gray-100 truncate max-w-40">{{ user.fullname
                    }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">{{ user.email }}</td>
              <td class="px-4 py-3">
                <div v-if="editingId === user.userId" class="flex items-center gap-2">
                  <select v-model="editRole"
                    class="text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-400">
                    <option v-for="r in roles" :key="r.roleId" :value="r.name">{{ r.name }}</option>
                  </select>
                  <button @click="saveRole(user.userId)" :disabled="savingRole"
                    class="text-xs text-green-600 dark:text-green-400 hover:underline disabled:opacity-50">
                    {{ savingRole ? '...' : 'Guardar' }}
                  </button>
                  <button @click="editingId = null" class="text-xs text-gray-400 hover:underline">Cancelar</button>
                </div>
                <span v-else
                  :class="['text-xs font-medium px-2 py-0.5 rounded-full', ROLE_BADGE[user.roleName] ?? ROLE_BADGE.invitado]">
                  {{ user.roleName }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <button v-if="editingId !== user.userId" @click="startEdit(user)" title="Cambiar rol"
                    class="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button @click="deleteUser(user.userId)"
                    :disabled="deletingId === user.userId || user.userId === auth.user?.userId" title="Eliminar usuario"
                    class="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <svg v-if="deletingId === user.userId" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Footer: paginación + conteo -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60
                    flex flex-col items-center gap-2">

          <div v-if="totalPages > 1" class="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10
                   rounded-full px-2 py-1.5 shadow-sm">

            <button @click="currentPage = 1" :disabled="currentPage === 1" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                     hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                     transition-colors" title="Primera página">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
              </svg>
            </button>

            <button @click="currentPage--" :disabled="currentPage === 1" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                     hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                     transition-colors" title="Página anterior">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

            <template v-for="page in totalPages" :key="page">
              <button v-if="page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1"
                @click="currentPage = page" :class="[
                  'min-w-7 h-7 px-2 rounded-full text-xs font-semibold transition-all duration-150',
                  page === currentPage
                    ? 'bg-red-500 text-white shadow-sm shadow-red-200 dark:shadow-red-900/40 scale-105'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400'
                ]">
                {{ page }}
              </button>
              <span v-else-if="page === currentPage - 2 || page === currentPage + 2"
                class="w-7 text-center text-xs text-gray-300 dark:text-gray-600 select-none">…</span>
            </template>

            <div class="w-px h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

            <button @click="currentPage++" :disabled="currentPage === totalPages" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                     hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                     transition-colors" title="Página siguiente">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button @click="currentPage = totalPages" :disabled="currentPage === totalPages" class="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500
                     hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400
                     transition-colors" title="Última página">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />
              </svg>
            </button>

          </div>

          <span class="text-xs text-gray-400 dark:text-gray-500">
            {{ totalPages > 1
              ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, users.length)} de `
              : '' }}{{ users.length }} usuario{{ users.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </template>

    </div>

  </section>
</template>