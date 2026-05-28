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

        const { error: profErr } = await supabase
            .from(profile.table)
            .insert({ [profile.nameCol]: fullname.trim(), legalId: legalId.trim(), userId: (newUser as any).userId })

        if (profErr) {
            await supabase.from('User').delete().eq('userId', (newUser as any).userId)
            throw new GraphQLError('No se pudo crear el perfil (¿identificación duplicada?)')
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