export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/manifest.webmanifest']
  if (publicRoutes.includes(to.path)) return

  const auth = useAuthStore()

  if (!auth.isAuthenticated) {
    const token = localStorage.getItem('auth_token')
    const userRaw = localStorage.getItem('auth_user')
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw)
        auth.restoreSession(token, user)
      } catch { }
    }
  }

  if (!auth.isAuthenticated) {
    await new Promise<void>((resolve) => {
        if (!('serviceWorker' in navigator)) return resolve()

        const timeout = setTimeout(resolve, 800)

        const handler = (event: MessageEvent) => {
            if (
                event.data?.type === 'SESSION_RESTORED' ||
                event.data?.type === 'SESSION_NOT_FOUND'
            ) {
                if (event.data?.type === 'SESSION_RESTORED') {
                    const { token, user } = event.data.payload
                    auth.restoreSession(token, user)
                    useGqlToken(token)
                } else {
                    auth.clearLocalSession()
                }
                clearTimeout(timeout)
                navigator.serviceWorker.removeEventListener('message', handler)
                resolve()
            }
        }

        navigator.serviceWorker.addEventListener('message', handler)

        navigator.serviceWorker.ready.then((registration) => {
          registration.active?.postMessage({ type: 'GET_SESSION' })
        })
    })
  }

  if (to.path === '/') {
    return auth.isAuthenticated
      ? navigateTo('/dashboard', { replace: true })
      : navigateTo('/login', { replace: true })
  }

  if (auth.isAuthenticated && to.path === '/login') {
    return navigateTo('/dashboard/', { replace: true })
  }

  if (!auth.isAuthenticated && to.path.startsWith('/dashboard')) {
    return navigateTo('/login', { replace: true })
  }
})