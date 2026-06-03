import { supabase } from '../utils/supabase'

export const guestQueries = {
    checkGuestByLegalId: async (_: unknown, { legalId }: { legalId: string }) => {
        const { data, error } = await supabase
            .from('Guest')
            .select('userId, fullname')
            .eq('legalId', legalId.trim())
            .maybeSingle()
        if (error || !data) return null
        return data
    },
}