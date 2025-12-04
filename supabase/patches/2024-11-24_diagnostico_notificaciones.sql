-- Script de diagnóstico completo para el sistema de notificaciones
-- Ejecutar en Supabase SQL Editor

BEGIN;

-- ============================================
-- PASO 1: Verificar estructura de tablas
-- ============================================
DO $$
DECLARE
  usuarios_count integer;
  ordenes_count integer;
  notificaciones_count integer;
BEGIN
  SELECT COUNT(*) INTO usuarios_count FROM public.usuarios;
  SELECT COUNT(*) INTO ordenes_count FROM public.ordenes_trabajo;
  SELECT COUNT(*) INTO notificaciones_count FROM public.user_notifications;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 ESTADO DE LAS TABLAS:';
  RAISE NOTICE '   Usuarios: %', usuarios_count;
  RAISE NOTICE '   Órdenes: %', ordenes_count;
  RAISE NOTICE '   Notificaciones: %', notificaciones_count;
END $$;

-- ============================================
-- PASO 2: Verificar funciones y triggers
-- ============================================
DO $$
DECLARE
  func_count integer;
  trigger_count integer;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN ('get_user_id_from_nombre', 'notify_estado_change', 'notify_operario_assignment', 'notify_new_orden', 'notify_new_comment');
  
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE 'trigger_notify%';
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 FUNCIONES Y TRIGGERS:';
  RAISE NOTICE '   Funciones: %', func_count;
  RAISE NOTICE '   Triggers: %', trigger_count;
END $$;

-- ============================================
-- PASO 3: Mostrar usuarios disponibles
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '👥 USUARIOS DISPONIBLES:';
SELECT 
  id,
  nombre,
  rol
FROM public.usuarios
ORDER BY id
LIMIT 10;

-- ============================================
-- PASO 4: Probar función get_user_id_from_nombre con usuarios reales
-- ============================================
DO $$
DECLARE
  test_user record;
  found_id integer;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 PROBANDO get_user_id_from_nombre:';
  
  FOR test_user IN 
    SELECT id, nombre FROM public.usuarios LIMIT 5
  LOOP
    found_id := public.get_user_id_from_nombre(test_user.nombre);
    IF found_id IS NOT NULL THEN
      RAISE NOTICE '   ✅ "%" -> ID: %', test_user.nombre, found_id;
    ELSE
      RAISE WARNING '   ❌ "%" -> NULL (no encontrado)', test_user.nombre;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- PASO 5: Verificar nombres en ordenes_trabajo vs usuarios
-- ============================================
DO $$
DECLARE
  orden_record record;
  user_id_found integer;
  match_count integer := 0;
  no_match_count integer := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 VERIFICANDO COINCIDENCIAS DE NOMBRES:';
  
  FOR orden_record IN 
    SELECT DISTINCT operario_asignado, nombre_creador
    FROM public.ordenes_trabajo
    WHERE operario_asignado IS NOT NULL OR nombre_creador IS NOT NULL
    LIMIT 10
  LOOP
    IF orden_record.operario_asignado IS NOT NULL THEN
      user_id_found := public.get_user_id_from_nombre(orden_record.operario_asignado);
      IF user_id_found IS NOT NULL THEN
        match_count := match_count + 1;
        RAISE NOTICE '   ✅ Operario "%" -> ID: %', orden_record.operario_asignado, user_id_found;
      ELSE
        no_match_count := no_match_count + 1;
        RAISE WARNING '   ❌ Operario "%" -> NO ENCONTRADO', orden_record.operario_asignado;
      END IF;
    END IF;
    
    IF orden_record.nombre_creador IS NOT NULL THEN
      user_id_found := public.get_user_id_from_nombre(orden_record.nombre_creador);
      IF user_id_found IS NOT NULL THEN
        match_count := match_count + 1;
        RAISE NOTICE '   ✅ Creador "%" -> ID: %', orden_record.nombre_creador, user_id_found;
      ELSE
        no_match_count := no_match_count + 1;
        RAISE WARNING '   ❌ Creador "%" -> NO ENCONTRADO', orden_record.nombre_creador;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '   Coincidencias: %, Sin coincidencias: %', match_count, no_match_count;
END $$;

-- ============================================
-- PASO 6: Crear notificación de prueba manual
-- ============================================
DO $$
DECLARE
  test_user_id integer;
  test_user_nombre text;
  test_notification_id integer;
BEGIN
  -- Obtener un usuario de prueba
  SELECT id, nombre INTO test_user_id, test_user_nombre
  FROM public.usuarios
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION '❌ No hay usuarios para probar';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🧪 CREANDO NOTIFICACIÓN DE PRUEBA:';
  RAISE NOTICE '   Usuario: % (ID: %)', test_user_nombre, test_user_id;
  
  BEGIN
    INSERT INTO public.user_notifications (
      user_id, title, description, type, is_read
    ) VALUES (
      test_user_id,
      '🔔 Notificación de prueba',
      'Esta es una notificación de prueba creada manualmente',
      'info',
      false
    ) RETURNING id INTO test_notification_id;
    
    RAISE NOTICE '   ✅ Notificación creada con ID: %', test_notification_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '   ❌ Error creando notificación: %', SQLERRM;
  END;
END $$;

-- ============================================
-- PASO 7: Verificar notificaciones recientes
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '📬 NOTIFICACIONES RECIENTES (últimas 10):';
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
-- PASO 8: Verificar permisos RLS
-- ============================================
DO $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'user_notifications';
  
  RAISE NOTICE '';
  RAISE NOTICE '🔐 POLÍTICAS RLS:';
  RAISE NOTICE '   RLS habilitado: %', COALESCE(rls_enabled::text, 'desconocido');
  
  IF rls_enabled THEN
    RAISE WARNING '   ⚠️ RLS está habilitado. Verifica que haya políticas que permitan SELECT/INSERT.';
  ELSE
    RAISE NOTICE '   ✅ RLS deshabilitado (acceso libre)';
  END IF;
END $$;

-- ============================================
-- PASO 9: Probar trigger manualmente
-- ============================================
DO $$
DECLARE
  test_orden_id integer;
  test_user_id integer;
  test_user_nombre text;
  notifications_before integer;
  notifications_after integer;
BEGIN
  -- Obtener datos de prueba
  SELECT id INTO test_orden_id FROM public.ordenes_trabajo LIMIT 1;
  SELECT id, nombre INTO test_user_id, test_user_nombre FROM public.usuarios LIMIT 1;
  
  IF test_orden_id IS NULL OR test_user_id IS NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '⏭️ Saltando prueba de trigger: faltan datos';
    RETURN;
  END IF;
  
  -- Contar notificaciones antes
  SELECT COUNT(*) INTO notifications_before 
  FROM public.user_notifications 
  WHERE user_id = test_user_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '🧪 PROBANDO TRIGGER DE CAMBIO DE ESTADO:';
  RAISE NOTICE '   Orden ID: %', test_orden_id;
  RAISE NOTICE '   Usuario: % (ID: %)', test_user_nombre, test_user_id;
  RAISE NOTICE '   Notificaciones antes: %', notifications_before;
  
  -- Actualizar el estado de la orden (esto debería disparar el trigger)
  UPDATE public.ordenes_trabajo
  SET 
    estado = CASE 
      WHEN estado = 'Pendiente' THEN 'En Proceso'
      WHEN estado = 'En Proceso' THEN 'Completado'
      ELSE 'Pendiente'
    END,
    operario_asignado = test_user_nombre
  WHERE id = test_orden_id;
  
  -- Esperar un momento para que el trigger se ejecute
  PERFORM pg_sleep(0.5);
  
  -- Contar notificaciones después
  SELECT COUNT(*) INTO notifications_after 
  FROM public.user_notifications 
  WHERE user_id = test_user_id;
  
  RAISE NOTICE '   Notificaciones después: %', notifications_after;
  
  IF notifications_after > notifications_before THEN
    RAISE NOTICE '   ✅ ÉXITO: Se creó una notificación (trigger funcionó)';
  ELSE
    RAISE WARNING '   ❌ FALLO: No se creó ninguna notificación';
    RAISE NOTICE '   💡 Posibles causas:';
    RAISE NOTICE '      - El nombre del usuario no coincide exactamente';
    RAISE NOTICE '      - La función get_user_id_from_nombre retorna NULL';
    RAISE NOTICE '      - El trigger no está activo';
    RAISE NOTICE '      - Error en la función del trigger (revisa logs)';
  END IF;
END $$;

-- ============================================
-- PASO 10: Resumen final
-- ============================================
DO $$
DECLARE
  total_notificaciones integer;
  notificaciones_no_leidas integer;
  notificaciones_por_usuario integer;
BEGIN
  SELECT COUNT(*) INTO total_notificaciones FROM public.user_notifications;
  SELECT COUNT(*) INTO notificaciones_no_leidas FROM public.user_notifications WHERE is_read = false;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMEN FINAL:';
  RAISE NOTICE '   Total notificaciones: %', total_notificaciones;
  RAISE NOTICE '   No leídas: %', notificaciones_no_leidas;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 NOTIFICACIONES POR USUARIO:';
END $$;

SELECT 
  u.nombre,
  COUNT(un.id) as total,
  COUNT(CASE WHEN un.is_read = false THEN 1 END) as no_leidas
FROM public.usuarios u
LEFT JOIN public.user_notifications un ON u.id = un.user_id
GROUP BY u.id, u.nombre
ORDER BY total DESC
LIMIT 10;

COMMIT;

