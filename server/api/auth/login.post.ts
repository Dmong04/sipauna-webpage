import jwt from 'jsonwebtoken'
import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  const supabase = serverSupabaseServiceRole(event)  // sin await, no es async

  const { data, error } = await supabase
    .from('User')
    .select('userId, email, roleId')
    .eq('email', email)
    .eq('password', password)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 401, message: 'Credenciales incorrectas' })
  }

  const token = jwt.sign(
    { userId: data.userId, email: data.email, roleId: data.roleId },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  )

  return { token, user: data }
})