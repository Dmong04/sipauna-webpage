import { makeExecutableSchema } from "@graphql-tools/schema";
import { createYoga } from "graphql-yoga";
import { resolvers } from "../graphql/resolvers";
import { typeDefs } from "../graphql/schema"
import { getUserFromAuthHeader, type GqlContext } from "../utils/auth"

const yoga = createYoga<GqlContext>({
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    graphqlEndpoint: '/api/graphql',
    graphiql: process.env.NODE_ENV === 'development',
    // Contexto: verifica el JWT del header Authorization en cada request
    context: ({ request }): GqlContext => ({
        user: getUserFromAuthHeader(request.headers.get('authorization')),
    }),
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