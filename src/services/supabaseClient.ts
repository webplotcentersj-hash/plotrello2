import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: SupabaseClient | null = null

if (url && anonKey) {
  supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
} else {
  console.warn(
    '⚠️ Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para habilitar la API en vivo.'
  )
}

export { supabase }


