import { GraphQLError } from 'graphql'
import bcrypt from 'bcryptjs'
import { supabase } from '../utils/supabase'
import { getProfileFullNames, PROFILE_BY_ROLE } from '../helpers/helpers.profiles'

export const profileMutations = {
    updateProfile: async (
        _: unknown,
        args: { userId: string; fullname?: string; email?: string }
    ) => {
        const { userId, fullname, email } = args

        if (!fullname?.trim() && !email?.trim()) {
            throw new GraphQLError('Debe proporcionar al menos un campo para actualizar')
        }

        // Obtener datos actuales del usuario (se necesita el rol para la tabla de perfil)
        const { data: user, error: userErr } = await supabase
            .from('User')
            .select('userId, email, roleId, Role(name)')
            .eq('userId', userId)
            .single()
        if (userErr || !user) throw new GraphQLError('Usuario no encontrado')

        const roleName = (user as any).Role?.name ?? ''

        // Actualizar email si se proporcionó
        if (email?.trim()) {
            const { data: existing } = await supabase
                .from('User')
                .select('userId')
                .eq('email', email.trim())
                .neq('userId', userId)
                .maybeSingle()
            if (existing) throw new GraphQLError('El correo ya está en uso por otra cuenta')

            const { error } = await supabase
                .from('User')
                .update({ email: email.trim() })
                .eq('userId', userId)
            if (error) throw new GraphQLError('No se pudo actualizar el correo')
        }

        // Actualizar nombre en la tabla de perfil correspondiente al rol
        if (fullname?.trim()) {
            const profile = PROFILE_BY_ROLE[roleName]
            if (profile) {
                const { error } = await supabase
                    .from(profile.table)
                    .update({ [profile.nameCol]: fullname.trim() })
                    .eq('userId', userId)
                if (error) throw new GraphQLError('No se pudo actualizar el nombre')
            }
        }

        // Devolver el usuario actualizado
        const updatedEmail = email?.trim() ?? (user as any).email
        const nameMap = await getProfileFullNames([userId])
        const updatedFullname = fullname?.trim() ?? nameMap[userId] ?? 'Usuario'

        return {
            userId,
            email: updatedEmail,
            fullname: updatedFullname,
            roleId: (user as any).roleId,
            roleName,
        }
    },

    changePassword: async (
        _: unknown,
        args: { userId: string; currentPassword: string; newPassword: string }
    ) => {
        const { userId, currentPassword, newPassword } = args

        if (!newPassword || newPassword.length < 8) {
            throw new GraphQLError('La nueva contraseña debe tener al menos 8 caracteres')
        }

        // Obtener hash de contraseña actual
        const { data: user, error } = await supabase
            .from('User')
            .select('password')
            .eq('userId', userId)
            .single()
        if (error || !user) throw new GraphQLError('Usuario no encontrado')

        const isMatch = await bcrypt.compare(currentPassword, (user as any).password)
        if (!isMatch) throw new GraphQLError('La contraseña actual es incorrecta')

        if (currentPassword === newPassword) {
            throw new GraphQLError('La nueva contraseña debe ser diferente a la actual')
        }

        const hash = await bcrypt.hash(newPassword, 12)
        const { error: updateErr } = await supabase
            .from('User')
            .update({ password: hash })
            .eq('userId', userId)
        if (updateErr) throw new GraphQLError('No se pudo actualizar la contraseña')

        return true
    },
}
