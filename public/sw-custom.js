const SESSION_CACHE = 'auth-session-v1'
const SESSION_KEY = 'session'

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

    if (event.data?.type === 'CLEAR_GRAPHQL_CACHE') {
        await caches.delete('graphql-v1')
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
        } else {
            event.source.postMessage({ type: 'SESSION_NOT_FOUND' })
        }
    }
})