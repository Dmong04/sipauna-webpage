import { supabase } from '../utils/supabase'
import { getProfileFullNames } from '../helpers/helpers.profiles'
import { mapLoan } from '../helpers/helpers.mappers'

const VALID_STATUSES = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO']

export const loanQueries = {
    loans: async (_: unknown, { loanDate }: { loanDate?: string } = {}) => {
        let query = supabase
            .from('Loan')
            .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
            .order('createdAt', { ascending: false })

        if (loanDate) {
            query = query
                .gte('loanDate', `${loanDate}T00:00:00`)
                .lte('loanDate', `${loanDate}T23:59:59`)
        }

        const { data, error } = await query
        if (error) throw new Error(error.message)

        const userIds = [...new Set((data as any[]).map(l => l.userId))]
        const nameMap = await getProfileFullNames(userIds)
        return (data as any[]).map(l => mapLoan(l, nameMap))
    },

    loansByUser: async (_: unknown, { userId }: { userId: string }) => {
        const { data, error } = await supabase
            .from('Loan')
            .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
            .eq('userId', userId)
            .order('createdAt', { ascending: false })
        if (error) throw new Error(error.message)

        const nameMap = await getProfileFullNames([userId])
        return (data as any[]).map(l => mapLoan(l, nameMap))
    },
}

export const loanMutations = {
    createLoan: async (
        _: unknown,
        args: {
            classroomCode: string
            userId: string
            loanDate: string
            startTime: string
            endTime: string
            reason: string
        }
    ) => {
        const { classroomCode, userId, loanDate, startTime, endTime, reason } = args

        if (startTime >= endTime)
            throw new Error('La hora de inicio debe ser anterior a la hora de fin')

        const { data: userCheck } = await supabase
            .from('User').select('userId').eq('userId', userId).maybeSingle()
        if (!userCheck) throw new Error('Sesión inválida. Por favor cerrá sesión e iniciá de nuevo.')

        const { data: cls, error: clsErr } = await supabase
            .from('Classroom').select('classroomId').eq('code', classroomCode).single()
        if (clsErr || !cls) throw new Error('Aula no encontrada')

        const { data, error } = await supabase
            .from('Loan')
            .insert({
                classroomId: (cls as any).classroomId,
                userId,
                loanDate: `${loanDate}T00:00:00`,
                startTime,
                endTime,
                reason,
                status: 'PENDIENTE',
            })
            .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
            .single()

        if (error) throw new Error(error.message)

        const nameMap = await getProfileFullNames([userId])
        return mapLoan(data as any, nameMap)
    },

    updateLoanStatus: async (
        _: unknown,
        { loanId, status }: { loanId: string; status: string }
    ) => {
        if (!VALID_STATUSES.includes(status))
            throw new Error('Estado inválido')

        const { data, error } = await supabase
            .from('Loan')
            .update({ status })
            .eq('loanId', loanId)
            .select('loanId, userId, loanDate, startTime, endTime, reason, status, Classroom(code)')
            .single()

        if (error) throw new Error('Préstamo no encontrado')

        const nameMap = await getProfileFullNames([(data as any).userId])
        return mapLoan(data as any, nameMap)
    },
}