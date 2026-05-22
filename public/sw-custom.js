


const SESSION_CACHE = 'auth-session-v1'
const SESSION_KEY = 'session'
const GRAPHQL_CACHE='graphql-v1'
const STATIC_CACHE='static-v1'

const static_assets=[
    '/',
    '/dashboard',
    '/dashboard/availability',
    '/dashboard/schedules',
    '/dashboard/booking'
]

self.addEventListener('install',(event)=>{
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache=>{
            return cache.addAll(static_assets)
        })
    )
    self.skipWaiting()
})


self.addEventListener('activate',(event)=>{
    event.waitUntil(
        caches.keys().then(keys=>
            Promise.all(
                keys
                .filter(key=> ![STATIC_CACHE,GRAPHQL_CACHE,SESSION_CACHE].includes(key))
                .map(key=>caches.delete(key))
            )
        ).then(()=>self.clients.claim())
    )
})

//sesion en cache
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
        await caches.delete(GRAPHQL_CACHE)
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




self.addEventListener('fetch',(event)=>{


    const url =new URL(event.request.url)
    if(!url.protocol.startsWith('http'))return

    let resp
    if(event.request.method==='POST' && url.pathname==='/api/graphql'){
        resp=fetch(event.request).then(async networkResp=>{
            const data=await networkResp.clone().json()

            if(data?.data?.users){
                const cache=await caches.open(GRAPHQL_CACHE)
                await cache.put('users',networkResp.clone())
            }
            return networkResp
        })

        .catch(async()=>{
            const body=await event.request.clone().text()
            const bodyData=JSON.parse(body)
                //Validar los datos aca!
                if(bodyData.query.includes('mutation')){
                    return new Response(
                         JSON.stringify({ ok: false, offline: true, message: 'Mutacion offline' }),
                        { headers: { 'Content-Type': 'application/json' } }
                    )
                }
                //Aun no funciona porque no se llegan los datos 
                if(bodyData.query.includes('users')){
                    const cached= await caches.match('users')
                    return cached ?? new Response(
                        JSON.stringify({ ok: false, offline: true, message: 'Sin cache de users' }),
                        { headers: { 'Content-Type': 'application/json' } })
                }
                
                return new Response(JSON.stringify({
                        ok:false,
                        offline:true
                    }), {headers:{
                            'Content-Type':
                            'application/json'
                        }
                    }
                )
            
        })
        event.respondWith(resp)
        return
       
    }
    if(url.pathname.startsWith('/_nuxt/')){
        event.respondWith(
            caches.match(event.request).then(cached=>{
                if(cached)return cached
                return fetch(event.request).then(networkResp=>{
                    const clone =networkResp.clone()
                    caches.open(STATIC_CACHE).then(cache=>{
                        cache.put(event.request,clone)
                    })
                    return networkResp
                }).catch(()=>new Response('Offline',{status:503}))
            })
        )
        return
    }


      if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached

                return fetch(event.request).then(networkResp => {
                    const clone=networkResp.clone()
                    caches.open(STATIC_CACHE).then(cache => {
                        cache.put(event.request, clone)
                    })
                    return networkResp
                }).catch(async () => {
                    const fallback = await caches.match('/')
                    return fallback ?? new Response('Offline', { status: 503 })
                })
            })
        )
        return
    }

   event.respondWith(
    fetch(event.request).then(networkResp => {
        const clone = networkResp.clone()
        caches.open(STATIC_CACHE).then(cache => {
            cache.put(event.request, clone)
        })
        return networkResp
    }).catch(async () => {
        const cached = await caches.match(event.request)
        return cached ?? new Response('Offline', { status: 503 })
    })
)
})


self.addEventListener('sync',event=>{
    if(event.tag==='sync-add-user'){
        console.log('Sincronizando al server');
    }
})
    