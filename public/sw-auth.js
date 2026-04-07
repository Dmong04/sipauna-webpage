const SESSION_CACHE = 'auth-session-v1'
const SESSION_KEY = 'session'
const GRAPHQL_CACHE = 'graphql-v1'
const GRAPHQL_ENDPOINT = '/api/graphql'

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.open(SESSION_CACHE).then(async (cache) => {
            const cached = await cache.match(SESSION_KEY)
            if (!cached) {
                await caches.delete(GRAPHQL_CACHE)
            }
        })
    )
})

// ─── Mensajería directa (sesión) ─────────────────────────────────────────────
self.addEventListener('message', async (event) => {
    if (event.data?.type === 'SAVE_SESSION') {
        const cache = await caches.open(SESSION_CACHE)
        const response = new Response(JSON.stringify(event.data.payload), {
            headers: { 'Content-Type': 'application/json' },
        })
        await cache.put(SESSION_KEY, response)
    }

    if (event.data?.type === 'CLEAR_SESSION') {
        const cache = await caches.open(SESSION_CACHE)
        await cache.delete(SESSION_KEY)
    }

    if (event.data?.type === 'GET_SESSION') {
        const cache = await caches.open(SESSION_CACHE)
        const cached = await cache.match(SESSION_KEY)

        if (cached) {
            const payload = await cached.json()
            if (payload?.token && payload?.user) {
                event.source.postMessage({ type: 'SESSION_RESTORED', payload })
            } else {
                await cache.delete(SESSION_KEY)
                event.source.postMessage({ type: 'SESSION_NOT_FOUND' })
            }
            event.source.postMessage({ type: 'SESSION_RESTORED', payload })
        } else {
            event.source.postMessage({ type: 'SESSION_NOT_FOUND' })
        }
    }
})

// ─── Network with Cache Update (GraphQL) ─────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url)
    if (url.pathname !== GRAPHQL_ENDPOINT) return
    if (!['GET', 'POST'].includes(event.request.method)) return

    event.respondWith(networkWithCacheUpdate(event.request))
})

const networkWithCacheUpdate = async (request) => {
    const cache = await caches.open(GRAPHQL_CACHE)
    const requestClone = request.clone()

    try {
        const networkResponse = await fetch(requestClone)
        if (networkResponse.ok) {
            const bodyClone = await request.clone().json().catch(() => null)
            const operationName = bodyClone?.operationName ?? ''

            const SKIP_CACHE = ['Login', 'CreateClassroom', 'UpdateClassroom', 'DeleteClassroom']

            if (!SKIP_CACHE.includes(operationName)) {
                cache.put(request, networkResponse.clone())
            }
        }

        return networkResponse

    } catch {
        const cached = await cache.match(request)

        if (cached) {
            console.warn('[SW] Sin red, sirviendo desde caché:', request.url)
            return cached
        }

        return new Response(
            JSON.stringify({ errors: [{ message: 'Sin conexión y sin caché disponible' }] }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
    }
}