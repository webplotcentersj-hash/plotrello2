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

  // Verificar que el bucket existe
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error('Error listando buckets:', listError)
    throw new Error(`Error accediendo a Storage: ${listError.message}`)
  }

  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME)
  if (!bucketExists) {
    throw new Error(
      `El bucket "${BUCKET_NAME}" no existe. Créalo en Supabase → Storage → New bucket (debe ser público)`
    )
  }

  const fileExt = file.name.split('.').pop() ?? 'jpg'
  const normalizedFolder = folder.replace(/^\//, '').replace(/\/$/, '') || DEFAULT_FOLDER
  const fileName = `${normalizedFolder}/${generateId()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'application/octet-stream'
    })

  if (uploadError) {
    console.error('Error subiendo archivo:', uploadError)
    if (uploadError.message.includes('new row violates row-level security')) {
      throw new Error(
        'Error de permisos. Verifica que el bucket sea público o que tengas las políticas RLS correctas.'
      )
    }
    throw new Error(`Error al subir archivo: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName)
  if (!urlData?.publicUrl) {
    throw new Error('No se pudo obtener la URL pública del archivo subido.')
  }

  return urlData.publicUrl
}

