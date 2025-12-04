-- Script para probar que las menciones en chat funcionan correctamente

BEGIN;

-- ============================================
-- PASO 1: Verificar que las tablas existen
-- ============================================
DO $$
DECLARE
  chat_messages_exists boolean;
  user_notifications_exists boolean;
  usuarios_exists boolean;
  chat_rooms_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_messages'
  ) INTO chat_messages_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_notifications'
  ) INTO user_notifications_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'usuarios'
  ) INTO usuarios_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_rooms'
  ) INTO chat_rooms_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 VERIFICACIÓN DE TABLAS:';
  RAISE NOTICE '   chat_messages: %', CASE WHEN chat_messages_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   user_notifications: %', CASE WHEN user_notifications_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   usuarios: %', CASE WHEN usuarios_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '   chat_rooms: %', CASE WHEN chat_rooms_exists THEN '✅' ELSE '❌' END;
END $$;

-- ============================================
-- PASO 2: Verificar que el trigger existe
-- ============================================
DO $$
DECLARE
  trigger_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name = 'trigger_notify_chat_mentions'
  ) INTO trigger_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 VERIFICACIÓN DE TRIGGER:';
  RAISE NOTICE '   trigger_notify_chat_mentions: %', CASE WHEN trigger_exists THEN '✅' ELSE '❌' END;
END $$;

-- ============================================
-- PASO 3: Probar función extract_mentions
-- ============================================
DO $$
DECLARE
  test_mentions text[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 PROBANDO extract_mentions:';
  
  test_mentions := public.extract_mentions('Hola @Juan, ¿cómo estás?');
  RAISE NOTICE '   "Hola @Juan, ¿cómo estás?" -> %', array_to_string(test_mentions, ', ');
  
  test_mentions := public.extract_mentions('@María y @Pedro están trabajando');
  RAISE NOTICE '   "@María y @Pedro están trabajando" -> %', array_to_string(test_mentions, ', ');
  
  test_mentions := public.extract_mentions('Sin menciones aquí');
  RAISE NOTICE '   "Sin menciones aquí" -> %', COALESCE(array_to_string(test_mentions, ', '), 'ninguna');
END $$;

-- ============================================
-- PASO 4: Mostrar usuarios disponibles para probar
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '👥 USUARIOS DISPONIBLES PARA MENCIONAR:';
SELECT 
  id,
  nombre,
  rol
FROM public.usuarios
ORDER BY id
LIMIT 10;

-- ============================================
-- PASO 5: Crear un mensaje de prueba con mención
-- ============================================
DO $$
DECLARE
  test_user_id integer;
  test_user_nombre text;
  test_room_id integer;
  test_message_id integer;
  notifications_before integer;
  notifications_after integer;
BEGIN
  -- Obtener un usuario de prueba
  SELECT id, nombre INTO test_user_id, test_user_nombre
  FROM public.usuarios
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION '❌ No hay usuarios para probar';
  END IF;
  
  -- Obtener o crear un room de prueba
  SELECT id INTO test_room_id
  FROM public.chat_rooms
  LIMIT 1;
  
  IF test_room_id IS NULL THEN
    INSERT INTO public.chat_rooms (nombre, tipo)
    VALUES ('general', 'publico')
    RETURNING id INTO test_room_id;
    RAISE NOTICE '✅ Room de prueba creado: ID %', test_room_id;
  END IF;
  
  -- Contar notificaciones antes
  SELECT COUNT(*) INTO notifications_before 
  FROM public.user_notifications 
  WHERE user_id = test_user_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '🧪 PROBANDO TRIGGER DE MENCIONES:';
  RAISE NOTICE '   Usuario de prueba: % (ID: %)', test_user_nombre, test_user_id;
  RAISE NOTICE '   Room ID: %', test_room_id;
  RAISE NOTICE '   Notificaciones antes: %', notifications_before;
  
  -- Insertar un mensaje con mención (el trigger debería crear la notificación)
  INSERT INTO public.chat_messages (
    room_id,
    id_usuario,
    nombre_usuario,
    mensaje
  ) VALUES (
    test_room_id,
    test_user_id,
    test_user_nombre,
    format('Mensaje de prueba mencionando a @%s', test_user_nombre)
  ) RETURNING id INTO test_message_id;
  
  RAISE NOTICE '   Mensaje insertado: ID %', test_message_id;
  
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
    RAISE NOTICE '      - El usuario se mencionó a sí mismo (no se notifica)';
    RAISE NOTICE '      - El trigger no está activo';
    RAISE NOTICE '      - Error en la función del trigger (revisa logs)';
  END IF;
END $$;

-- ============================================
-- PASO 6: Ver notificaciones recientes de chat
-- ============================================
RAISE NOTICE '';
RAISE NOTICE '📬 NOTIFICACIONES DE CHAT RECIENTES (últimas 10):';
SELECT 
  id,
  user_id,
  title,
  description,
  type,
  is_read,
  timestamp
FROM public.user_notifications
WHERE type = 'mention' 
  AND description LIKE '%te mencionó en%'
ORDER BY timestamp DESC
LIMIT 10;

COMMIT;

