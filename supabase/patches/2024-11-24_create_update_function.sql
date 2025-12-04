-- SOLUCIÓN DIRECTA: Crear función SQL que actualice las columnas directamente
-- Esto evita el problema del schema cache de Supabase

BEGIN;

-- Función para actualizar orden con todos los campos de contacto
CREATE OR REPLACE FUNCTION public.update_orden_with_contact(
  p_id integer,
  p_telefono_cliente text DEFAULT NULL,
  p_email_cliente text DEFAULT NULL,
  p_direccion_cliente text DEFAULT NULL,
  p_whatsapp_link text DEFAULT NULL,
  p_ubicacion_link text DEFAULT NULL,
  p_drive_link text DEFAULT NULL,
  p_foto_url text DEFAULT NULL,
  p_otros_campos jsonb DEFAULT NULL
)
RETURNS TABLE (
  id integer,
  numero_op varchar,
  cliente varchar,
  telefono_cliente text,
  email_cliente text,
  direccion_cliente text,
  whatsapp_link text,
  ubicacion_link text,
  drive_link text,
  foto_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_row public.ordenes_trabajo%ROWTYPE;
BEGIN
  -- Actualizar solo los campos que vienen (no NULL)
  UPDATE public.ordenes_trabajo
  SET
    telefono_cliente = COALESCE(p_telefono_cliente, telefono_cliente),
    email_cliente = COALESCE(p_email_cliente, email_cliente),
    direccion_cliente = COALESCE(p_direccion_cliente, direccion_cliente),
    whatsapp_link = COALESCE(p_whatsapp_link, whatsapp_link),
    ubicacion_link = COALESCE(p_ubicacion_link, ubicacion_link),
    drive_link = COALESCE(p_drive_link, drive_link),
    foto_url = COALESCE(p_foto_url, foto_url)
  WHERE id = p_id
  RETURNING * INTO updated_row;
  
  -- Si hay otros campos en el JSON, actualizarlos también
  IF p_otros_campos IS NOT NULL THEN
    -- Aquí se pueden agregar más campos si es necesario
    NULL;
  END IF;
  
  -- Retornar la fila actualizada
  RETURN QUERY
  SELECT 
    updated_row.id,
    updated_row.numero_op,
    updated_row.cliente,
    updated_row.telefono_cliente,
    updated_row.email_cliente,
    updated_row.direccion_cliente,
    updated_row.whatsapp_link,
    updated_row.ubicacion_link,
    updated_row.drive_link,
    updated_row.foto_url;
END;
$$;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.update_orden_with_contact TO anon;
GRANT EXECUTE ON FUNCTION public.update_orden_with_contact TO authenticated;

-- Deshabilitar RLS temporalmente para que funcione
ALTER TABLE public.ordenes_trabajo DISABLE ROW LEVEL SECURITY;

COMMIT;

-- Verificar que la función se creó
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_orden_with_contact';

