-- Script para probar manualmente que los triggers funcionan
-- Este script simula las acciones que deberían generar notificaciones

BEGIN;

-- ============================================
-- PASO 1: Verificar que tenemos usuarios y órdenes
-- ============================================
DO $$
DECLARE
  usuarios_count integer;
  ordenes_count integer;
  test_user_id integer;
  test_orden_id integer;
  test_nombre text;
BEGIN
  -- Contar usuarios
  SELECT COUNT(*) INTO usuarios_count FROM public.usuarios;
  RAISE NOTICE '📊 Usuarios disponibles: %', usuarios_count;
  
  -- Contar órdenes
  SELECT COUNT(*) INTO ordenes_count FROM public.ordenes_trabajo;
  RAISE NOTICE '📊 Órdenes disponibles: %', ordenes_count;
  
  -- Obtener un usuario de prueba
  SELECT id, nombre INTO test_user_id, test_nombre
  FROM public.usuarios
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION '❌ No hay usuarios. Crea al menos un usuario primero.';
  END IF;
  
  RAISE NOTICE '👤 Usuario de prueba: % (ID: %)', test_nombre, test_user_id;
  
  -- Obtener una orden de prueba
  SELECT id INTO test_orden_id
  FROM public.ordenes_trabajo
  LIMIT 1;
  
  IF test_orden_id IS NULL THEN
    RAISE WARNING '⚠️ No hay órdenes. Los triggers de nueva orden no se pueden probar.';
  ELSE
    RAISE NOTICE '📋 Orden de prueba: ID %', test_orden_id;
  END IF;
END $$;

-- ============================================
-- PASO 2: Probar trigger de cambio de estado
-- ============================================
DO $$
DECLARE
  test_orden_id integer;
  test_user_id integer;
  test_nombre text;
  notifications_before integer;
  notifications_after integer;
BEGIN
  -- Obtener datos de prueba
  SELECT id INTO test_orden_id FROM public.ordenes_trabajo LIMIT 1;
  SELECT id, nombre INTO test_user_id, test_nombre FROM public.usuarios LIMIT 1;
  
  IF test_orden_id IS NULL OR test_user_id IS NULL THEN
    RAISE NOTICE '⏭️ Saltando prueba de cambio de estado: faltan datos';
    RETURN;
  END IF;
  
  -- Contar notificaciones antes
  SELECT COUNT(*) INTO notifications_before FROM public.user_notifications;
  
  RAISE NOTICE '';
  RAISE NOTICE '🧪 PRUEBA 1: Cambio de estado de orden';
  RAISE NOTICE '   Orden ID: %', test_orden_id;
  RAISE NOTICE '   Usuario asignado: %', test_nombre;
  RAISE NOTICE '   Notificaciones antes: %', notifications_before;
  
  -- Actualizar el estado de la orden (esto debería disparar el trigger)
  UPDATE public.ordenes_trabajo
  SET 
    estado = CASE 
      WHEN estado = 'Pendiente' THEN 'En Proceso'
      WHEN estado = 'En Proceso' THEN 'Completado'
      ELSE 'Pendiente'
    END,
    operario_asignado = test_nombre
  WHERE id = test_orden_id;
  
  -- Esperar un momento para que el trigger se ejecute
  PERFORM pg_sleep(0.5);
  
  -- Contar notificaciones después
  SELECT COUNT(*) INTO notifications_after FROM public.user_notifications;
  
  RAISE NOTICE '   Notificaciones después: %', notifications_after;
  
  IF notifications_after > notifications_before THEN
    RAISE NOTICE '   ✅ ÉXITO: Se creó una notificación';
  ELSE
    RAISE WARNING '   ❌ FALLO: No se creó ninguna notificación';
    RAISE NOTICE '   💡 Verifica:';
    RAISE NOTICE '      - Que el trigger trigger_notify_estado_change existe';
    RAISE NOTICE '      - Que el nombre del usuario coincide exactamente';
    RAISE NOTICE '      - Que la función get_user_id_from_nombre funciona';
  END IF;
END $$;

-- ============================================
-- PASO 3: Ver notificaciones creadas
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
-- PASO 4: Diagnóstico detallado
-- ============================================
DO $$
DECLARE
  trigger_count integer;
  function_count integer;
  test_nombre text;
  test_id integer;
BEGIN
  -- Contar triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE 'trigger_notify%';
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 DIAGNÓSTICO:';
  RAISE NOTICE '   Triggers de notificación: %', trigger_count;
  
  -- Contar funciones
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN ('get_user_id_from_nombre', 'notify_estado_change', 'notify_operario_assignment', 'notify_new_orden');
  
  RAISE NOTICE '   Funciones de notificación: %', function_count;
  
  -- Probar función get_user_id_from_nombre
  SELECT nombre INTO test_nombre FROM public.usuarios LIMIT 1;
  IF test_nombre IS NOT NULL THEN
    test_id := public.get_user_id_from_nombre(test_nombre);
    RAISE NOTICE '   Función get_user_id_from_nombre("%"): %', test_nombre, COALESCE(test_id::text, 'NULL');
    
    IF test_id IS NULL THEN
      RAISE WARNING '   ⚠️ La función no encuentra el usuario. Verifica que los nombres coincidan exactamente.';
    END IF;
  END IF;
END $$;

COMMIT;

