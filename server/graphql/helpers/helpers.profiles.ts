import { supabase } from '../utils/supabase'

export const PROFILE_BY_ROLE: Record<string, { table: string; nameCol: string }> = {
    admin: { table: 'Admin', nameCol: 'fullName' },
    profesor: { table: 'Professor', nameCol: 'fullName' },
    estudiante: { table: 'Student', nameCol: 'fullName' },
    invitado: { table: 'Guest', nameCol: 'fullname' },
}

export async function getProfileFullNames(userIds: string[]): Promise<Record<string, string>> {
    if (userIds.length === 0) return {}

    const [admins, profs, students, guests] = await Promise.all([
        supabase.from('Admin').select('userId, fullName').in('userId', userIds),
        supabase.from('Professor').select('userId, fullName').in('userId', userIds),
        supabase.from('Student').select('userId, fullName').in('userId', userIds),
        supabase.from('Guest').select('userId, fullname').in('userId', userIds),
    ])

    const map: Record<string, string> = {}
    admins.data?.forEach(r => { map[r.userId] = r.fullName })
    profs.data?.forEach(r => { map[r.userId] = r.fullName })
    students.data?.forEach(r => { map[r.userId] = r.fullName })
    guests.data?.forEach(r => { map[r.userId] = r.fullname })
    return map
}