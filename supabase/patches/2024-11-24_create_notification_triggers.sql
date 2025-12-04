-- Triggers para generar notificaciones automáticamente en eventos importantes

BEGIN;

-- ============================================
-- FUNCIÓN: Obtener user_id desde nombre de usuario
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_id_from_nombre(nombre_usuario text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_result integer;
  nombre_limpio text;
  usuarios_exists boolean;
BEGIN
  -- Verificar si la tabla usuarios existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'usuarios'
  ) INTO usuarios_exists;
  
  IF NOT usuarios_exists THEN
    RETURN NULL;
  END IF;
  
  -- Limpiar el nombre (quitar espacios, convertir a minúsculas para comparación)
  nombre_limpio := trim(lower(nombre_usuario));
  
  IF nombre_limpio IS NULL OR nombre_limpio = '' THEN
    RETURN NULL;
  END IF;
  
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

-- ============================================
-- TRIGGER 1: Notificación cuando cambia el estado de una orden
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
          -- Log error pero no fallar el trigger
          RAISE WARNING 'Error creando notificación para usuario %: %', user_id_destino, SQLERRM;
        END;
      ELSE
        RAISE NOTICE '⚠️ No se encontró user_id para operario: %', NEW.operario_asignado;
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
      ELSE
        RAISE NOTICE '⚠️ No se encontró user_id para creador: %', NEW.nombre_creador;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear triggers solo si la tabla ordenes_trabajo existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_estado_change ON public.ordenes_trabajo;
    CREATE TRIGGER trigger_notify_estado_change
      AFTER UPDATE ON public.ordenes_trabajo
      FOR EACH ROW
      WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
      EXECUTE FUNCTION public.notify_estado_change();
    
    RAISE NOTICE '✅ Trigger de cambio de estado creado';
  ELSE
    RAISE NOTICE 'ℹ️ Tabla ordenes_trabajo no existe, saltando triggers';
  END IF;
END $$;

-- ============================================
-- TRIGGER 2: Notificación cuando se asigna un operario
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
    ELSE
      RAISE NOTICE '⚠️ No se encontró user_id para operario asignado: %', NEW.operario_asignado;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_operario_assignment ON public.ordenes_trabajo;
    CREATE TRIGGER trigger_notify_operario_assignment
      AFTER UPDATE ON public.ordenes_trabajo
      FOR EACH ROW
      WHEN ((OLD.operario_asignado IS NULL OR OLD.operario_asignado != NEW.operario_asignado) 
            AND NEW.operario_asignado IS NOT NULL)
      EXECUTE FUNCTION public.notify_operario_assignment();
    
    RAISE NOTICE '✅ Trigger de asignación de operario creado';
  END IF;
END $$;

-- ============================================
-- TRIGGER 3: Notificación cuando se crea una nueva orden
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
    ELSE
      RAISE NOTICE '⚠️ No se encontró user_id para operario en nueva orden: %', NEW.operario_asignado;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_new_orden ON public.ordenes_trabajo;
    CREATE TRIGGER trigger_notify_new_orden
      AFTER INSERT ON public.ordenes_trabajo
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_new_orden();
    
    RAISE NOTICE '✅ Trigger de nueva orden creado';
  END IF;
END $$;

-- ============================================
-- TRIGGER 4: Notificación cuando se agrega un comentario
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_destino integer;
  orden_data record;
  mentioned_users text[];
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
    END IF;
  END IF;
  
  -- Notificar al creador (si no es quien comentó y es diferente del operario)
  IF orden_data.nombre_creador IS NOT NULL 
     AND orden_data.nombre_creador != NEW.usuario_nombre
     AND orden_data.nombre_creador != orden_data.operario_asignado THEN
    user_id_destino := public.get_user_id_from_nombre(orden_data.nombre_creador);
    
    IF user_id_destino IS NOT NULL THEN
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
    END IF;
  END IF;
  
  -- Detectar menciones (@usuario) en el comentario
  IF NEW.comentario ~* '@[a-zA-Z0-9_]+' THEN
    -- Extraer nombres mencionados (simplificado)
    FOR user_name IN 
      SELECT regexp_split_to_table(NEW.comentario, '@') 
      WHERE regexp_split_to_table ~* '^[a-zA-Z0-9_]+'
    LOOP
      user_name := regexp_replace(user_name, '[^a-zA-Z0-9_].*', '');
      mentioned_user_id := public.get_user_id_from_nombre(user_name);
      
      IF mentioned_user_id IS NOT NULL THEN
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
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger de comentarios solo si la tabla existe
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
    
    RAISE NOTICE '✅ Trigger de comentarios creado';
  ELSE
    RAISE NOTICE 'ℹ️ Tabla comentarios_orden no existe, saltando trigger de comentarios';
  END IF;
END $$;

-- ============================================
-- TRIGGER 5: Notificación cuando una orden está cerca del plazo
-- ============================================
-- Este trigger se ejecutará mediante una función programada o al actualizar
CREATE OR REPLACE FUNCTION public.check_orden_deadlines()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  orden_record record;
  user_id_destino integer;
  days_until_deadline integer;
BEGIN
  -- Buscar órdenes con plazo en los próximos 3 días
  FOR orden_record IN
    SELECT id, numero_op, cliente, fecha_entrega, operario_asignado, nombre_creador
    FROM public.ordenes_trabajo
    WHERE estado NOT IN ('Entregado o Instalado', 'Finalizado en Taller', 'Almacén de Entrega')
      AND fecha_entrega IS NOT NULL
      AND fecha_entrega >= CURRENT_DATE
      AND fecha_entrega <= CURRENT_DATE + INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.user_notifications
        WHERE orden_id = ordenes_trabajo.id
          AND title LIKE '%plazo%'
          AND timestamp > CURRENT_DATE - INTERVAL '1 day'
      )
  LOOP
    days_until_deadline := orden_record.fecha_entrega::date - CURRENT_DATE;
    
    -- Notificar al operario asignado
    IF orden_record.operario_asignado IS NOT NULL THEN
      user_id_destino := public.get_user_id_from_nombre(orden_record.operario_asignado);
      
      IF user_id_destino IS NOT NULL THEN
        INSERT INTO public.user_notifications (
          user_id, title, description, type, orden_id, is_read
        ) VALUES (
          user_id_destino,
          CASE 
            WHEN days_until_deadline = 0 THEN '⚠️ Plazo vence HOY'
            WHEN days_until_deadline = 1 THEN '⚠️ Plazo vence mañana'
            ELSE format('⚠️ Plazo en %d días', days_until_deadline)
          END,
          format('La orden #%s (%s) tiene plazo el %s', 
            orden_record.numero_op, 
            orden_record.cliente,
            to_char(orden_record.fecha_entrega, 'DD/MM/YYYY')),
          CASE 
            WHEN days_until_deadline = 0 THEN 'error'
            WHEN days_until_deadline <= 1 THEN 'warning'
            ELSE 'warning'
          END,
          orden_record.id,
          false
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

COMMIT;

-- Nota: Para ejecutar check_orden_deadlines automáticamente, puedes:
-- 1. Usar pg_cron (extensión de PostgreSQL)
-- 2. Ejecutarlo manualmente periódicamente
-- 3. Llamarlo desde el frontend en un intervalo

