-- Script definitivo para corregir create_orden_with_contact
-- Elimina TODAS las variantes y crea la función correcta que retorna integer

BEGIN;

-- ============================================
-- PASO 1: Eliminar TODAS las variantes de la función (sin importar parámetros)
-- ============================================
DO $$
DECLARE
  func_record record;
  drop_count integer := 0;
BEGIN
  RAISE NOTICE '🔍 Buscando todas las variantes de create_orden_with_contact...';
  
  -- Buscar todas las variantes de la función
  FOR func_record IN
    SELECT 
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args,
      pg_get_function_result(p.oid) AS return_type
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'create_orden_with_contact'
  LOOP
    -- Eliminar cada variante encontrada
    BEGIN
      EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
        func_record.proname, 
        func_record.args
      );
      drop_count := drop_count + 1;
      RAISE NOTICE '✅ Función eliminada: %(%) - Retornaba: %', 
        func_record.proname, 
        func_record.args,
        func_record.return_type;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️ Error al eliminar función %(%): %', 
        func_record.proname, 
        func_record.args,
        SQLERRM;
    END;
  END LOOP;
  
  IF drop_count = 0 THEN
    RAISE NOTICE 'ℹ️  No se encontraron funciones para eliminar';
  ELSE
    RAISE NOTICE '✅ Total de funciones eliminadas: %', drop_count;
  END IF;
END $$;

-- ============================================
-- PASO 2: Verificar que no queden funciones
-- ============================================
DO $$
DECLARE
  remaining_count integer;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'create_orden_with_contact';
  
  IF remaining_count > 0 THEN
    RAISE WARNING '⚠️ Aún quedan % variantes de la función', remaining_count;
  ELSE
    RAISE NOTICE '✅ Todas las variantes fueron eliminadas correctamente';
  END IF;
END $$;

-- ============================================
-- PASO 3: Crear la función con el tipo de retorno correcto (integer)
-- ============================================
CREATE FUNCTION public.create_orden_with_contact(
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
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id integer;
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
  RETURNING id INTO new_id;
  
  -- El trigger automáticamente creará las sub-tareas si hay múltiples sectores
  
  -- Retornar solo el ID
  RETURN new_id;
END;
$$;

-- ============================================
-- PASO 4: Otorgar permisos
-- ============================================
GRANT EXECUTE ON FUNCTION public.create_orden_with_contact(
  varchar, varchar, date, text, varchar, varchar, varchar, text, text, text[], text, text, varchar, text, text, text, text, text, text, text, text
) TO anon;

GRANT EXECUTE ON FUNCTION public.create_orden_with_contact(
  varchar, varchar, date, text, varchar, varchar, varchar, text, text, text[], text, text, varchar, text, text, text, text, text, text, text, text
) TO authenticated;

-- ============================================
-- PASO 5: Verificar que la función se creó correctamente
-- ============================================
DO $$
DECLARE
  func_count integer;
  func_return_type text;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'create_orden_with_contact';
  
  IF func_count = 1 THEN
    RAISE NOTICE '✅ La función se creó correctamente (1 variante encontrada)';
    
    -- Verificar el tipo de retorno
    SELECT pg_get_function_result(p.oid) INTO func_return_type
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'create_orden_with_contact'
    LIMIT 1;
    
    IF func_return_type = 'integer' THEN
      RAISE NOTICE '✅ El tipo de retorno es correcto: integer';
    ELSE
      RAISE WARNING '⚠️ El tipo de retorno es: % (se esperaba integer)', func_return_type;
    END IF;
  ELSIF func_count > 1 THEN
    RAISE WARNING '⚠️ Se encontraron % variantes de la función (debería haber solo 1)', func_count;
  ELSE
    RAISE WARNING '❌ La función NO se creó';
  END IF;
END $$;

COMMIT;

