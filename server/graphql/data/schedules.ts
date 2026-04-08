export interface Schedule {
  id: string
  classroomCode: string
  day: string
  startTime: string
  endTime: string
  subject: string
  teacherName: string
}

export const schedules: Schedule[] = [
  { id: 's1', classroomCode: '34523', day: 'Lunes',    startTime: '07:00', endTime: '09:00', subject: 'Cálculo I',        teacherName: 'Dereck Monge Chaves' },
  { id: 's2', classroomCode: '34523', day: 'Lunes',    startTime: '09:00', endTime: '11:00', subject: 'Programación I',   teacherName: 'Pablo González Rodríguez' },
  { id: 's3', classroomCode: '12124', day: 'Martes',   startTime: '07:00', endTime: '09:00', subject: 'Bases de Datos',   teacherName: 'Dereck Monge Chaves' },
  { id: 's4', classroomCode: '12124', day: 'Martes',   startTime: '13:00', endTime: '15:00', subject: 'Álgebra Lineal',   teacherName: 'Pablo González Rodríguez' },
  { id: 's5', classroomCode: '12345', day: 'Miércoles',startTime: '09:00', endTime: '11:00', subject: 'Redes I',          teacherName: 'Dereck Monge Chaves' },
  { id: 's6', classroomCode: '34523', day: 'Jueves',   startTime: '11:00', endTime: '13:00', subject: 'Álgebra Lineal',   teacherName: 'Pablo González Rodríguez' },
  { id: 's7', classroomCode: '12345', day: 'Jueves',   startTime: '07:00', endTime: '09:00', subject: 'Programación II',  teacherName: 'Dereck Monge Chaves' },
  { id: 's8', classroomCode: '12124', day: 'Viernes',  startTime: '09:00', endTime: '11:00', subject: 'Sistemas Operativos', teacherName: 'Pablo González Rodríguez' },
]
