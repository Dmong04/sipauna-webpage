import { createClient } from '@supabase/supabase-js'

const supabaseUrl        = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('[Supabase] Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY')
}

// La service_role key bypasea RLS — usar SOLO en el servidor, nunca exponer al cliente
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})
