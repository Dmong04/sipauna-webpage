import { supabase } from '../utils/supabase'
import { mapSchedule } from '../helpers/helpers.mappers'

export const scheduleQueries = {
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
}

export const scheduleMutations = {
    createSchedule: async (
        _: unknown,
        args: {
            classroomCode: string
            subject: string
            professorUserId: string
            day: string
            startTime: string
            endTime: string
        }
    ) => {
        const { classroomCode, subject, professorUserId, day, startTime, endTime } = args

        const { data: cls, error: clsErr } = await supabase
            .from('Classroom').select('classroomId').eq('code', classroomCode).single()
        if (clsErr || !cls) throw new Error('Aula no encontrada')

        const { data: prof, error: profErr } = await supabase
            .from('Professor').select('professorId').eq('userId', professorUserId).single()
        if (profErr || !prof) throw new Error('Profesor no encontrado')

        const { data: course, error: courseErr } = await supabase
            .from('Course')
            .insert({ name: subject, professorId: (prof as any).professorId })
            .select('courseId')
            .single()
        if (courseErr || !course) throw new Error('No se pudo crear el curso')

        const { data, error } = await supabase
            .from('Schedule')
            .insert({
                classroomId: (cls as any).classroomId,
                courseId: (course as any).courseId,
                day,
                startTime,
                endTime,
            })
            .select(`
        scheduleId, day, startTime, endTime,
        Classroom(code),
        Course(name, Professor(fullName))
      `)
            .single()
        if (error) throw new Error(error.message)
        return mapSchedule(data as any)
    },

    deleteSchedule: async (_: unknown, { scheduleId }: { scheduleId: string }) => {
        const { error } = await supabase
            .from('Schedule').delete().eq('scheduleId', scheduleId)
        if (error) throw new Error('Horario no encontrado')
        return true
    },
}