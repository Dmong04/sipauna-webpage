import { supabase } from '../utils/supabase'
import { mapSchedule } from '../helpers/helpers.mappers'

const SELECT_SCHEDULE = `
    scheduleId, day, startTime, endTime,
    Classroom(code),
    Course(name, Professor(fullName))
`

export const scheduleQueries = {
    schedules: async () => {
        const { data, error } = await supabase
            .from('Schedule')
            .select(SELECT_SCHEDULE)
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
            .select(SELECT_SCHEDULE)
            .single()
        if (error) throw new Error(error.message)
        return mapSchedule(data as any)
    },

    updateSchedule: async (
        _: unknown,
        args: {
            scheduleId: string
            classroomCode?: string
            subject?: string
            professorUserId?: string
            day?: string
            startTime?: string
            endTime?: string
        }
    ) => {
        const { scheduleId, classroomCode, subject, professorUserId, day, startTime, endTime } = args

        // Get existing schedule to find courseId
        const { data: existing, error: fetchErr } = await supabase
            .from('Schedule')
            .select('scheduleId, courseId')
            .eq('scheduleId', scheduleId)
            .single()
        if (fetchErr || !existing) throw new Error('Horario no encontrado')

        // Build Schedule update payload
        const scheduleUpdate: Record<string, unknown> = {}
        if (day) scheduleUpdate.day = day
        if (startTime) scheduleUpdate.startTime = startTime
        if (endTime) scheduleUpdate.endTime = endTime

        if (classroomCode) {
            const { data: cls, error: clsErr } = await supabase
                .from('Classroom').select('classroomId').eq('code', classroomCode).single()
            if (clsErr || !cls) throw new Error('Aula no encontrada')
            scheduleUpdate.classroomId = (cls as any).classroomId
        }

        // Build Course update payload
        const courseUpdate: Record<string, unknown> = {}
        if (subject) courseUpdate.name = subject
        if (professorUserId) {
            const { data: prof, error: profErr } = await supabase
                .from('Professor').select('professorId').eq('userId', professorUserId).single()
            if (profErr || !prof) throw new Error('Profesor no encontrado')
            courseUpdate.professorId = (prof as any).professorId
        }

        if (Object.keys(courseUpdate).length > 0) {
            const { error: courseErr } = await supabase
                .from('Course').update(courseUpdate).eq('courseId', (existing as any).courseId)
            if (courseErr) throw new Error('No se pudo actualizar el curso: ' + courseErr.message)
        }

        if (Object.keys(scheduleUpdate).length > 0) {
            const { error: schedErr } = await supabase
                .from('Schedule').update(scheduleUpdate).eq('scheduleId', scheduleId)
            if (schedErr) throw new Error('No se pudo actualizar el horario: ' + schedErr.message)
        }

        // Return updated schedule
        const { data, error } = await supabase
            .from('Schedule')
            .select(SELECT_SCHEDULE)
            .eq('scheduleId', scheduleId)
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

    deleteSchedules: async (_: unknown, { scheduleIds }: { scheduleIds: string[] }) => {
        if (!scheduleIds.length) return true
        const { error } = await supabase
            .from('Schedule').delete().in('scheduleId', scheduleIds)
        if (error) throw new Error('No se pudieron eliminar los horarios: ' + error.message)
        return true
    },

    clearScheduleData: async () => {
        // Order: Schedule → Course → Area (respects FK dependencies)
        const { error: schedErr } = await supabase
            .from('Schedule').delete().not('scheduleId', 'is', null)
        if (schedErr) throw new Error('Error al borrar horarios: ' + schedErr.message)

        const { error: courseErr } = await supabase
            .from('Course').delete().not('courseId', 'is', null)
        if (courseErr) throw new Error('Error al borrar cursos: ' + courseErr.message)

        const { error: areaErr } = await supabase
            .from('Area').delete().not('areaId', 'is', null)
        if (areaErr) throw new Error('Error al borrar áreas: ' + areaErr.message)

        return true
    },
}
