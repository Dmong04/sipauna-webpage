import { users }      from './data/users'
import { classrooms } from './data/classrooms'
import { schedules }  from './data/schedules'
import { bookings, type Booking, type BookingStatus } from './data/bookings'

// Copias mutables de los datos mock
let mockUsers      = [...users]
let mockClassrooms = [...classrooms]
let mockSchedules  = [...schedules]
let mockBookings   = [...bookings]

let bookingCounter = mockBookings.length + 1

const VALID_STATUSES: BookingStatus[] = ['pending', 'approved', 'rejected']

export const resolvers = {
  Query: {
    users: () => mockUsers,
    user: (_: unknown, { userId }: { userId: string }) =>
      mockUsers.find(u => u.userId === userId) ?? null,

    classrooms: () => mockClassrooms,
    classroom: (_: unknown, { code }: { code: string }) =>
      mockClassrooms.find(c => c.code === code) ?? null,

    schedules: () => mockSchedules,

    bookings: () => mockBookings,
    bookingsByUser: (_: unknown, { userId }: { userId: string }) =>
      mockBookings.filter(b => b.requesterId === userId),
  },

  Mutation: {
    login: (_: unknown, { email, password }: { email: string; password: string }) => {
      const user = mockUsers.find(u => u.email === email && u.password === password)
      if (!user) throw new Error('Invalid credentials')
      // TODO(producción): generar JWT firmado con secret real
      const token = `mock-token-${user.userId}`
      return { token, user }
    },

    createClassroom: (
      _: unknown,
      { code, name, capacity }: { code: string; name: string; capacity: number }
    ) => {
      if (mockClassrooms.some(c => c.code === code))
        throw new Error('Ya existe un aula con ese código')
      const classroom = { code, name, capacity }
      mockClassrooms.push(classroom)
      return classroom
    },

    updateClassroom: (
      _: unknown,
      { code, name, capacity }: { code: string; name?: string; capacity?: number }
    ) => {
      const classroom = mockClassrooms.find(c => c.code === code)
      if (!classroom) throw new Error('Aula no encontrada')
      if (name     !== undefined) classroom.name     = name
      if (capacity !== undefined) classroom.capacity = capacity
      return classroom
    },

    deleteClassroom: (_: unknown, { code }: { code: string }) => {
      const index = mockClassrooms.findIndex(c => c.code === code)
      if (index === -1) throw new Error('Aula no encontrada')
      mockClassrooms.splice(index, 1)
      return true
    },

    createBooking: (
      _: unknown,
      args: {
        classroomCode: string
        requesterId: string
        requesterName: string
        date: string
        startTime: string
        endTime: string
        reason: string
      }
    ) => {
      const { classroomCode, requesterId, requesterName, date, startTime, endTime, reason } = args

      if (!mockClassrooms.some(c => c.code === classroomCode))
        throw new Error('Aula no encontrada')

      if (startTime >= endTime)
        throw new Error('La hora de inicio debe ser anterior a la hora de fin')

      // TODO(producción): derivar requesterId del JWT verificado, no del cliente
      const booking: Booking = {
        id: `b${bookingCounter++}`,
        classroomCode,
        requesterId,
        requesterName,
        date,
        startTime,
        endTime,
        reason,
        status: 'pending',
      }

      mockBookings.push(booking)
      return booking
    },

    updateBookingStatus: (
      _: unknown,
      { id, status }: { id: string; status: string }
    ) => {
      if (!VALID_STATUSES.includes(status as BookingStatus))
        throw new Error('Estado inválido')

      const booking = mockBookings.find(b => b.id === id)
      if (!booking) throw new Error('Reservación no encontrada')

      booking.status = status as BookingStatus
      return booking
    },
  },
}
