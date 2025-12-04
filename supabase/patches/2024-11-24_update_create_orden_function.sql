-- Actualizar función create_orden_with_contact para incluir sectores múltiples y sector_inicial

BEGIN;

CREATE OR REPLACE FUNCTION public.create_orden_with_contact(
  p_numero_op varchar,
  p_cliente varchar,
  p_fecha_entrega date,
  p_descripcion text DEFAULT NULL,
  p_estado varchar DEFAULT 'Pendiente',
  p_prioridad varchar DEFAULT 'Normal',
  p_operario_asignado varchar DEFAULT NULL,
  p_complejidad text DEFAULT 'Media',
  p_sector text DEFAULT 'Diseño Gráfico',
  p_sectores text[] DEFAULT NULL,
  p_sector_inicial text DEFAULT NULL,
  p_materiales text DEFAULT NULL,
  p_nombre_creador varchar DEFAULT NULL,
  p_telefono_cliente text DEFAULT NULL,
  p_email_cliente text DEFAULT NULL,
  p_direccion_cliente text DEFAULT NULL,
  p_whatsapp_link text DEFAULT NULL,
  p_ubicacion_link text DEFAULT NULL,
  p_drive_link text DEFAULT NULL,
  p_foto_url text DEFAULT NULL,
  p_dni_cuit text DEFAULT NULL
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
  new_id integer;
  inserted_row public.ordenes_trabajo%ROWTYPE;
  sectores_final text[];
  sector_inicial_final text;
BEGIN
  -- Determinar sectores: usar p_sectores si existe, sino usar p_sector como array
  IF p_sectores IS NOT NULL AND array_length(p_sectores, 1) > 0 THEN
    sectores_final := p_sectores;
  ELSIF p_sector IS NOT NULL THEN
    sectores_final := ARRAY[p_sector];
  ELSE
    sectores_final := ARRAY[]::text[];
  END IF;
  
  -- Determinar sector_inicial: usar p_sector_inicial si existe, sino usar p_sector
  IF p_sector_inicial IS NOT NULL AND p_sector_inicial != '' THEN
    sector_inicial_final := p_sector_inicial;
  ELSIF p_sector IS NOT NULL THEN
    sector_inicial_final := p_sector;
  ELSE
    sector_inicial_final := NULL;
  END IF;
  
  -- Insertar la orden con todos los campos
  INSERT INTO public.ordenes_trabajo (
    numero_op,
    cliente,
    descripcion,
    estado,
    prioridad,
    fecha_entrega,
    operario_asignado,
    complejidad,
    sector, -- Mantener para compatibilidad
    sectores, -- Array de sectores
    sector_inicial, -- Sector donde aparece la ficha principal
    materiales,
    nombre_creador,
    telefono_cliente,
    email_cliente,
    direccion_cliente,
    whatsapp_link,
    ubicacion_link,
    drive_link,
    foto_url,
    dni_cuit,
    fecha_creacion,
    fecha_ingreso
  ) VALUES (
    p_numero_op,
    p_cliente,
    p_descripcion,
    p_estado,
    p_prioridad,
    p_fecha_entrega,
    p_operario_asignado,
    p_complejidad,
    sector_inicial_final, -- sector único para compatibilidad
    sectores_final, -- sectores múltiples
    sector_inicial_final, -- sector inicial
    p_materiales,
    p_nombre_creador,
    p_telefono_cliente,
    p_email_cliente,
    p_direccion_cliente,
    p_whatsapp_link,
    p_ubicacion_link,
    p_drive_link,
    p_foto_url,
    p_dni_cuit,
    NOW(),
    NOW()
  )
  RETURNING * INTO inserted_row;
  
  -- El trigger automáticamente creará las sub-tareas si hay múltiples sectores
  
  -- Retornar la fila insertada
  RETURN QUERY
  SELECT 
    inserted_row.id,
    inserted_row.numero_op,
    inserted_row.cliente,
    inserted_row.telefono_cliente,
    inserted_row.email_cliente,
    inserted_row.direccion_cliente,
    inserted_row.whatsapp_link,
    inserted_row.ubicacion_link,
    inserted_row.drive_link,
    inserted_row.foto_url;
END;
$$;

-- Otorgar permisos
GRANT EXECUTE ON FUNCTION public.create_orden_with_contact TO anon;
GRANT EXECUTE ON FUNCTION public.create_orden_with_contact TO authenticated;

COMMIT;

