import { defineStore } from 'pinia'

interface User {
  userId: string
  fullname: string
  email: string
  roleId: number
}

interface AuthState {
  token: string | null
  user: User | null
}

const postToSW = async (message: object): Promise<void> => {
  if (!('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.ready
    registration.active?.postMessage(message)
  } catch (e) {
    console.warn('[Auth Store] No se pudo contactar al SW:', e)
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
  },

  actions: {
    async setSession(token: string, user: User) {
      this.token = token
      this.user = user
      await postToSW({
        type: 'SAVE_SESSION',
        payload: { token, user },
      })
    },

    async clearSession() {
      this.token = null
      this.user = null
      await postToSW({ type: 'CLEAR_SESSION' })
      await postToSW({ type: 'CLEAR_GRAPHQL_CACHE' })
    },

    restoreSession(token: string, user: User) {
      this.token = token
      this.user = user
    },

    clearLocalSession() {
      this.token = null
      this.user = null
    },
  },
})