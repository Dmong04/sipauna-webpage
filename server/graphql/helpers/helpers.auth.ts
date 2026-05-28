import jwt from 'jsonwebtoken'
import { GraphQLError } from 'graphql'

export const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me-in-production'

export interface GqlContext {
    userId?: string
    roleName?: string
}

export function signToken(payload: { userId: string; roleName: string }) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function requireAdmin(ctx: GqlContext) {
    if (!ctx.userId)
        throw new GraphQLError('No autorizado', { extensions: { code: 'UNAUTHENTICATED' } })
    if (ctx.roleName !== 'admin')
        throw new GraphQLError('Acceso denegado', { extensions: { code: 'FORBIDDEN' } })
    return ctx as Required<GqlContext>
}