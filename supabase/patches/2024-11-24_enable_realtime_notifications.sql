-- Habilitar Realtime para la tabla user_notifications
-- Esto permite que las notificaciones se muestren en tiempo real en el frontend

BEGIN;

-- Verificar si la tabla existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_notifications'
  ) THEN
    RAISE EXCEPTION '❌ La tabla user_notifications no existe. Ejecuta primero: 2024-11-24_create_user_notifications_table.sql';
  END IF;
END $$;

-- Habilitar Realtime usando la función de Supabase
-- Nota: En Supabase, Realtime se habilita desde la UI, pero podemos verificar la configuración
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_notifications'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ Tabla user_notifications existe';
    RAISE NOTICE '';
    RAISE NOTICE '📋 IMPORTANTE: Para habilitar Realtime en Supabase:';
    RAISE NOTICE '   1. Ve a Supabase Dashboard → Table Editor';
    RAISE NOTICE '   2. Selecciona la tabla "user_notifications"';
    RAISE NOTICE '   3. Ve a la pestaña "Realtime"';
    RAISE NOTICE '   4. Habilita "Broadcast"';
    RAISE NOTICE '   5. Habilita los eventos: INSERT, UPDATE';
    RAISE NOTICE '';
    RAISE NOTICE '   Sin esto, las notificaciones NO aparecerán en tiempo real.';
  END IF;
END $$;

-- Verificar permisos RLS (si está habilitado)
DO $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'user_notifications';
  
  IF rls_enabled THEN
    RAISE NOTICE '';
    RAISE NOTICE '🔐 RLS está habilitado en user_notifications';
    RAISE NOTICE '   Verifica que haya políticas que permitan SELECT para los usuarios autenticados.';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS está deshabilitado (acceso libre para Realtime)';
  END IF;
END $$;

COMMIT;

