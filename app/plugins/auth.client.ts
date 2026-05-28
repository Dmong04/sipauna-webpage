import { useAuthStore } from '~/composables/auth'

export default defineNuxtPlugin(() => {
    const auth = useAuthStore()

    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SESSION_RESTORED') {
            const { token, user } = event.data.payload
            auth.restoreSession(token, user)
            useGqlToken(token)               // re-adjunta el JWT al cliente GraphQL
        }

        if (event.data?.type === 'SESSION_NOT_FOUND') {
            auth.clearLocalSession()
            navigateTo('/login', { replace: true })
        }
    })

    navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({ type: 'GET_SESSION' })
    })

    window.addEventListener('focus', () => {
        navigator.serviceWorker.ready.then((registration) => {
            registration.active?.postMessage({ type: 'GET_SESSION' })
        })
    })
})