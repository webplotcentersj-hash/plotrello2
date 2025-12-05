-- Diagnóstico de la función create_orden_with_contact
-- Verifica que la función existe, tiene los parámetros correctos y puede ejecutarse

DO $$
DECLARE
  func_exists boolean;
  func_return_type text;
  func_params text;
  func_oid oid;
BEGIN
  -- Verificar si la función existe
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'create_orden_with_contact'
  ) INTO func_exists;
  
  IF func_exists THEN
    RAISE NOTICE '✅ La función create_orden_with_contact existe';
    
    -- Obtener información de la función
    SELECT 
      p.oid,
      pg_get_function_result(p.oid) AS return_type,
      pg_get_function_identity_arguments(p.oid) AS params
    INTO func_oid, func_return_type, func_params
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'create_orden_with_contact'
    LIMIT 1;
    
    RAISE NOTICE '📋 Tipo de retorno: %', func_return_type;
    RAISE NOTICE '📋 Parámetros: %', func_params;
    
    -- Verificar que retorna integer
    IF func_return_type = 'integer' THEN
      RAISE NOTICE '✅ El tipo de retorno es correcto (integer)';
    ELSE
      RAISE WARNING '⚠️ El tipo de retorno es % (se esperaba integer)', func_return_type;
    END IF;
    
    -- Verificar permisos usando el OID
    IF func_oid IS NOT NULL THEN
      SELECT has_function_privilege('anon', func_oid, 'EXECUTE') INTO func_exists;
      IF func_exists THEN
        RAISE NOTICE '✅ El rol anon tiene permisos de ejecución';
      ELSE
        RAISE WARNING '⚠️ El rol anon NO tiene permisos de ejecución';
      END IF;
      
      SELECT has_function_privilege('authenticated', func_oid, 'EXECUTE') INTO func_exists;
      IF func_exists THEN
        RAISE NOTICE '✅ El rol authenticated tiene permisos de ejecución';
      ELSE
        RAISE WARNING '⚠️ El rol authenticated NO tiene permisos de ejecución';
      END IF;
    END IF;
    
  ELSE
    RAISE WARNING '❌ La función create_orden_with_contact NO existe';
    RAISE NOTICE '💡 Ejecuta el script: 2024-11-24_update_create_orden_function.sql';
  END IF;
  
  -- Verificar que la tabla ordenes_trabajo existe y tiene las columnas necesarias
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ordenes_trabajo') THEN
    RAISE NOTICE '✅ La tabla ordenes_trabajo existe';
    
    -- Verificar columnas importantes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ordenes_trabajo' AND column_name = 'sectores') THEN
      RAISE NOTICE '✅ La columna sectores existe';
    ELSE
      RAISE WARNING '⚠️ La columna sectores NO existe';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ordenes_trabajo' AND column_name = 'sector_inicial') THEN
      RAISE NOTICE '✅ La columna sector_inicial existe';
    ELSE
      RAISE WARNING '⚠️ La columna sector_inicial NO existe';
    END IF;
  ELSE
    RAISE WARNING '❌ La tabla ordenes_trabajo NO existe';
  END IF;
  
END $$;

-- Intentar una prueba de ejecución (solo si la función existe)
DO $$
DECLARE
  test_id integer;
  test_error text;
BEGIN
  -- Verificar si la función existe antes de probarla
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'create_orden_with_contact'
  ) THEN
    BEGIN
      -- Intentar crear una orden de prueba
      SELECT public.create_orden_with_contact(
        'TEST-' || to_char(now(), 'YYYYMMDDHH24MISS'),
        'Cliente Test',
        CURRENT_DATE + 7,
        'Descripción de prueba',
        'Pendiente',
        'Normal',
        NULL,
        'Media',
        'Diseño Gráfico',
        ARRAY['Diseño Gráfico', 'Taller Gráfico']::text[],
        'Diseño Gráfico',
        NULL,
        'Usuario Test',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL
      ) INTO test_id;
      
      IF test_id IS NOT NULL THEN
        RAISE NOTICE '✅ Prueba exitosa: Se creó una orden de prueba con ID: %', test_id;
        
        -- Limpiar: eliminar la orden de prueba
        DELETE FROM public.ordenes_trabajo WHERE id = test_id;
        RAISE NOTICE '🧹 Orden de prueba eliminada';
      ELSE
        RAISE WARNING '⚠️ La función retornó NULL';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Error al ejecutar la función: %', SQLERRM;
      RAISE NOTICE '💡 Detalles: %', SQLSTATE;
    END;
  ELSE
    RAISE NOTICE '⏭️  Saltando prueba: la función no existe';
  END IF;
END $$;

