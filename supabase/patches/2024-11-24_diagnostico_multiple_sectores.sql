-- Script de diagnóstico para verificar el sistema de múltiples sectores

BEGIN;

-- ============================================
-- PASO 1: Verificar que las columnas existen
-- ============================================
DO $$
DECLARE
  sectores_exists boolean;
  sector_inicial_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'sectores'
  ) INTO sectores_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'sector_inicial'
  ) INTO sector_inicial_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 VERIFICACIÓN DE COLUMNAS EN ordenes_trabajo:';
  RAISE NOTICE '   Columna "sectores": %', CASE WHEN sectores_exists THEN '✅ Existe' ELSE '❌ NO EXISTE' END;
  RAISE NOTICE '   Columna "sector_inicial": %', CASE WHEN sector_inicial_exists THEN '✅ Existe' ELSE '❌ NO EXISTE' END;
  
  IF NOT sectores_exists OR NOT sector_inicial_exists THEN
    RAISE WARNING '⚠️ FALTAN COLUMNAS. Ejecuta: 2024-11-24_add_multiple_sectors_support.sql';
  END IF;
END $$;

-- ============================================
-- PASO 2: Verificar columnas en tabla tareas
-- ============================================
DO $$
DECLARE
  tareas_sector_exists boolean;
  tareas_es_sub_tarea_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tareas'
      AND column_name = 'sector'
  ) INTO tareas_sector_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tareas'
      AND column_name = 'es_sub_tarea'
  ) INTO tareas_es_sub_tarea_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 VERIFICACIÓN DE COLUMNAS EN tareas:';
  RAISE NOTICE '   Columna "sector": %', CASE WHEN tareas_sector_exists THEN '✅ Existe' ELSE '❌ NO EXISTE' END;
  RAISE NOTICE '   Columna "es_sub_tarea": %', CASE WHEN tareas_es_sub_tarea_exists THEN '✅ Existe' ELSE '❌ NO EXISTE' END;
  
  IF NOT tareas_sector_exists OR NOT tareas_es_sub_tarea_exists THEN
    RAISE WARNING '⚠️ FALTAN COLUMNAS EN tareas. Ejecuta: 2024-11-24_add_multiple_sectors_support.sql';
  END IF;
END $$;

-- ============================================
-- PASO 3: Verificar funciones
-- ============================================
DO $$
DECLARE
  crear_sub_tareas_exists boolean;
  actualizar_sub_tareas_exists boolean;
  create_orden_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'crear_sub_tareas_automaticas'
  ) INTO crear_sub_tareas_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'actualizar_sub_tareas'
  ) INTO actualizar_sub_tareas_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'create_orden_with_contact'
  ) INTO create_orden_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 VERIFICACIÓN DE FUNCIONES:';
  RAISE NOTICE '   crear_sub_tareas_automaticas: %', CASE WHEN crear_sub_tareas_exists THEN '✅ Existe' ELSE '❌ NO EXISTE' END;
  RAISE NOTICE '   actualizar_sub_tareas: %', CASE WHEN actualizar_sub_tareas_exists THEN '✅ Existe' ELSE '❌ NO EXISTE' END;
  RAISE NOTICE '   create_orden_with_contact: %', CASE WHEN create_orden_exists THEN '✅ Existe' ELSE '❌ NO EXISTE' END;
END $$;

-- ============================================
-- PASO 4: Verificar triggers
-- ============================================
DO $$
DECLARE
  trigger_crear_exists boolean;
  trigger_actualizar_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name = 'trigger_crear_sub_tareas'
  ) INTO trigger_crear_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name = 'trigger_actualizar_sub_tareas'
  ) INTO trigger_actualizar_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '⚙️ VERIFICACIÓN DE TRIGGERS:';
  RAISE NOTICE '   trigger_crear_sub_tareas: %', CASE WHEN trigger_crear_exists THEN '✅ Activo' ELSE '❌ NO EXISTE' END;
  RAISE NOTICE '   trigger_actualizar_sub_tareas: %', CASE WHEN trigger_actualizar_exists THEN '✅ Activo' ELSE '❌ NO EXISTE' END;
END $$;

-- ============================================
-- PASO 5: Verificar parámetros de create_orden_with_contact
-- ============================================
DO $$
DECLARE
  param_count integer;
BEGIN
  SELECT COUNT(*) INTO param_count
  FROM information_schema.parameters
  WHERE specific_schema = 'public'
    AND specific_name = 'create_orden_with_contact'
    AND parameter_name IN ('p_sectores', 'p_sector_inicial');
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 PARÁMETROS DE create_orden_with_contact:';
  RAISE NOTICE '   Parámetros p_sectores y p_sector_inicial: %', CASE WHEN param_count = 2 THEN '✅ Existen' ELSE '❌ FALTAN (ejecuta: 2024-11-24_update_create_orden_function.sql)' END;
END $$;

-- ============================================
-- PASO 6: Mostrar ejemplo de orden con múltiples sectores
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 ÓRDENES CON MÚLTIPLES SECTORES (últimas 5):';
END $$;

SELECT 
  id,
  numero_op,
  cliente,
  sectores,
  sector_inicial,
  sector
FROM public.ordenes_trabajo
WHERE sectores IS NOT NULL 
  AND array_length(sectores, 1) > 1
ORDER BY id DESC
LIMIT 5;

-- ============================================
-- PASO 7: Mostrar sub-tareas existentes
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 SUB-TAREAS EXISTENTES (últimas 10):';
END $$;

SELECT 
  t.id,
  t.id_orden,
  t.sector,
  t.estado_kanban,
  t.es_sub_tarea,
  o.numero_op,
  o.cliente
FROM public.tareas t
JOIN public.ordenes_trabajo o ON t.id_orden = o.id
WHERE t.es_sub_tarea = true
ORDER BY t.id DESC
LIMIT 10;

COMMIT;

