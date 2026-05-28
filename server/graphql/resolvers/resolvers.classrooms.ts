import { supabase } from '../utils/supabase'
import { mapClassroom } from '../helpers/helpers.mappers'

export const classroomQueries = {
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
}

export const classroomMutations = {
    createClassroom: async (_: unknown, { code, capacity }: { code: string; capacity: number }) => {
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
        if (code !== undefined) updates.code = code
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
}