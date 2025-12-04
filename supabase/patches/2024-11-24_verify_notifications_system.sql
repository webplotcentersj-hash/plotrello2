-- Script de verificación rápida del sistema de notificaciones

BEGIN;

-- ============================================
-- VERIFICACIÓN 1: Tablas necesarias
-- ============================================
DO $$
DECLARE
  usuarios_exists boolean;
  user_notifications_exists boolean;
  ordenes_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'usuarios'
  ) INTO usuarios_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_notifications'
  ) INTO user_notifications_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ordenes_trabajo'
  ) INTO ordenes_exists;
  
  RAISE NOTICE '📋 Estado de las tablas:';
  RAISE NOTICE '   usuarios: %', CASE WHEN usuarios_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   user_notifications: %', CASE WHEN user_notifications_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   ordenes_trabajo: %', CASE WHEN ordenes_exists THEN '✅' ELSE '❌' END;
END $$;

-- ============================================
-- VERIFICACIÓN 2: Funciones
-- ============================================
SELECT 
  routine_name as funcion,
  CASE WHEN routine_name IN (
    'get_user_id_from_nombre',
    'notify_estado_change',
    'notify_operario_assignment',
    'notify_new_orden',
    'notify_new_comment'
  ) THEN '✅' ELSE '⚠️' END as estado
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'notify%' OR routine_name = 'get_user_id_from_nombre'
ORDER BY routine_name;

-- ============================================
-- VERIFICACIÓN 3: Triggers
-- ============================================
SELECT 
  trigger_name as trigger,
  event_object_table as tabla,
  event_manipulation as evento,
  CASE WHEN trigger_name LIKE 'trigger_notify%' THEN '✅' ELSE '⚠️' END as estado
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trigger_notify%'
ORDER BY trigger_name;

-- ============================================
-- VERIFICACIÓN 4: Usuarios disponibles
-- ============================================
SELECT 
  COUNT(*) as total_usuarios,
  string_agg(nombre, ', ') as nombres
FROM public.usuarios;

-- ============================================
-- VERIFICACIÓN 5: Notificaciones existentes
-- ============================================
SELECT 
  COUNT(*) as total_notificaciones,
  COUNT(*) FILTER (WHERE is_read = false) as no_leidas,
  COUNT(*) FILTER (WHERE is_read = true) as leidas
FROM public.user_notifications;

-- ============================================
-- VERIFICACIÓN 6: Prueba de función get_user_id_from_nombre
-- ============================================
DO $$
DECLARE
  test_nombre text;
  test_id integer;
BEGIN
  SELECT nombre INTO test_nombre FROM public.usuarios LIMIT 1;
  
  IF test_nombre IS NOT NULL THEN
    test_id := public.get_user_id_from_nombre(test_nombre);
    RAISE NOTICE '🧪 Prueba de get_user_id_from_nombre:';
    RAISE NOTICE '   Nombre: %', test_nombre;
    RAISE NOTICE '   ID encontrado: %', COALESCE(test_id::text, 'NULL');
    
    IF test_id IS NULL THEN
      RAISE WARNING '⚠️ La función no encontró el usuario. Verifica que los nombres coincidan exactamente.';
    END IF;
  ELSE
    RAISE WARNING '⚠️ No hay usuarios para probar la función';
  END IF;
END $$;

-- ============================================
-- VERIFICACIÓN 7: Permisos
-- ============================================
DO $$
DECLARE
  has_insert boolean;
  has_select boolean;
BEGIN
  SELECT 
    has_table_privilege('authenticated', 'user_notifications', 'INSERT'),
    has_table_privilege('authenticated', 'user_notifications', 'SELECT')
  INTO has_insert, has_select;
  
  RAISE NOTICE '🔐 Permisos authenticated en user_notifications:';
  RAISE NOTICE '   INSERT: %', CASE WHEN has_insert THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   SELECT: %', CASE WHEN has_select THEN '✅' ELSE '❌' END;
END $$;

COMMIT;

