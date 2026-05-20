import { supabase } from '../utils/supabase'

const VALID_STATUSES = ['pending', 'approved', 'rejected']

// ── Mappers DB (snake_case) → GraphQL (camelCase) ──────────────────────────

function mapUser(row: Record<string, any>) {
  return {
    userId:   row.user_id,
    fullname: row.fullname,
    email:    row.email,
    roleId:   row.role_id,
  }
}

function mapClassroom(row: Record<string, any>) {
  return {
    code:     row.code,
    name:     row.name,
    capacity: row.capacity,
  }
}

function mapSchedule(row: Record<string, any>) {
  return {
    id:            row.id,
    classroomCode: row.classroom_code,
    day:           row.day,
    startTime:     row.start_time,
    endTime:       row.end_time,
    subject:       row.subject,
    teacherName:   row.teacher_name,
  }
}

function mapBooking(row: Record<string, any>) {
  return {
    id:            row.id,
    classroomCode: row.classroom_code,
    requesterId:   row.requester_id,
    requesterName: row.requester_name,
    date:          row.date,
    startTime:     row.start_time,
    endTime:       row.end_time,
    reason:        row.reason,
    status:        row.status,
  }
}

// ── Resolvers ──────────────────────────────────────────────────────────────

export const resolvers = {
  Query: {
    users: async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (error) throw new Error(error.message)
      return data.map(mapUser)
    },

    user: async (_: unknown, { userId }: { userId: string }) => {
      const { data, error } = await supabase
        .from('users').select('*').eq('user_id', userId).single()
      if (error) return null
      return mapUser(data)
    },

    classrooms: async () => {
      const { data, error } = await supabase.from('classrooms').select('*').order('name')
      if (error) throw new Error(error.message)
      return data.map(mapClassroom)
    },

    classroom: async (_: unknown, { code }: { code: string }) => {
      const { data, error } = await supabase
        .from('classrooms').select('*').eq('code', code).single()
      if (error) return null
      return mapClassroom(data)
    },

    schedules: async () => {
      const { data, error } = await supabase
        .from('schedules').select('*').order('day').order('start_time')
      if (error) throw new Error(error.message)
      return data.map(mapSchedule)
    },

    bookings: async () => {
      const { data, error } = await supabase
        .from('bookings').select('*').order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data.map(mapBooking)
    },

    bookingsByUser: async (_: unknown, { userId }: { userId: string }) => {
      const { data, error } = await supabase
        .from('bookings').select('*')
        .eq('requester_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data.map(mapBooking)
    },
  },

  Mutation: {
    login: async (_: unknown, { email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase
        .from('users').select('*')
        .eq('email', email)
        .eq('password', password)
        .single()

      if (error || !data) throw new Error('Credenciales incorrectas')

      // TODO(producción): reemplazar con JWT firmado usando un secret seguro
      const token = `token-${data.user_id}-${Date.now()}`
      return { token, user: mapUser(data) }
    },

    createClassroom: async (
      _: unknown,
      { code, name, capacity }: { code: string; name: string; capacity: number }
    ) => {
      const { data, error } = await supabase
        .from('classrooms').insert({ code, name, capacity }).select().single()
      if (error) throw new Error(error.message)
      return mapClassroom(data)
    },

    updateClassroom: async (
      _: unknown,
      { code, name, capacity }: { code: string; name?: string; capacity?: number }
    ) => {
      const updates: Record<string, any> = {}
      if (name !== undefined)     updates.name     = name
      if (capacity !== undefined) updates.capacity = capacity

      const { data, error } = await supabase
        .from('classrooms').update(updates).eq('code', code).select().single()
      if (error) throw new Error('Aula no encontrada')
      return mapClassroom(data)
    },

    deleteClassroom: async (_: unknown, { code }: { code: string }) => {
      const { error } = await supabase.from('classrooms').delete().eq('code', code)
      if (error) throw new Error('Aula no encontrada')
      return true
    },

    createBooking: async (
      _: unknown,
      args: {
        classroomCode: string
        requesterId:   string
        requesterName: string
        date:          string
        startTime:     string
        endTime:       string
        reason:        string
      }
    ) => {
      const { classroomCode, requesterId, requesterName, date, startTime, endTime, reason } = args

      if (startTime >= endTime)
        throw new Error('La hora de inicio debe ser anterior a la hora de fin')

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          classroom_code: classroomCode,
          requester_id:   requesterId,
          requester_name: requesterName,
          date,
          start_time: startTime,
          end_time:   endTime,
          reason,
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return mapBooking(data)
    },

    updateBookingStatus: async (
      _: unknown,
      { id, status }: { id: string; status: string }
    ) => {
      if (!VALID_STATUSES.includes(status))
        throw new Error('Estado inválido')

      const { data, error } = await supabase
        .from('bookings').update({ status }).eq('id', id).select().single()
      if (error) throw new Error('Reservación no encontrada')
      return mapBooking(data)
    },
  },
}
