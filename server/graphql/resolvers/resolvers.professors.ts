import { supabase } from '../utils/supabase'

export const professorQueries = {
    professors: async () => {
        const { data, error } = await supabase
            .from('Professor').select('userId, fullName').order('fullName')
        if (error) throw new Error(error.message)
        return (data as any[]).map(r => ({ userId: r.userId, fullName: r.fullName }))
    },
}