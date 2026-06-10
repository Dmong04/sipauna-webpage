import { makeExecutableSchema } from "@graphql-tools/schema";
import { createYoga } from "graphql-yoga";
import jwt from 'jsonwebtoken'
import { resolvers } from "../graphql/resolvers.index";
import { typeDefs } from "../graphql/schema"

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error(
    '[SIPAUNA] JWT_SECRET no está configurado. ' +
    'Definí la variable de entorno JWT_SECRET antes de iniciar el servidor.'
  )
}

const yoga = createYoga({
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    graphqlEndpoint: '/api/graphql',
    graphiql: process.env.NODE_ENV === 'development',
    context: ({ request }) => {
        const auth = request.headers.get('authorization') ?? ''
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
        if (!token) return {}
        try {
            const payload = jwt.verify(token, JWT_SECRET) as any
            return { userId: payload.userId, roleName: payload.roleName }
        } catch {
            return {}
        }
    },
})

export default defineEventHandler(async (event) => {
    setResponseHeaders(event, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })

    if (event.method === 'OPTIONS') {
        return null
    }
    const request = toWebRequest(event)
    const response = await yoga.fetch(request)

    const body = await response.text()

    return new Response(body, {
        status: response.status,
        headers: response.headers,
    })
})