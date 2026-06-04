import { GraphQLError } from 'graphql'
import bcrypt from 'bcryptjs'
import { supabase } from '../utils/supabase'
import { requireAdmin, signToken } from '../helpers/helpers.auth'
import { getProfileFullNames, PROFILE_BY_ROLE } from '../helpers/helpers.profiles'
import type { GqlContext } from '../helpers/helpers.auth'

export const userQueries = {
    users: async () => {
        const { data, error } = await supabase
            .from('User')
            .select('userId, email, roleId, Role(name)')
        if (error) throw new Error(error.message)

        const userIds = (data as any[]).map(u => u.userId)
        const nameMap = await getProfileFullNames(userIds)

        return (data as any[]).map(u => ({
            userId: u.userId,
            email: u.email,
            fullname: nameMap[u.userId] ?? 'Usuario',
            roleId: u.roleId,
            roleName: u.Role?.name ?? '',
        }))
    },

    user: async (_: unknown, { userId }: { userId: string }) => {
        const { data, error } = await supabase
            .from('User')
            .select('userId, email, roleId, Role(name)')
            .eq('userId', userId)
            .single()
        if (error) return null

        const nameMap = await getProfileFullNames([userId])
        return {
            userId,
            email: data.email,
            fullname: nameMap[userId] ?? 'Usuario',
            roleId: (data as any).roleId,
            roleName: (data as any).Role?.name ?? '',
        }
    },

    roles: async () => {
        const { data, error } = await supabase
            .from('Role').select('roleId, name').order('name')
        if (error) throw new Error(error.message)
        return (data as any[]).map(r => ({ roleId: r.roleId, name: r.name }))
    },
}

export const userMutations = {
    createUser: async (
        _: unknown,
        args: { fullname: string; email: string; password: string; roleName: string; legalId: string },
        ctx: GqlContext
    ) => {
        requireAdmin(ctx)
        const { fullname, email, password, roleName, legalId } = args

        const profile = PROFILE_BY_ROLE[roleName]
        if (!profile) throw new GraphQLError('Rol inválido')
        if (!fullname?.trim() || !email?.trim() || !legalId?.trim())
            throw new GraphQLError('Todos los campos son obligatorios')
        if (!password || password.length < 8)
            throw new GraphQLError('La contraseña debe tener al menos 8 caracteres')

        // ── Validaciones por rol ───────────────────────────────────────────────
        if (roleName === 'admin') {
            const { data: existingAdmin } = await supabase
                .from('Admin')
                .select('adminId, userId')
                .eq('legalId', legalId.trim())
                .maybeSingle()

            if (existingAdmin)
                throw new GraphQLError('Ya existe un administrador registrado con esa cédula')

        } else if (roleName === 'profesor') {
            const { data: profByLegalId, error: legalIdErr } = await supabase
                .from('Professor')
                .select('professorId, fullName, userId')
                .eq('legalId', legalId.trim())
                .maybeSingle()

            if (legalIdErr || !profByLegalId)
                throw new GraphQLError('No se encontró ningún profesor con esa cédula')

            if (profByLegalId.fullName.trim().toLowerCase() !== fullname.trim().toLowerCase())
                throw new GraphQLError('El nombre no corresponde al profesor registrado con esa cédula')

            if (profByLegalId.userId !== null)
                throw new GraphQLError('Este profesor ya tiene un usuario asignado en el sistema')

        } else if (roleName === 'estudiante') {
            const { data: studentByLegalId, error: legalIdErr } = await supabase
                .from('Student')
                .select('studentId, fullName, userId')
                .eq('legalId', legalId.trim())
                .maybeSingle()

            if (legalIdErr || !studentByLegalId)
                throw new GraphQLError('No se encontró ningún estudiante con esa cédula')

            if (studentByLegalId.fullName.trim().toLowerCase() !== fullname.trim().toLowerCase())
                throw new GraphQLError('El nombre no corresponde al estudiante registrado con esa cédula')

            if (studentByLegalId.userId !== null)
                throw new GraphQLError('Este estudiante ya tiene un usuario asignado en el sistema')

        } else if (roleName === 'invitado') {
            const { data: guestByLegalId, error: legalIdErr } = await supabase
                .from('Guest')
                .select('guestId, fullname, userId')
                .eq('legalId', legalId.trim())
                .maybeSingle()

            if (legalIdErr || !guestByLegalId)
                throw new GraphQLError('No se encontró ningún invitado con esa cédula')

            if (guestByLegalId.fullname.trim().toLowerCase() !== fullname.trim().toLowerCase())
                throw new GraphQLError('El nombre no corresponde al invitado registrado con esa cédula')

            if (guestByLegalId.userId !== null)
                throw new GraphQLError('Este invitado ya tiene un usuario asignado en el sistema')
        }

        // ── Verificar email duplicado ──────────────────────────────────────────
        const { data: existing } = await supabase
            .from('User').select('userId').eq('email', email).maybeSingle()
        if (existing) throw new GraphQLError('El correo ya está registrado')

        const { data: role, error: roleErr } = await supabase
            .from('Role').select('roleId').eq('name', roleName).single()
        if (roleErr || !role) throw new GraphQLError('Rol no encontrado')

        const hash = await bcrypt.hash(password, 12)

        const { data: newUser, error: userErr } = await supabase
            .from('User')
            .insert({ email, password: hash, roleId: (role as any).roleId })
            .select('userId, email, roleId')
            .single()
        if (userErr || !newUser) throw new GraphQLError('No se pudo crear el usuario')

        // ── Vincular o crear perfil según rol ─────────────────────────────────
        if (roleName === 'admin') {
            const { error: profErr } = await supabase
                .from(profile.table)
                .insert({ [profile.nameCol]: fullname.trim(), legalId: legalId.trim(), userId: (newUser as any).userId })

            if (profErr) {
                await supabase.from('User').delete().eq('userId', (newUser as any).userId)
                throw new GraphQLError('No se pudo crear el perfil de administrador')
            }
        } else {
            const { error: profErr } = await supabase
                .from(profile.table)
                .update({ userId: (newUser as any).userId })
                .eq('legalId', legalId.trim())

            if (profErr) {
                await supabase.from('User').delete().eq('userId', (newUser as any).userId)
                throw new GraphQLError('No se pudo vincular el perfil al usuario')
            }
        }

        return {
            userId: (newUser as any).userId,
            email: (newUser as any).email,
            fullname: fullname.trim(),
            roleId: (newUser as any).roleId,
            roleName,
        }
    },

    updateUserRole: async (
        _: unknown,
        { userId, roleName }: { userId: string; roleName: string },
        ctx: GqlContext
    ) => {
        const caller = requireAdmin(ctx)
        if (!PROFILE_BY_ROLE[roleName]) throw new GraphQLError('Rol inválido')
        if (caller.userId === userId)
            throw new GraphQLError('No puede cambiar su propio rol')

        const { data: role, error: roleErr } = await supabase
            .from('Role').select('roleId').eq('name', roleName).single()
        if (roleErr || !role) throw new GraphQLError('Rol no encontrado')

        const { data, error } = await supabase
            .from('User')
            .update({ roleId: (role as any).roleId })
            .eq('userId', userId)
            .select('userId, email, roleId')
            .single()
        if (error) throw new GraphQLError('Usuario no encontrado')

        const nameMap = await getProfileFullNames([userId])
        return {
            userId: (data as any).userId,
            email: (data as any).email,
            fullname: nameMap[userId] ?? 'Usuario',
            roleId: (data as any).roleId,
            roleName,
        }
    },

    deleteUser: async (_: unknown, { userId }: { userId: string }, ctx: GqlContext) => {
        const caller = requireAdmin(ctx)
        if (caller.userId === userId)
            throw new GraphQLError('No puede eliminar su propia cuenta')

        await supabase.from('Loan').delete().eq('userId', userId)
        await Promise.all([
            supabase.from('Admin').delete().eq('userId', userId),
            supabase.from('Professor').delete().eq('userId', userId),
            supabase.from('Student').delete().eq('userId', userId),
            supabase.from('Guest').delete().eq('userId', userId),
        ])
        const { error } = await supabase.from('User').delete().eq('userId', userId)
        if (error) throw new GraphQLError('No se pudo eliminar el usuario')
        return true
    },
}