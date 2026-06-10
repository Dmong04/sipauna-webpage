import { GraphQLError } from 'graphql'
import { supabase } from '../utils/supabase'

const mapDetail = (r: any) => ({
    professorId: r.professorId,
    fullName:    r.fullName,
    legalId:     r.legalId,
    userId:      r.userId ?? null,
})

export const professorQueries = {
    professors: async () => {
        const { data, error } = await supabase
            .from('Professor').select('userId, fullName').order('fullName')
        if (error) throw new Error(error.message)
        return (data as any[]).map(r => ({ userId: r.userId, fullName: r.fullName }))
    },

    professorsFull: async () => {
        const { data, error } = await supabase
            .from('Professor')
            .select('professorId, fullName, legalId, userId')
            .order('fullName')
        if (error) throw new Error(error.message)
        return (data as any[]).map(mapDetail)
    },

    checkProfessorExists: async (_: any, { fullName }: { fullName: string }) => {
        const { data, error } = await supabase
            .from('Professor')
            .select('professorId')
            .ilike('fullName', fullName.trim())
            .is('userId', null)
            .maybeSingle()
        if (error) throw new Error(error.message)
        return data !== null
    },

    checkProfessorByLegalId: async (_: any, { legalId }: { legalId: string }) => {
        const { data, error } = await supabase
            .from('Professor')
            .select('professorId, fullName, userId')
            .eq('legalId', legalId.trim())
            .maybeSingle()
        if (error) throw new Error(error.message)
        if (!data) return null
        return { userId: data.userId ?? null, fullName: data.fullName }
    },
}

export const professorMutations = {
    createProfessor: async (
        _: unknown,
        { fullName, legalId }: { fullName: string; legalId: string }
    ) => {
        if (!fullName?.trim()) throw new GraphQLError('El nombre es obligatorio')
        if (!legalId?.trim())  throw new GraphQLError('La cédula es obligatoria')

        const { data: existing } = await supabase
            .from('Professor')
            .select('professorId')
            .eq('legalId', legalId.trim())
            .maybeSingle()
        if (existing) throw new GraphQLError('Ya existe un profesor registrado con esa cédula')

        const { data, error } = await supabase
            .from('Professor')
            .insert({ fullName: fullName.trim(), legalId: legalId.trim() })
            .select('professorId, fullName, legalId, userId')
            .single()
        if (error) throw new GraphQLError(error.message)
        return mapDetail(data)
    },

    updateProfessor: async (
        _: unknown,
        { professorId, fullName, legalId }: { professorId: string; fullName?: string; legalId?: string }
    ) => {
        const updates: Record<string, any> = {}
        if (fullName?.trim()) updates.fullName = fullName.trim()
        if (legalId?.trim()) {
            const { data: dup } = await supabase
                .from('Professor')
                .select('professorId')
                .eq('legalId', legalId.trim())
                .neq('professorId', professorId)
                .maybeSingle()
            if (dup) throw new GraphQLError('Ya existe otro profesor con esa cédula')
            updates.legalId = legalId.trim()
        }

        if (Object.keys(updates).length === 0) throw new GraphQLError('No hay cambios para guardar')

        const { data, error } = await supabase
            .from('Professor')
            .update(updates)
            .eq('professorId', professorId)
            .select('professorId, fullName, legalId, userId')
            .single()
        if (error) throw new GraphQLError('Profesor no encontrado')
        return mapDetail(data)
    },

    deleteProfessor: async (_: unknown, { professorId }: { professorId: string }) => {
        const { data } = await supabase
            .from('Professor')
            .select('userId')
            .eq('professorId', professorId)
            .single()

        if (data?.userId) {
            throw new GraphQLError(
                'Este profesor tiene una cuenta de usuario activa. ' +
                'Primero elimine el usuario desde la sección de Usuarios.'
            )
        }

        const { error } = await supabase
            .from('Professor')
            .delete()
            .eq('professorId', professorId)
        if (error) {
            if ((error as any).code === '23503') {
                throw new GraphQLError(
                    'No se puede eliminar: este profesor tiene horarios asociados. ' +
                    'Eliminá primero esos horarios desde la sección de Horarios.'
                )
            }
            throw new GraphQLError(error.message)
        }
        return true
    },
}
