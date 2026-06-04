import { supabase } from '../utils/supabase'

export const studentQueries = {
    checkStudentByLegalId: async (_: unknown, { legalId }: { legalId: string }) => {
        const { data, error } = await supabase
            .from('Student')
            .select('userId, fullName')
            .eq('legalId', legalId.trim())
            .maybeSingle()
        if (error || !data) return null
        return data
    },
}