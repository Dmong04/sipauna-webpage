import { GraphQLError } from 'graphql'
import { supabase } from '../utils/supabase'
import {
  hashPassword,
  verifyPassword,
  signToken,
  requireAuth,
  requireAdmin,
  type GqlContext,
} from '../utils/auth'

const VALID_STATUSES = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO']

// Mapeo rol → tabla de perfil y columna del nombre
const PROFILE_BY_ROLE: Record<string, { table: string; nameCol: string }> = {
  admin:      { table: 'Admin',     nameCol: 'fullName' },
  profesor:   { table: 'Professor', nameCol: 'fullName' },
  estudiante: { table: 'Student',   nameCol: 'fullName' },
  invitado:   { table: 'Guest',     nameCol: 'fullname' },
}

// ── Helper: resolve display name for one or many userIds ──────────────────────

async function getProfileFullNames(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {}

  const [admins, profs, students, guests] = await Promise.all([
    supabase.from('Admin').select('userId, fullName').in('userId', userIds),
    supabase.from('Professor').select('userId, fullName').in('userId', userIds),
    supabase.from('Student').select('userId, fullName').in('userId', userIds),
    supabase.from('Guest').select('userId, fullname').in('userId', userIds),
  ])

  const map: Record<string, string> = {}
  admins.data?.forEach(r => { map[r.userId] = r.fullName })
  profs.data?.forEach(r => { map[r.userId] = r.fullName })
  students.data?.forEach(r => { map[r.userId] = r.fullName })
  guests.data?.forEach(r => { map[r.userId] = r.fullname })
  return map
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapClassroom(row: Record<string, any>) {
  return {
    classroomId: row.classroomId,
    code:        row.code,
    capacity:    row.capacity,
  }
}

function mapSchedule(row: Record<string, any>) {
  return {
    scheduleId:    row.scheduleId,
    classroomCode: row.Classroom?.code ?? '',
    day:           row.day,
    startTime:     row.startTime,
    endTime:       row.endTime,
    subject:       row.Course?.name ?? '',
    teacherName:   row.Course?.Professor?.fullName ?? '',
  }
}

function mapLoan(row: Record<string, any>, nameMap: Record<string, string>) {
  return {
    loanId:        row.loanId,
    classroomCode: row.Classroom?.code ?? '',
    userId:        row.userId,
    requesterName: nameMap[row.userId] ?? 'Desconocido',
    loanDate:      row.loanDate ? String(row.loanDate).slice(0, 10) : '',
    startTime:     row.startTime,
    endTime:       row.endTime,
    reason:        row.reason,
    status:        row.status,
  }
}

// ── Resolvers ─────────────────────────────────────────────────────────────────

export const resolvers = {
  Query: {
    users: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireAdmin(ctx)

      const { data, error } = await supabase
        .from('User')
        .select('userId, email, roleId, Role(name)')
      if (error) throw new GraphQLError(error.message)

      const userIds = (data as any[]).map(u => u.userId)
      const nameMap = await getProfileFullNames(userIds)

      return (data as any[]).map(u => ({
        userId:   u.userId,
        email:    u.email,
        fullname: nameMap[u.userId] ?? 'Usuario',
        roleId:   u.roleId,
        roleName: u.Role?.name ?? '',
      }))
    },

    user: async (_: unknown, { userId }: { userId: string }, ctx: GqlContext) => {
      const caller = requireAuth(ctx)
      // Un usuario solo puede consultarse a sí mismo, salvo que sea admin
      if (caller.roleName !== 'admin' && caller.userId !== userId) {
        throw new GraphQLError('No autorizado', { extensions: { code: 'FORBIDDEN' } })
      }

      const { data, error } = await supabase
        .from('User')
        .select('userId, email, roleId, Role(name)')
        .eq('userId', userId)
        .single()
      if (error) return null

      const nameMap = await getProfileFullNames([userId])
      return {
        userId,
        email:    data.email,
        fullname: nameMap[userId] ?? 'Usuario',
        roleId:   (data as any).roleId,
        roleName: (data as any).Role?.name ?? '',
      }
    },

    roles: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireAdmin(ctx)
      const { data, error } = await supabase
        .from('Role').select('roleId, name').order('name')
      if (error) throw new GraphQLError(error.message)
      return data
    },

    classrooms: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireAuth(ctx)
      const { data, error } = await supabase
        .from('Classroom').select('*').order('code')
      if (error) throw new GraphQLError(error.message)
      return (data as any[]).map(mapClassroom)
    },

    classroom: async (_: unknown, { classroomId }: { classroomId: string }, ctx: GqlContext) => {
      requireAuth(ctx)
      const { data, error } = await supabase
        .from('Classroom').select('*').eq('classroomId', classroomId).single()
      if (error) return null
      return mapClassroom(data)
    },

    schedules: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireAuth(ctx)
      const { data, error } = await supabase
        .from('Schedule')
        .select(`
          scheduleId, day, startTime, endTime,
          Classroom(code),
          Course(name, Professor(fullName))
        `)
        .order('day')
        .order('startTime')
      if (error) throw new GraphQLError(error.message)
      return (data as any[]).map(mapSchedule)
    },

    loans: async (_: unknown, __: unknown, ctx: GqlContext) => {
      requireAdmin(ctx)
      const { data, error } = await supabase
        .from('Loan')
        .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
        .order('createdAt', { ascending: false })
      if (error) throw new GraphQLError(error.message)

      const userIds = [...new Set((data as any[]).map(l => l.userId))]
      const nameMap = await getProfileFullNames(userIds)
      return (data as any[]).map(l => mapLoan(l, nameMap))
    },

    loansByUser: async (_: unknown, { userId }: { userId: string }, ctx: GqlContext) => {
      const caller = requireAuth(ctx)
      // Un usuario no-admin solo puede ver sus propios préstamos
      const targetId = caller.roleName === 'admin' ? userId : caller.userId

      const { data, error } = await supabase
        .from('Loan')
        .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
        .eq('userId', targetId)
        .order('createdAt', { ascending: false })
      if (error) throw new GraphQLError(error.message)

      const nameMap = await getProfileFullNames([targetId])
      return (data as any[]).map(l => mapLoan(l, nameMap))
    },
  },

  Mutation: {
    login: async (_: unknown, { email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase
        .from('User')
        .select('userId, email, password, roleId, Role(name)')
        .eq('email', email)
        .single()

      // Mensaje genérico: no revela si el correo existe (anti enumeración)
      if (error || !data) throw new GraphQLError('Credenciales incorrectas')

      const ok = await verifyPassword(password, (data as any).password)
      if (!ok) throw new GraphQLError('Credenciales incorrectas')

      const roleName = (data as any).Role?.name ?? ''
      const nameMap  = await getProfileFullNames([(data as any).userId])
      const token    = signToken({ userId: (data as any).userId, roleName })

      return {
        token,
        user: {
          userId:   (data as any).userId,
          email:    (data as any).email,
          fullname: nameMap[(data as any).userId] ?? 'Usuario',
          roleId:   (data as any).roleId,
          roleName,
        },
      }
    },

    register: async (
      _: unknown,
      { fullname, email, password, roleName: requestedRole }:
        { fullname: string; email: string; password: string; roleName?: string }
    ) => {
      if (!fullname?.trim() || !email?.trim() || !password)
        throw new GraphQLError('Todos los campos son obligatorios')
      if (password.length < 8)
        throw new GraphQLError('La contraseña debe tener al menos 8 caracteres')

      // Solo profesor y estudiante pueden auto-registrarse
      const roleName = requestedRole === 'profesor' ? 'profesor' : 'estudiante'
      const profile  = PROFILE_BY_ROLE[roleName]

      const { data: existing } = await supabase
        .from('User').select('userId').eq('email', email).maybeSingle()
      if (existing) throw new GraphQLError('El correo ya está registrado')

      const { data: role, error: roleErr } = await supabase
        .from('Role').select('roleId').eq('name', roleName).single()
      if (roleErr || !role) throw new GraphQLError('No se pudo asignar el rol')

      const hash = await hashPassword(password)

      const { data: newUser, error: userErr } = await supabase
        .from('User')
        .insert({ email, password: hash, roleId: (role as any).roleId })
        .select('userId, email, roleId')
        .single()
      if (userErr || !newUser) throw new GraphQLError('No se pudo crear el usuario')

      const prefix = roleName === 'profesor' ? 'PROF' : 'EST'
      await supabase.from(profile.table).insert({
        [profile.nameCol]: fullname.trim(),
        legalId:           `${prefix}-${Date.now()}`,
        userId:            (newUser as any).userId,
      })

      const token = signToken({ userId: (newUser as any).userId, roleName })
      return {
        token,
        user: {
          userId:   (newUser as any).userId,
          email:    (newUser as any).email,
          fullname: fullname.trim(),
          roleId:   (newUser as any).roleId,
          roleName,
        },
      }
    },

    // ── Administración de usuarios (solo admin) ─────────────────────────────────

    createUser: async (
      _: unknown,
      args: { fullname: string; email: string; password: string; roleName: string; legalId: string },
      ctx: GqlContext
    ) => {
      requireAdmin(ctx)
      const { fullname, email, password, roleName, legalId } = args

      const profile = PROFILE_BY_ROLE[roleName]
      if (!profile) throw new GraphQLError('Rol inválido')
      if (!fullname?.trim() || !email?.trim() || !legalId?.trim())
        throw new GraphQLError('Todos los campos son obligatorios')
      if (!password || password.length < 8)
        throw new GraphQLError('La contraseña debe tener al menos 8 caracteres')

      // ¿Correo ya registrado?
      const { data: existing } = await supabase
        .from('User').select('userId').eq('email', email).maybeSingle()
      if (existing) throw new GraphQLError('El correo ya está registrado')

      const { data: role, error: roleErr } = await supabase
        .from('Role').select('roleId').eq('name', roleName).single()
      if (roleErr || !role) throw new GraphQLError('Rol no encontrado')

      const hash = await hashPassword(password)

      const { data: newUser, error: userErr } = await supabase
        .from('User')
        .insert({ email, password: hash, roleId: (role as any).roleId })
        .select('userId, email, roleId')
        .single()
      if (userErr || !newUser) throw new GraphQLError('No se pudo crear el usuario')

      // Crear el perfil en la tabla correspondiente al rol
      const { error: profErr } = await supabase
        .from(profile.table)
        .insert({ [profile.nameCol]: fullname.trim(), legalId: legalId.trim(), userId: (newUser as any).userId })

      if (profErr) {
        // Rollback manual del User si el perfil falla (p.ej. legalId duplicado)
        await supabase.from('User').delete().eq('userId', (newUser as any).userId)
        throw new GraphQLError('No se pudo crear el perfil (¿identificación duplicada?)')
      }

      return {
        userId:   (newUser as any).userId,
        email:    (newUser as any).email,
        fullname: fullname.trim(),
        roleId:   (newUser as any).roleId,
        roleName,
      }
    },

    updateUserRole: async (
      _: unknown,
      { userId, roleName }: { userId: string; roleName: string },
      ctx: GqlContext
    ) => {
      const caller = requireAdmin(ctx)
      if (!PROFILE_BY_ROLE[roleName]) throw new GraphQLError('Rol inválido')
      if (caller.userId === userId)
        throw new GraphQLError('No puede cambiar su propio rol')

      const { data: role, error: roleErr } = await supabase
        .from('Role').select('roleId').eq('name', roleName).single()
      if (roleErr || !role) throw new GraphQLError('Rol no encontrado')

      const { data, error } = await supabase
        .from('User')
        .update({ roleId: (role as any).roleId })
        .eq('userId', userId)
        .select('userId, email, roleId')
        .single()
      if (error) throw new GraphQLError('Usuario no encontrado')

      const nameMap = await getProfileFullNames([userId])
      return {
        userId:   (data as any).userId,
        email:    (data as any).email,
        fullname: nameMap[userId] ?? 'Usuario',
        roleId:   (data as any).roleId,
        roleName,
      }
    },

    deleteUser: async (_: unknown, { userId }: { userId: string }, ctx: GqlContext) => {
      const caller = requireAdmin(ctx)
      if (caller.userId === userId)
        throw new GraphQLError('No puede eliminar su propia cuenta')

      // Orden por FKs: préstamos (RESTRICT) → perfiles → usuario
      await supabase.from('Loan').delete().eq('userId', userId)
      await Promise.all([
        supabase.from('Admin').delete().eq('userId', userId),
        supabase.from('Professor').delete().eq('userId', userId),
        supabase.from('Student').delete().eq('userId', userId),
        supabase.from('Guest').delete().eq('userId', userId),
      ])
      const { error } = await supabase.from('User').delete().eq('userId', userId)
      if (error) throw new GraphQLError('No se pudo eliminar el usuario')
      return true
    },

    createClassroom: async (
      _: unknown,
      { code, capacity }: { code: string; capacity: number },
      ctx: GqlContext
    ) => {
      requireAdmin(ctx)
      const { data, error } = await supabase
        .from('Classroom').insert({ code, capacity }).select().single()
      if (error) throw new GraphQLError(error.message)
      return mapClassroom(data)
    },

    updateClassroom: async (
      _: unknown,
      { classroomId, code, capacity }: { classroomId: string; code?: string; capacity?: number },
      ctx: GqlContext
    ) => {
      requireAdmin(ctx)
      const updates: Record<string, any> = {}
      if (code     !== undefined) updates.code     = code
      if (capacity !== undefined) updates.capacity = capacity

      const { data, error } = await supabase
        .from('Classroom').update(updates).eq('classroomId', classroomId).select().single()
      if (error) throw new GraphQLError('Aula no encontrada')
      return mapClassroom(data)
    },

    deleteClassroom: async (_: unknown, { classroomId }: { classroomId: string }, ctx: GqlContext) => {
      requireAdmin(ctx)
      const { error } = await supabase
        .from('Classroom').delete().eq('classroomId', classroomId)
      if (error) throw new GraphQLError('Aula no encontrada')
      return true
    },

    createLoan: async (
      _: unknown,
      args: {
        classroomCode: string
        loanDate:      string
        startTime:     string
        endTime:       string
        reason:        string
      },
      ctx: GqlContext
    ) => {
      // El userId se deriva del token, NUNCA del cliente (evita suplantación)
      const caller = requireAuth(ctx)
      const { classroomCode, loanDate, startTime, endTime, reason } = args

      if (startTime >= endTime)
        throw new GraphQLError('La hora de inicio debe ser anterior a la hora de fin')

      // Resolver code → classroomId
      const { data: cls, error: clsErr } = await supabase
        .from('Classroom').select('classroomId').eq('code', classroomCode).single()
      if (clsErr || !cls) throw new GraphQLError('Aula no encontrada')

      const { data, error } = await supabase
        .from('Loan')
        .insert({
          classroomId: (cls as any).classroomId,
          userId:      caller.userId,
          loanDate:    `${loanDate}T00:00:00`,
          startTime,
          endTime,
          reason,
          status: 'PENDIENTE',
        })
        .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
        .single()

      if (error) throw new GraphQLError(error.message)

      const nameMap = await getProfileFullNames([caller.userId])
      return mapLoan(data as any, nameMap)
    },

    updateLoanStatus: async (
      _: unknown,
      { loanId, status }: { loanId: string; status: string },
      ctx: GqlContext
    ) => {
      requireAdmin(ctx)
      if (!VALID_STATUSES.includes(status))
        throw new GraphQLError('Estado inválido')

      const { data, error } = await supabase
        .from('Loan')
        .update({ status })
        .eq('loanId', loanId)
        .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
        .single()

      if (error) throw new GraphQLError('Préstamo no encontrado')

      const nameMap = await getProfileFullNames([(data as any).userId])
      return mapLoan(data as any, nameMap)
    },
  },
}
