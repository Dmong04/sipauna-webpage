import { supabase } from '../utils/supabase'

const VALID_STATUSES = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO']

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
    users: async () => {
      const { data, error } = await supabase
        .from('User')
        .select('userId, email, roleId, Role(name)')
      if (error) throw new Error(error.message)

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

    user: async (_: unknown, { userId }: { userId: string }) => {
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

    classrooms: async () => {
      const { data, error } = await supabase
        .from('Classroom').select('*').order('code')
      if (error) throw new Error(error.message)
      return (data as any[]).map(mapClassroom)
    },

    classroom: async (_: unknown, { classroomId }: { classroomId: string }) => {
      const { data, error } = await supabase
        .from('Classroom').select('*').eq('classroomId', classroomId).single()
      if (error) return null
      return mapClassroom(data)
    },

    schedules: async () => {
      const { data, error } = await supabase
        .from('Schedule')
        .select(`
          scheduleId, day, startTime, endTime,
          Classroom(code),
          Course(name, Professor(fullName))
        `)
        .order('day')
        .order('startTime')
      if (error) throw new Error(error.message)
      return (data as any[]).map(mapSchedule)
    },

    loans: async () => {
      const { data, error } = await supabase
        .from('Loan')
        .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
        .order('createdAt', { ascending: false })
      if (error) throw new Error(error.message)

      const userIds = [...new Set((data as any[]).map(l => l.userId))]
      const nameMap = await getProfileFullNames(userIds)
      return (data as any[]).map(l => mapLoan(l, nameMap))
    },

    loansByUser: async (_: unknown, { userId }: { userId: string }) => {
      const { data, error } = await supabase
        .from('Loan')
        .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
      if (error) throw new Error(error.message)

      const nameMap = await getProfileFullNames([userId])
      return (data as any[]).map(l => mapLoan(l, nameMap))
    },
  },

  Mutation: {
    login: async (_: unknown, { email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase
        .from('User')
        .select('userId, email, roleId, Role(name)')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (error || !data) throw new Error('Credenciales incorrectas')

      const nameMap = await getProfileFullNames([(data as any).userId])
      const token   = `token-${(data as any).userId}-${Date.now()}`

      return {
        token,
        user: {
          userId:   (data as any).userId,
          email:    (data as any).email,
          fullname: nameMap[(data as any).userId] ?? 'Usuario',
          roleId:   (data as any).roleId,
          roleName: (data as any).Role?.name ?? '',
        },
      }
    },

    createClassroom: async (
      _: unknown,
      { code, capacity }: { code: string; capacity: number }
    ) => {
      const { data, error } = await supabase
        .from('Classroom').insert({ code, capacity }).select().single()
      if (error) throw new Error(error.message)
      return mapClassroom(data)
    },

    updateClassroom: async (
      _: unknown,
      { classroomId, code, capacity }: { classroomId: string; code?: string; capacity?: number }
    ) => {
      const updates: Record<string, any> = {}
      if (code     !== undefined) updates.code     = code
      if (capacity !== undefined) updates.capacity = capacity

      const { data, error } = await supabase
        .from('Classroom').update(updates).eq('classroomId', classroomId).select().single()
      if (error) throw new Error('Aula no encontrada')
      return mapClassroom(data)
    },

    deleteClassroom: async (_: unknown, { classroomId }: { classroomId: string }) => {
      const { error } = await supabase
        .from('Classroom').delete().eq('classroomId', classroomId)
      if (error) throw new Error('Aula no encontrada')
      return true
    },

    createLoan: async (
      _: unknown,
      args: {
        classroomCode: string
        userId:        string
        loanDate:      string
        startTime:     string
        endTime:       string
        reason:        string
      }
    ) => {
      const { classroomCode, userId, loanDate, startTime, endTime, reason } = args

      if (startTime >= endTime)
        throw new Error('La hora de inicio debe ser anterior a la hora de fin')

      // Validar que el userId existe
      const { data: userCheck } = await supabase
        .from('User').select('userId').eq('userId', userId).maybeSingle()
      if (!userCheck) throw new Error('Sesión inválida. Por favor cerrá sesión e iniciá de nuevo.')

      // Resolver code → classroomId
      const { data: cls, error: clsErr } = await supabase
        .from('Classroom').select('classroomId').eq('code', classroomCode).single()
      if (clsErr || !cls) throw new Error('Aula no encontrada')

      const { data, error } = await supabase
        .from('Loan')
        .insert({
          classroomId: (cls as any).classroomId,
          userId,
          loanDate:    `${loanDate}T00:00:00`,
          startTime,
          endTime,
          reason,
          status: 'PENDIENTE',
        })
        .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
        .single()

      if (error) throw new Error(error.message)

      const nameMap = await getProfileFullNames([userId])
      return mapLoan(data as any, nameMap)
    },

    updateLoanStatus: async (
      _: unknown,
      { loanId, status }: { loanId: string; status: string }
    ) => {
      if (!VALID_STATUSES.includes(status))
        throw new Error('Estado inválido')

      const { data, error } = await supabase
        .from('Loan')
        .update({ status })
        .eq('loanId', loanId)
        .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
        .single()

      if (error) throw new Error('Préstamo no encontrado')

      const nameMap = await getProfileFullNames([(data as any).userId])
      return mapLoan(data as any, nameMap)
    },
  },
}
