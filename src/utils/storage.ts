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

  // Intentar subir directamente - esto es más confiable que verificar primero
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'application/octet-stream'
    })

  if (uploadError) {
    console.error('Error subiendo archivo:', uploadError)
    
    // Mensajes de error más específicos
    if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
      throw new Error(
        `El bucket "${BUCKET_NAME}" no existe o no tienes acceso. Créalo en Supabase → Storage → New bucket (debe ser público)`
      )
    }
    
    if (uploadError.message.includes('new row violates row-level security') || 
        uploadError.message.includes('permission denied') ||
        uploadError.message.includes('row-level security')) {
      throw new Error(
        'Error de permisos. El bucket debe ser público o necesitas políticas RLS. Ve a Supabase → Storage → archivos → Policies'
      )
    }
    
    if (uploadError.message.includes('The resource already exists')) {
      // Si ya existe, intentar obtener la URL directamente
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)
      if (urlData?.publicUrl) {
        return urlData.publicUrl
      }
    }
    
    throw new Error(`Error al subir archivo: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)
  if (!urlData?.publicUrl) {
    throw new Error('No se pudo obtener la URL pública del archivo subido.')
  }

  return urlData.publicUrl
}

