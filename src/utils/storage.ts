import { supabase } from '../services/supabaseClient'

const BUCKET_NAME = 'archivos'
const DEFAULT_FOLDER = 'capturas'

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function uploadAttachmentAndGetUrl(file: File, folder: string = DEFAULT_FOLDER) {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa las variables VITE_SUPABASE_*')
  }

  const fileExt = file.name.split('.').pop() ?? 'jpg'
  const normalizedFolder = folder.replace(/^\//, '').replace(/\/$/, '') || DEFAULT_FOLDER
  const fileName = `${normalizedFolder}/${generateId()}.${fileExt}`

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'application/octet-stream'
  })

  if (error) {
    throw error
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)
  if (!data?.publicUrl) {
    throw new Error('No se pudo obtener la URL pública del archivo subido.')
  }

  return data.publicUrl
}

