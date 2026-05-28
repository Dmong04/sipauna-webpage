<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface UserRow {
  userId:   string
  fullname: string
  email:    string
  roleId:   string
  roleName: string
}
interface Role { roleId: string; name: string }

const auth = useAuthStore()

// Guard de rol: solo admin. Si no, fuera.
onMounted(() => {
  if (auth.user?.roleName !== 'admin') {
    navigateTo('/dashboard', { replace: true })
  }
})

const ROLE_BADGE: Record<string, string> = {
  admin:      'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  profesor:   'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  estudiante: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  invitado:   'bg-gray-100   text-gray-600   dark:bg-gray-700/50   dark:text-gray-300',
}

const users   = ref<UserRow[]>([])
const roles   = ref<Role[]>([])
const loading = ref(false)
const error   = ref('')

// Crear usuario
const showCreate = ref(false)
const submitting = ref(false)
const formError  = ref('')
const form = reactive({
  fullname: '', email: '', password: '', roleName: 'estudiante', legalId: '',
})

// Acciones por fila
const updatingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

async function fetchData() {
  error.value   = ''
  loading.value = true
  try {
    const [u, r] = await Promise.all([GqlGetUsers(), GqlGetRoles()])
    users.value = u.users ?? []
    roles.value = r.roles ?? []
  } catch {
    error.value = 'No se pudieron cargar los usuarios.'
  } finally {
    loading.value = false
  }
}

function validateCreate(): string | null {
  if (!form.fullname.trim()) return 'Ingrese el nombre completo.'
  if (!form.email.trim())    return 'Ingrese el correo.'
  if (!form.legalId.trim())  return 'Ingrese la identificación.'
  if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  return null
}

async function createUser() {
  formError.value = ''
  const v = validateCreate()
  if (v) { formError.value = v; return }

  submitting.value = true
  try {
    await GqlCreateUser({
      fullname: form.fullname.trim(),
      email:    form.email.trim(),
      password: form.password,
      roleName: form.roleName,
      legalId:  form.legalId.trim(),
    })
    Object.assign(form, { fullname: '', email: '', password: '', roleName: 'estudiante', legalId: '' })
    showCreate.value = false
    await fetchData()
  } catch (e: any) {
    formError.value = e?.gqlErrors?.[0]?.message ?? 'No se pudo crear el usuario.'
  } finally {
    submitting.value = false
  }
}

async function changeRole(user: UserRow, newRole: string) {
  if (newRole === user.roleName) return
  updatingId.value = user.userId
  try {
    await GqlUpdateUserRole({ userId: user.userId, roleName: newRole })
    user.roleName = newRole
  } catch (e: any) {
    error.value = e?.gqlErrors?.[0]?.message ?? 'No se pudo cambiar el rol.'
    await fetchData() // revertir el select al estado real
  } finally {
    updatingId.value = null
  }
}

async function deleteUser(userId: string) {
  updatingId.value = userId
  try {
    await GqlDeleteUser({ userId })
    users.value = users.value.filter(u => u.userId !== userId)
    deletingId.value = null
  } catch (e: any) {
    error.value = e?.gqlErrors?.[0]?.message ?? 'No se pudo eliminar el usuario.'
  } finally {
    updatingId.value = null
  }
}

onMounted(fetchData)
</script>

<template>
  <section class="m-4 **:transition-colors **:duration-300">

    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 mx-2">
      <div>
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Administración de usuarios</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Crea, gestiona roles y elimina cuentas del sistema.</p>
      </div>
      <button
        @click="showCreate = !showCreate"
        class="self-start sm:self-auto flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white text-sm font-medium py-2 px-4 rounded-md transition-all duration-150"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="showCreate ? 'M6 18L18 6M6 6l12 12' : 'M12 4.5v15m7.5-7.5h-15'" />
        </svg>
        {{ showCreate ? 'Cancelar' : 'Nuevo usuario' }}
      </button>
    </div>

    <!-- Error global -->
    <div v-if="error" role="alert" class="mx-2 mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      {{ error }}
    </div>

    <!-- Formulario de creación -->
    <div v-if="showCreate" class="mx-2 mb-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm p-6">
      <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Crear nuevo usuario</h3>

      <div v-if="formError" role="alert" class="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400">
        {{ formError }}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="nu-name" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo <span class="text-red-500">*</span></label>
          <input id="nu-name" v-model="form.fullname" type="text" placeholder="Juan Pérez"
            class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
        </div>
        <div>
          <label for="nu-email" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Correo <span class="text-red-500">*</span></label>
          <input id="nu-email" v-model="form.email" type="email" placeholder="correo@una.cr" autocomplete="off"
            class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
        </div>
        <div>
          <label for="nu-legal" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Identificación <span class="text-red-500">*</span></label>
          <input id="nu-legal" v-model="form.legalId" type="text" placeholder="1-2345-6789"
            class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
        </div>
        <div>
          <label for="nu-role" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rol <span class="text-red-500">*</span></label>
          <select id="nu-role" v-model="form.roleName"
            class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors">
            <option v-for="r in roles" :key="r.roleId" :value="r.name">{{ r.name }}</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label for="nu-pass" class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña <span class="text-red-500">*</span> <span class="text-gray-400 font-normal">(mín. 8 caracteres)</span></label>
          <input id="nu-pass" v-model="form.password" type="text" placeholder="Contraseña temporal" autocomplete="off"
            class="block w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors" />
        </div>
      </div>

      <div class="mt-5 flex justify-end">
        <button @click="createUser" :disabled="submitting"
          class="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-50 text-white text-sm font-medium py-2 px-5 rounded-md transition-all duration-150">
          <svg v-if="submitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {{ submitting ? 'Creando...' : 'Crear usuario' }}
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="mx-2 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-white/10">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs tracking-wide">
            <tr>
              <th class="px-4 py-3 text-left">Nombre</th>
              <th class="px-4 py-3 text-left">Correo</th>
              <th class="px-4 py-3 text-left">Rol</th>
              <th class="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-white/5">

            <tr v-if="loading" v-for="n in 4" :key="'s'+n" class="animate-pulse">
              <td colspan="4" class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" /></td>
            </tr>

            <tr v-else-if="users.length === 0">
              <td colspan="4" class="px-4 py-10 text-center text-gray-400 dark:text-gray-500">No hay usuarios registrados.</td>
            </tr>

            <tr v-else v-for="u in users" :key="u.userId" class="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60">
              <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-100 whitespace-nowrap">
                {{ u.fullname }}
                <span v-if="u.userId === auth.user?.userId" class="ml-1 text-xs text-gray-400">(tú)</span>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ u.email }}</td>
              <td class="px-4 py-3">
                <!-- Cambio de rol inline (deshabilitado para uno mismo) -->
                <div class="flex items-center gap-2">
                  <span :class="ROLE_BADGE[u.roleName] ?? ROLE_BADGE.invitado" class="text-xs font-semibold px-2.5 py-1 rounded-full capitalize">{{ u.roleName }}</span>
                  <select
                    v-if="u.userId !== auth.user?.userId"
                    :value="u.roleName"
                    :disabled="updatingId === u.userId"
                    @change="changeRole(u, ($event.target as HTMLSelectElement).value)"
                    class="text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md py-1 pl-2 pr-6 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
                  >
                    <option v-for="r in roles" :key="r.roleId" :value="r.name" class="capitalize">{{ r.name }}</option>
                  </select>
                </div>
              </td>
              <td class="px-4 py-3">
                <!-- Confirmación de borrado inline -->
                <div v-if="deletingId === u.userId" class="flex items-center gap-2">
                  <span class="text-xs text-gray-500 dark:text-gray-400">¿Eliminar?</span>
                  <button @click="deleteUser(u.userId)" :disabled="updatingId === u.userId"
                    class="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 active:scale-95 disabled:opacity-40 transition-all">Sí</button>
                  <button @click="deletingId = null"
                    class="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 active:scale-95 transition-all">No</button>
                </div>
                <button
                  v-else
                  @click="deletingId = u.userId"
                  :disabled="u.userId === auth.user?.userId"
                  :title="u.userId === auth.user?.userId ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'"
                  class="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-100 disabled:hover:text-gray-600 transition-all duration-150"
                >
                  Eliminar
                </button>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      <div v-if="!loading && users.length > 0" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-white/10 text-xs text-gray-400 dark:text-gray-500">
        {{ users.length }} usuario{{ users.length !== 1 ? 's' : '' }}
      </div>
    </div>

  </section>
</template>
