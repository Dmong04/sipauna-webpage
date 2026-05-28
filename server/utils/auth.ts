import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { GraphQLError } from 'graphql'

// ── Validación de entorno (fail-fast) ─────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('[Auth] Falta la variable de entorno JWT_SECRET')
}

const BCRYPT_COST = 12
const TOKEN_TTL   = '7d' // prototipo; en producción usar 15m + refresh tokens

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  userId:   string
  roleName: string
}

export interface GqlContext {
  user: AuthUser | null
}

// ── Password hashing (bcrypt) ──────────────────────────────────────────────────

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

// ── JWT firmado ─────────────────────────────────────────────────────────────────

export function signToken(payload: AuthUser): string {
  // sub = userId, role = roleName (solo lo necesario, sin PII)
  return jwt.sign(
    { sub: payload.userId, role: payload.roleName },
    JWT_SECRET!,
    { expiresIn: TOKEN_TTL, algorithm: 'HS256' }
  )
}

function verifyToken(token: string): AuthUser | null {
  try {
    // algorithms acotado explícitamente → rechaza alg:none y otros
    const decoded = jwt.verify(token, JWT_SECRET!, { algorithms: ['HS256'] }) as jwt.JwtPayload
    if (!decoded.sub || typeof decoded.role !== 'string') return null
    return { userId: String(decoded.sub), roleName: decoded.role }
  } catch {
    return null
  }
}

/** Extrae y verifica el usuario desde el header `Authorization: Bearer <token>`. */
export function getUserFromAuthHeader(authHeader: string | null | undefined): AuthUser | null {
  if (!authHeader) return null
  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return verifyToken(token)
}

// ── Guards de autorización para resolvers ───────────────────────────────────────

export function requireAuth(ctx: GqlContext): AuthUser {
  if (!ctx.user) {
    throw new GraphQLError('No autenticado', { extensions: { code: 'UNAUTHENTICATED' } })
  }
  return ctx.user
}

export function requireAdmin(ctx: GqlContext): AuthUser {
  const user = requireAuth(ctx)
  if (user.roleName !== 'admin') {
    throw new GraphQLError('No autorizado: se requiere rol administrador', {
      extensions: { code: 'FORBIDDEN' },
    })
  }
  return user
}
