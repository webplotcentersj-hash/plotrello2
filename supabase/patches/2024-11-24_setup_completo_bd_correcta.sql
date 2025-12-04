-- Script completo para configurar la base de datos correcta
-- Incluye: columnas de contacto, triggers de notificaciones, y verificaciones

BEGIN;

-- ============================================
-- PASO 1: Agregar columnas de contacto a ordenes_trabajo
-- ============================================
DO $$
BEGIN
  -- Telefono cliente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'telefono_cliente'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN telefono_cliente text;
    RAISE NOTICE '✅ Columna telefono_cliente agregada';
  ELSE
    RAISE NOTICE 'ℹ️ Columna telefono_cliente ya existe';
  END IF;

  -- Email cliente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'email_cliente'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN email_cliente text;
    RAISE NOTICE '✅ Columna email_cliente agregada';
  ELSE
    RAISE NOTICE 'ℹ️ Columna email_cliente ya existe';
  END IF;

  -- Direccion cliente
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'direccion_cliente'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN direccion_cliente text;
    RAISE NOTICE '✅ Columna direccion_cliente agregada';
  ELSE
    RAISE NOTICE 'ℹ️ Columna direccion_cliente ya existe';
  END IF;

  -- WhatsApp link
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'whatsapp_link'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN whatsapp_link text;
    RAISE NOTICE '✅ Columna whatsapp_link agregada';
  ELSE
    RAISE NOTICE 'ℹ️ Columna whatsapp_link ya existe';
  END IF;

  -- Ubicacion link
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'ubicacion_link'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN ubicacion_link text;
    RAISE NOTICE '✅ Columna ubicacion_link agregada';
  ELSE
    RAISE NOTICE 'ℹ️ Columna ubicacion_link ya existe';
  END IF;

  -- Drive link
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'drive_link'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN drive_link text;
    RAISE NOTICE '✅ Columna drive_link agregada';
  ELSE
    RAISE NOTICE 'ℹ️ Columna drive_link ya existe';
  END IF;
END $$;

-- ============================================
-- PASO 2: Verificar que user_notifications existe y tiene permisos
-- ============================================
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_notifications'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION '❌ La tabla user_notifications no existe. Ejecuta primero: 2024-11-24_create_user_notifications_table.sql';
  ELSE
    RAISE NOTICE '✅ Tabla user_notifications existe';
  END IF;
END $$;

-- Otorgar permisos necesarios
GRANT SELECT, INSERT, UPDATE ON public.user_notifications TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_notifications_id_seq TO anon, authenticated;

-- ============================================
-- PASO 3: Crear función get_user_id_from_nombre
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_id_from_nombre(nombre_usuario text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_result integer;
  nombre_limpio text;
BEGIN
  IF nombre_usuario IS NULL OR trim(nombre_usuario) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Limpiar el nombre (quitar espacios, convertir a minúsculas para comparación)
  nombre_limpio := trim(lower(nombre_usuario));
  
  -- Buscar por coincidencia exacta primero
  SELECT id INTO user_id_result
  FROM public.usuarios
  WHERE lower(trim(nombre)) = nombre_limpio
  LIMIT 1;
  
  -- Si no se encuentra, intentar buscar por coincidencia parcial (sin dominio de email)
  IF user_id_result IS NULL AND nombre_limpio LIKE '%@%' THEN
    SELECT id INTO user_id_result
    FROM public.usuarios
    WHERE lower(trim(nombre)) LIKE '%' || split_part(nombre_limpio, '@', 1) || '%'
    LIMIT 1;
  END IF;
  
  RETURN user_id_result;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Función get_user_id_from_nombre creada/actualizada';
END $$;

-- ============================================
-- PASO 4: Crear función notify_estado_change
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_estado_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_destino integer;
  notification_title text;
  notification_desc text;
BEGIN
  -- Solo notificar si el estado cambió
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    -- Notificar al operario asignado si existe
    IF NEW.operario_asignado IS NOT NULL AND trim(NEW.operario_asignado) != '' THEN
      user_id_destino := public.get_user_id_from_nombre(NEW.operario_asignado);
      
      IF user_id_destino IS NOT NULL THEN
        notification_title := 'Estado de orden actualizado';
        notification_desc := format('La orden #%s (%s) cambió de "%s" a "%s"', 
          NEW.numero_op, NEW.cliente, OLD.estado, NEW.estado);
        
        BEGIN
          INSERT INTO public.user_notifications (
            user_id, title, description, type, orden_id, is_read
          ) VALUES (
            user_id_destino, notification_title, notification_desc, 'info', NEW.id, false
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error creando notificación para usuario %: %', user_id_destino, SQLERRM;
        END;
      END IF;
    END IF;
    
    -- Notificar al creador si es diferente del operario
    IF NEW.nombre_creador IS NOT NULL 
       AND trim(NEW.nombre_creador) != '' 
       AND (NEW.operario_asignado IS NULL OR trim(NEW.nombre_creador) != trim(NEW.operario_asignado)) THEN
      user_id_destino := public.get_user_id_from_nombre(NEW.nombre_creador);
      
      IF user_id_destino IS NOT NULL THEN
        notification_title := 'Tu orden cambió de estado';
        notification_desc := format('La orden #%s (%s) cambió de "%s" a "%s"', 
          NEW.numero_op, NEW.cliente, OLD.estado, NEW.estado);
        
        BEGIN
          INSERT INTO public.user_notifications (
            user_id, title, description, type, orden_id, is_read
          ) VALUES (
            user_id_destino, notification_title, notification_desc, 'info', NEW.id, false
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error creando notificación para creador %: %', user_id_destino, SQLERRM;
        END;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- PASO 5: Crear función notify_operario_assignment
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_operario_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_destino integer;
BEGIN
  -- Solo notificar si el operario cambió y no es NULL
  IF NEW.operario_asignado IS NOT NULL 
     AND trim(NEW.operario_asignado) != ''
     AND (OLD.operario_asignado IS NULL OR trim(OLD.operario_asignado) != trim(NEW.operario_asignado)) THEN
    user_id_destino := public.get_user_id_from_nombre(NEW.operario_asignado);
    
    IF user_id_destino IS NOT NULL THEN
      BEGIN
        INSERT INTO public.user_notifications (
          user_id, title, description, type, orden_id, is_read
        ) VALUES (
          user_id_destino,
          'Nueva orden asignada',
          format('Te asignaron la orden #%s: %s', NEW.numero_op, NEW.cliente),
          'success',
          NEW.id,
          false
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creando notificación de asignación: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- PASO 6: Crear función notify_new_orden
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_new_orden()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_destino integer;
BEGIN
  -- Notificar al operario asignado si existe
  IF NEW.operario_asignado IS NOT NULL AND trim(NEW.operario_asignado) != '' THEN
    user_id_destino := public.get_user_id_from_nombre(NEW.operario_asignado);
    
    IF user_id_destino IS NOT NULL THEN
      BEGIN
        INSERT INTO public.user_notifications (
          user_id, title, description, type, orden_id, is_read
        ) VALUES (
          user_id_destino,
          'Nueva orden creada',
          format('Se creó la orden #%s: %s', NEW.numero_op, NEW.cliente),
          'success',
          NEW.id,
          false
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creando notificación de nueva orden: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- PASO 7: Crear función notify_new_comment
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_destino integer;
  orden_data record;
  mentioned_user_id integer;
  user_name text;
BEGIN
  -- Obtener datos de la orden
  SELECT numero_op, cliente, operario_asignado, nombre_creador
  INTO orden_data
  FROM public.ordenes_trabajo
  WHERE id = NEW.id_orden;
  
  -- Notificar al operario asignado (si no es quien comentó)
  IF orden_data.operario_asignado IS NOT NULL 
     AND orden_data.operario_asignado != NEW.usuario_nombre THEN
    user_id_destino := public.get_user_id_from_nombre(orden_data.operario_asignado);
    
    IF user_id_destino IS NOT NULL THEN
      BEGIN
        INSERT INTO public.user_notifications (
          user_id, title, description, type, orden_id, is_read
        ) VALUES (
          user_id_destino,
          'Nuevo comentario',
          format('%s comentó en la orden #%s: %s', 
            NEW.usuario_nombre, orden_data.numero_op, orden_data.cliente),
          'info',
          NEW.id_orden,
          false
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creando notificación de comentario: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  -- Notificar al creador (si no es quien comentó y es diferente del operario)
  IF orden_data.nombre_creador IS NOT NULL 
     AND orden_data.nombre_creador != NEW.usuario_nombre
     AND orden_data.nombre_creador != orden_data.operario_asignado THEN
    user_id_destino := public.get_user_id_from_nombre(orden_data.nombre_creador);
    
    IF user_id_destino IS NOT NULL THEN
      BEGIN
        INSERT INTO public.user_notifications (
          user_id, title, description, type, orden_id, is_read
        ) VALUES (
          user_id_destino,
          'Nuevo comentario',
          format('%s comentó en tu orden #%s: %s', 
            NEW.usuario_nombre, orden_data.numero_op, orden_data.cliente),
          'info',
          NEW.id_orden,
          false
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error creando notificación de comentario: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  -- Detectar menciones (@usuario) en el comentario
  IF NEW.comentario ~* '@[a-zA-Z0-9_]+' THEN
    FOR user_name IN 
      SELECT regexp_split_to_table(NEW.comentario, '@') 
      WHERE regexp_split_to_table ~* '^[a-zA-Z0-9_]+'
    LOOP
      user_name := regexp_replace(user_name, '[^a-zA-Z0-9_].*', '');
      mentioned_user_id := public.get_user_id_from_nombre(user_name);
      
      IF mentioned_user_id IS NOT NULL THEN
        BEGIN
          INSERT INTO public.user_notifications (
            user_id, title, description, type, orden_id, is_read
          ) VALUES (
            mentioned_user_id,
            'Te mencionaron',
            format('%s te mencionó en un comentario de la orden #%s', 
              NEW.usuario_nombre, orden_data.numero_op),
            'mention',
            NEW.id_orden,
            false
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error creando notificación de mención: %', SQLERRM;
        END;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- PASO 8: Crear triggers
-- ============================================

-- Trigger de cambio de estado
DROP TRIGGER IF EXISTS trigger_notify_estado_change ON public.ordenes_trabajo;
CREATE TRIGGER trigger_notify_estado_change
  AFTER UPDATE ON public.ordenes_trabajo
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION public.notify_estado_change();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger trigger_notify_estado_change creado';
END $$;

-- Trigger de asignación de operario
DROP TRIGGER IF EXISTS trigger_notify_operario_assignment ON public.ordenes_trabajo;
CREATE TRIGGER trigger_notify_operario_assignment
  AFTER UPDATE ON public.ordenes_trabajo
  FOR EACH ROW
  WHEN ((OLD.operario_asignado IS NULL OR OLD.operario_asignado != NEW.operario_asignado) 
        AND NEW.operario_asignado IS NOT NULL)
  EXECUTE FUNCTION public.notify_operario_assignment();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger trigger_notify_operario_assignment creado';
END $$;

-- Trigger de nueva orden
DROP TRIGGER IF EXISTS trigger_notify_new_orden ON public.ordenes_trabajo;
CREATE TRIGGER trigger_notify_new_orden
  AFTER INSERT ON public.ordenes_trabajo
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_orden();

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger trigger_notify_new_orden creado';
END $$;

-- Trigger de comentarios (solo si la tabla existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'comentarios_orden'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_new_comment ON public.comentarios_orden;
    CREATE TRIGGER trigger_notify_new_comment
      AFTER INSERT ON public.comentarios_orden
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_new_comment();
    
    RAISE NOTICE '✅ Trigger trigger_notify_new_comment creado';
  ELSE
    RAISE NOTICE 'ℹ️ Tabla comentarios_orden no existe, saltando trigger de comentarios';
  END IF;
END $$;

-- ============================================
-- PASO 9: Verificación final
-- ============================================
DO $$
DECLARE
  trigger_count integer;
  function_count integer;
  column_count integer;
BEGIN
  -- Contar triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
    AND trigger_name LIKE 'trigger_notify%';
  
  -- Contar funciones
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN ('get_user_id_from_nombre', 'notify_estado_change', 'notify_operario_assignment', 'notify_new_orden', 'notify_new_comment');
  
  -- Contar columnas de contacto
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'ordenes_trabajo'
    AND column_name IN ('telefono_cliente', 'email_cliente', 'direccion_cliente', 'whatsapp_link', 'ubicacion_link', 'drive_link');
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMEN FINAL:';
  RAISE NOTICE '   Triggers creados: %', trigger_count;
  RAISE NOTICE '   Funciones creadas: %', function_count;
  RAISE NOTICE '   Columnas de contacto: %', column_count;
  
  IF trigger_count >= 3 AND function_count >= 4 AND column_count = 6 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ¡TODO CONFIGURADO CORRECTAMENTE!';
    RAISE NOTICE '   Las notificaciones deberían funcionar ahora.';
  ELSE
    RAISE WARNING '⚠️ Algunos componentes pueden faltar. Revisa los mensajes anteriores.';
  END IF;
END $$;

COMMIT;

