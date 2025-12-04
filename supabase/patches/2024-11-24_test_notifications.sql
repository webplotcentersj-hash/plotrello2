-- Script de diagnóstico para verificar que las notificaciones funcionan

BEGIN;

-- ============================================
-- PASO 1: Verificar que las funciones existen
-- ============================================
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_id_from_nombre',
    'notify_estado_change',
    'notify_operario_assignment',
    'notify_new_orden',
    'notify_new_comment'
  )
ORDER BY routine_name;

-- ============================================
-- PASO 2: Verificar que los triggers existen
-- ============================================
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE 'trigger_notify%'
ORDER BY trigger_name;

-- ============================================
-- PASO 3: Probar la función get_user_id_from_nombre
-- ============================================
DO $$
DECLARE
  test_user_id integer;
  test_nombre text;
  usuarios_exists boolean;
BEGIN
  -- Verificar si la tabla usuarios existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
  ) INTO usuarios_exists;
  
  IF usuarios_exists THEN
    -- Obtener un nombre de usuario de prueba
    SELECT nombre INTO test_nombre
    FROM public.usuarios
    LIMIT 1;
    
    IF test_nombre IS NOT NULL THEN
      test_user_id := public.get_user_id_from_nombre(test_nombre);
      RAISE NOTICE '✅ Función get_user_id_from_nombre probada:';
      RAISE NOTICE '   Usuario: %', test_nombre;
      RAISE NOTICE '   ID encontrado: %', test_user_id;
    ELSE
      RAISE WARNING '⚠️ No hay usuarios en la tabla usuarios';
    END IF;
  ELSE
    RAISE WARNING '⚠️ La tabla usuarios no existe. Los triggers de notificaciones no funcionarán correctamente.';
  END IF;
END $$;

-- ============================================
-- PASO 4: Verificar estructura de user_notifications
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_notifications'
ORDER BY ordinal_position;

-- ============================================
-- PASO 5: Crear una notificación de prueba manualmente
-- ============================================
DO $$
DECLARE
  test_user_id integer;
  test_orden_id integer;
  notification_id integer;
  usuarios_exists boolean;
  ordenes_exists boolean;
BEGIN
  -- Verificar si las tablas existen
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'usuarios'
  ) INTO usuarios_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ordenes_trabajo'
  ) INTO ordenes_exists;
  
  IF NOT usuarios_exists THEN
    RAISE WARNING '⚠️ La tabla usuarios no existe. No se puede crear notificación de prueba.';
    RETURN;
  END IF;
  
  -- Obtener un usuario de prueba
  SELECT id INTO test_user_id
  FROM public.usuarios
  LIMIT 1;
  
  -- Obtener una orden de prueba (opcional)
  IF ordenes_exists THEN
    SELECT id INTO test_orden_id
    FROM public.ordenes_trabajo
    LIMIT 1;
  END IF;
  
  IF test_user_id IS NOT NULL THEN
    -- Crear notificación de prueba
    BEGIN
      INSERT INTO public.user_notifications (
        user_id,
        title,
        description,
        type,
        orden_id,
        is_read
      ) VALUES (
        test_user_id,
        '🔔 Notificación de prueba',
        'Si ves esto, el sistema de notificaciones funciona correctamente',
        'info',
        test_orden_id,
        false
      )
      RETURNING id INTO notification_id;
      
      RAISE NOTICE '✅ Notificación de prueba creada con ID: %', notification_id;
      RAISE NOTICE '   Usuario: %', test_user_id;
      RAISE NOTICE '   Orden: %', COALESCE(test_orden_id::text, 'N/A');
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Error creando notificación de prueba: %', SQLERRM;
    END;
  ELSE
    RAISE WARNING '⚠️ No se pudo crear notificación de prueba: no hay usuarios';
  END IF;
END $$;

-- ============================================
-- PASO 6: Verificar notificaciones existentes
-- ============================================
SELECT 
  id,
  user_id,
  title,
  type,
  is_read,
  timestamp
FROM public.user_notifications
ORDER BY timestamp DESC
LIMIT 10;

-- ============================================
-- PASO 7: Verificar permisos en user_notifications
-- ============================================
DO $$
DECLARE
  has_insert_anon boolean;
  has_select_anon boolean;
  has_insert_auth boolean;
  has_select_auth boolean;
BEGIN
  SELECT 
    has_table_privilege('anon', 'user_notifications', 'INSERT'),
    has_table_privilege('anon', 'user_notifications', 'SELECT'),
    has_table_privilege('authenticated', 'user_notifications', 'INSERT'),
    has_table_privilege('authenticated', 'user_notifications', 'SELECT')
  INTO has_insert_anon, has_select_anon, has_insert_auth, has_select_auth;
  
  RAISE NOTICE '🔐 Permisos en user_notifications:';
  RAISE NOTICE '   anon - INSERT: %, SELECT: %', 
    CASE WHEN has_insert_anon THEN '✅' ELSE '❌' END,
    CASE WHEN has_select_anon THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   authenticated - INSERT: %, SELECT: %', 
    CASE WHEN has_insert_auth THEN '✅' ELSE '❌' END,
    CASE WHEN has_select_auth THEN '✅' ELSE '❌' END;
END $$;

COMMIT;

