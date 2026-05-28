import { GraphQLError } from 'graphql'
import bcrypt from 'bcryptjs'
import { supabase } from '../utils/supabase'
import { signToken } from '../helpers/helpers.auth'
import { getProfileFullNames, PROFILE_BY_ROLE } from '../helpers/helpers.profiles'

export const authMutations = {
    login: async (_: unknown, { email, password }: { email: string; password: string }) => {
        const { data, error } = await supabase
            .from('User')
            .select('userId, email, roleId, password, Role(name)')
            .eq('email', email)
            .single()

        if (error || !data) throw new GraphQLError('Credenciales incorrectas')

        const valid = await bcrypt.compare(password, (data as any).password)
        if (!valid) throw new GraphQLError('Credenciales incorrectas')

        const roleName = (data as any).Role?.name ?? ''
        const nameMap = await getProfileFullNames([(data as any).userId])
        const token = signToken({ userId: (data as any).userId, roleName })

        return {
            token,
            user: {
                userId: (data as any).userId,
                email: (data as any).email,
                fullname: nameMap[(data as any).userId] ?? 'Usuario',
                roleId: (data as any).roleId,
                roleName,
            },
        }
    },

    register: async (
        _: unknown,
        { fullname, email, password, roleName: requestedRole }: {
            fullname: string
            email: string
            password: string
            roleName?: string
        }
    ) => {
        const ALLOWED = ['estudiante', 'profesor']
        const roleName = ALLOWED.includes(requestedRole ?? '') ? requestedRole! : 'estudiante'

        if (!fullname?.trim() || !email?.trim() || !password)
            throw new GraphQLError('Todos los campos son obligatorios')
        if (password.length < 8)
            throw new GraphQLError('La contraseña debe tener al menos 8 caracteres')

        const { data: existing } = await supabase
            .from('User').select('userId').eq('email', email).maybeSingle()
        if (existing) throw new GraphQLError('El correo ya está registrado')

        const { data: role, error: roleErr } = await supabase
            .from('Role').select('roleId').eq('name', roleName).single()
        if (roleErr || !role) throw new GraphQLError('No se pudo asignar el rol')

        const hash = await bcrypt.hash(password, 12)

        const { data: newUser, error: userErr } = await supabase
            .from('User')
            .insert({ email, password: hash, roleId: (role as any).roleId })
            .select('userId, email, roleId')
            .single()
        if (userErr || !newUser) throw new GraphQLError('No se pudo crear el usuario')

        const profile = PROFILE_BY_ROLE[roleName]
        await supabase.from(profile.table).insert({
            [profile.nameCol]: fullname.trim(),
            legalId: `REG-${Date.now()}`,
            userId: (newUser as any).userId,
        })

        const token = signToken({ userId: (newUser as any).userId, roleName })
        return {
            token,
            user: {
                userId: (newUser as any).userId,
                email: (newUser as any).email,
                fullname: fullname.trim(),
                roleId: (newUser as any).roleId,
                roleName,
            },
        }
    },
}