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
BEGIN
  SELECT id INTO user_id_result
  FROM public.usuarios
  WHERE nombre = nombre_usuario
  LIMIT 1;
  
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
    IF NEW.operario_asignado IS NOT NULL THEN
      user_id_destino := public.get_user_id_from_nombre(NEW.operario_asignado);
      
      IF user_id_destino IS NOT NULL THEN
        notification_title := 'Estado de orden actualizado';
        notification_desc := format('La orden #%s (%s) cambió de "%s" a "%s"', 
          NEW.numero_op, NEW.cliente, OLD.estado, NEW.estado);
        
        INSERT INTO public.user_notifications (
          user_id, title, description, type, orden_id, is_read
        ) VALUES (
          user_id_destino, notification_title, notification_desc, 'info', NEW.id, false
        );
      END IF;
    END IF;
    
    -- Notificar al creador si es diferente del operario
    IF NEW.nombre_creador IS NOT NULL AND NEW.nombre_creador != NEW.operario_asignado THEN
      user_id_destino := public.get_user_id_from_nombre(NEW.nombre_creador);
      
      IF user_id_destino IS NOT NULL THEN
        notification_title := 'Tu orden cambió de estado';
        notification_desc := format('La orden #%s (%s) cambió de "%s" a "%s"', 
          NEW.numero_op, NEW.cliente, OLD.estado, NEW.estado);
        
        INSERT INTO public.user_notifications (
          user_id, title, description, type, orden_id, is_read
        ) VALUES (
          user_id_destino, notification_title, notification_desc, 'info', NEW.id, false
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_estado_change ON public.ordenes_trabajo;
CREATE TRIGGER trigger_notify_estado_change
  AFTER UPDATE ON public.ordenes_trabajo
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION public.notify_estado_change();

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
     AND (OLD.operario_asignado IS NULL OR OLD.operario_asignado != NEW.operario_asignado) THEN
    user_id_destino := public.get_user_id_from_nombre(NEW.operario_asignado);
    
    IF user_id_destino IS NOT NULL THEN
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
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_operario_assignment ON public.ordenes_trabajo;
CREATE TRIGGER trigger_notify_operario_assignment
  AFTER UPDATE ON public.ordenes_trabajo
  FOR EACH ROW
  WHEN ((OLD.operario_asignado IS NULL OR OLD.operario_asignado != NEW.operario_asignado) 
        AND NEW.operario_asignado IS NOT NULL)
  EXECUTE FUNCTION public.notify_operario_assignment();

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
  IF NEW.operario_asignado IS NOT NULL THEN
    user_id_destino := public.get_user_id_from_nombre(NEW.operario_asignado);
    
    IF user_id_destino IS NOT NULL THEN
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
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_new_orden ON public.ordenes_trabajo;
CREATE TRIGGER trigger_notify_new_orden
  AFTER INSERT ON public.ordenes_trabajo
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_orden();

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

DROP TRIGGER IF EXISTS trigger_notify_new_comment ON public.comentarios_orden;
CREATE TRIGGER trigger_notify_new_comment
  AFTER INSERT ON public.comentarios_orden
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_comment();

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

