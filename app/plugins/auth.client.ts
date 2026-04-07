import { useAuthStore } from '~/composables/auth'

export default defineNuxtPlugin(() => {
    const auth = useAuthStore()

    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.register('/sw-auth.js').then((registration) => {
        console.log('[SW] Registrado:', registration.scope)
    })

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SESSION_RESTORED') {
            const { token, user } = event.data.payload
            auth.restoreSession(token, user)
        }

        if (event.data?.type === 'SESSION_NOT_FOUND') {
            auth.clearLocalSession()
            // 👇 Forzamos redirección al login desde el plugin
            navigateTo('/login', { replace: true })
        }
    })

    navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({ type: 'GET_SESSION' })
    })

    // 👇 Verificamos la sesión cada vez que la tab recupera el foco
    window.addEventListener('focus', () => {
        navigator.serviceWorker.ready.then((registration) => {
            registration.active?.postMessage({ type: 'GET_SESSION' })
        })
    })
})