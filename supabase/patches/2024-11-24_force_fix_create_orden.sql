-- Script FORZADO para corregir create_orden_with_contact
-- Este script es más agresivo y elimina TODAS las variantes sin importar los parámetros

-- ============================================
-- PASO 1: Verificar estado actual
-- ============================================
DO $$
DECLARE
  func_count integer;
  func_info record;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNÓSTICO INICIAL';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'create_orden_with_contact';
  
  RAISE NOTICE 'Funciones encontradas: %', func_count;
  
  IF func_count > 0 THEN
    RAISE NOTICE 'Detalles de las funciones:';
    FOR func_info IN
      SELECT 
        p.oid,
        p.proname,
        pg_get_function_identity_arguments(p.oid) AS args,
        pg_get_function_result(p.oid) AS return_type,
        pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
        AND p.proname = 'create_orden_with_contact'
    LOOP
      RAISE NOTICE '  - OID: %, Args: %, Retorna: %', 
        func_info.oid, 
        func_info.args, 
        func_info.return_type;
    END LOOP;
  END IF;
END $$;

-- ============================================
-- PASO 2: ELIMINAR TODAS LAS VARIANTES (MÉTODO AGRESIVO)
-- ============================================
DO $$
DECLARE
  func_record record;
  drop_sql text;
  drop_count integer := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ELIMINANDO TODAS LAS VARIANTES';
  RAISE NOTICE '========================================';
  
  -- Método 1: Eliminar por OID (más directo)
  FOR func_record IN
    SELECT 
      p.oid,
      p.proname,
      n.nspname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'create_orden_with_contact'
  LOOP
    BEGIN
      -- Intentar eliminar por OID primero
      EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
        func_record.nspname,
        func_record.proname, 
        func_record.args
      );
      drop_count := drop_count + 1;
      RAISE NOTICE '✅ Eliminada (por args): %(%)', 
        func_record.proname, 
        func_record.args;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️ Error al eliminar %(%): %', 
        func_record.proname, 
        func_record.args,
        SQLERRM;
      
      -- Intentar eliminar por OID directamente
      BEGIN
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE', 
          func_record.nspname,
          func_record.proname
        );
        RAISE NOTICE '✅ Eliminada (por nombre): %', func_record.proname;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING '⚠️ Error al eliminar por nombre: %', SQLERRM;
      END;
    END;
  END LOOP;
  
  RAISE NOTICE 'Total eliminadas: %', drop_count;
END $$;

-- ============================================
-- PASO 3: Verificar que se eliminaron todas
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
    RAISE WARNING '⚠️ AÚN QUEDAN % FUNCIONES - Intentando eliminación forzada...', remaining_count;
    
    -- Eliminación forzada por OID
    PERFORM p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'create_orden_with_contact';
  ELSE
    RAISE NOTICE '✅ Todas las funciones fueron eliminadas';
  END IF;
END $$;

-- ============================================
-- PASO 4: CREAR LA FUNCIÓN CORRECTA
-- ============================================
BEGIN;

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
RETURNS integer  -- ⚠️ IMPORTANTE: Retorna integer, NO TABLE
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
    sector,
    sectores,
    sector_inicial,
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
    sector_inicial_final,
    sectores_final,
    sector_inicial_final,
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
  
  -- Retornar SOLO el ID (integer)
  RETURN new_id;
END;
$$;

-- ============================================
-- PASO 5: Otorgar permisos
-- ============================================
GRANT EXECUTE ON FUNCTION public.create_orden_with_contact(
  varchar, varchar, date, text, varchar, varchar, varchar, text, text, text[], text, text, varchar, text, text, text, text, text, text, text, text
) TO anon;

GRANT EXECUTE ON FUNCTION public.create_orden_with_contact(
  varchar, varchar, date, text, varchar, varchar, varchar, text, text, text[], text, text, varchar, text, text, text, text, text, text, text, text
) TO authenticated;

COMMIT;

-- ============================================
-- PASO 6: Verificación final
-- ============================================
DO $$
DECLARE
  func_count integer;
  func_return_type text;
  func_params text;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN FINAL';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'create_orden_with_contact';
  
  IF func_count = 1 THEN
    RAISE NOTICE '✅ Función creada correctamente (1 variante)';
    
    SELECT 
      pg_get_function_result(p.oid),
      pg_get_function_identity_arguments(p.oid)
    INTO func_return_type, func_params
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'create_orden_with_contact'
    LIMIT 1;
    
    RAISE NOTICE 'Tipo de retorno: %', func_return_type;
    RAISE NOTICE 'Parámetros: %', func_params;
    
    IF func_return_type = 'integer' THEN
      RAISE NOTICE '✅✅✅ TIPO DE RETORNO CORRECTO: integer ✅✅✅';
    ELSE
      RAISE WARNING '❌❌❌ TIPO DE RETORNO INCORRECTO: % (debería ser integer) ❌❌❌', func_return_type;
    END IF;
  ELSE
    RAISE WARNING '❌ Se encontraron % funciones (debería haber solo 1)', func_count;
  END IF;
END $$;

