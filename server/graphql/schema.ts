import { readFileSync } from 'fs'
import { resolve } from 'path'

export const typeDefs = readFileSync(
    resolve('./server/graphql/schema.graphql'),
    'utf-8'
)