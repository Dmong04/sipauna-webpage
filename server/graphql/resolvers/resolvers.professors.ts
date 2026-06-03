import { supabase } from '../utils/supabase'

export const professorQueries = {
    professors: async () => {
        const { data, error } = await supabase
            .from('Professor').select('userId, fullName').order('fullName')
        if (error) throw new Error(error.message)
        return (data as any[]).map(r => ({ userId: r.userId, fullName: r.fullName }))
    },

    checkProfessorExists: async (_: any, { fullName }: { fullName: string }) => {
        const { data, error } = await supabase
            .from('Professor')
            .select('professorId')
            .ilike('fullName', fullName.trim())  // case-insensitive
            .is('userId', null)                  // sin cuenta aún
            .maybeSingle()

        if (error) throw new Error(error.message)
        return data !== null
    },
}