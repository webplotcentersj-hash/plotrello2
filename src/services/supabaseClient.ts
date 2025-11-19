import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: SupabaseClient | null = null

// Validar que la URL sea válida antes de crear el cliente
const isValidUrl = (urlString: string | undefined): boolean => {
  if (!urlString || typeof urlString !== 'string') {
    return false
  }
  try {
    const urlObj = new URL(urlString)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

if (url && anonKey && isValidUrl(url)) {
  try {
    supabase = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    console.log('✅ Cliente de Supabase inicializado correctamente')
  } catch (error) {
    console.error('❌ Error al inicializar Supabase:', error)
    console.warn('⚠️ La aplicación funcionará con datos mock o fallback')
  }
} else {
  if (!url || !isValidUrl(url)) {
    console.warn(
      '⚠️ VITE_SUPABASE_URL no está configurada o no es una URL válida.',
      'La aplicación funcionará con datos mock o fallback.'
    )
  }
  if (!anonKey) {
    console.warn(
      '⚠️ VITE_SUPABASE_ANON_KEY no está configurada.',
      'La aplicación funcionará con datos mock o fallback.'
    )
  }
}

export { supabase }


