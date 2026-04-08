export type BookingStatus = 'pending' | 'approved' | 'rejected'

export interface Booking {
  id: string
  classroomCode: string
  requesterId: string
  requesterName: string
  date: string
  startTime: string
  endTime: string
  reason: string
  status: BookingStatus
}

export const bookings: Booking[] = [
  {
    id: 'b1',
    classroomCode: '34523',
    requesterId: 'u2',
    requesterName: 'Christopher Lamberti Chavarría',
    date: '2026-04-15',
    startTime: '14:00',
    endTime: '16:00',
    reason: 'Sesión de estudio grupal para el proyecto final de EIF413',
    status: 'pending',
  },
  {
    id: 'b2',
    classroomCode: '12124',
    requesterId: 'u3',
    requesterName: 'Pablo González Rodríguez',
    date: '2026-04-12',
    startTime: '10:00',
    endTime: '12:00',
    reason: 'Revisión de avance con estudiantes de laboratorio',
    status: 'approved',
  },
]
