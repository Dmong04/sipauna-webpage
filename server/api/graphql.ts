import { makeExecutableSchema } from "@graphql-tools/schema";
import { createYoga } from "graphql-yoga";
import fs from 'fs'
import path from 'path'
import { resolvers } from "../graphql/resolvers";

const typeDefs = fs.readFileSync(
  path.resolve('./server/graphql/schema.graphql'),
  'utf-8'
)
const yoga = createYoga({
    schema: makeExecutableSchema({ typeDefs, resolvers }),
    graphqlEndpoint: '/api/graphql',
    graphiql: process.env.NODE_ENV === 'development',
})

export default defineEventHandler(async (event) => {
    const request = toWebRequest(event)
    const response = await yoga.fetch(request)

    const body = await response.text()

    return new Response(body, {
        status: response.status,
        headers: response.headers,
    })
})