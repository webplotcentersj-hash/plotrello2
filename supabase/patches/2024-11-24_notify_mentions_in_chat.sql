-- Trigger para detectar menciones @usuario en mensajes de chat y crear notificaciones

BEGIN;

-- ============================================
-- FUNCIÓN: Extraer menciones de un texto
-- ============================================
CREATE OR REPLACE FUNCTION public.extract_mentions(texto text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  mentions text[];
  match text;
BEGIN
  mentions := ARRAY[]::text[];
  
  -- Buscar patrones @usuario o @nombre_usuario
  FOR match IN
    SELECT regexp_split_to_table(texto, '@')
    WHERE regexp_split_to_table ~* '^[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\s]+'
  LOOP
    -- Extraer el nombre (hasta encontrar espacio, puntuación o fin de línea)
    match := regexp_replace(match, '[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\s].*', '');
    match := trim(match);
    
    IF match != '' AND NOT (match = ANY(mentions)) THEN
      mentions := array_append(mentions, match);
    END IF;
  END LOOP;
  
  RETURN mentions;
END;
$$;

-- ============================================
-- TRIGGER: Notificar menciones en chat
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_chat_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  mentioned_names text[];
  mentioned_name text;
  mentioned_user_id integer;
  mentioned_user_record record;
  room_name text;
BEGIN
  -- Obtener nombre del room
  SELECT nombre INTO room_name
  FROM public.chat_rooms
  WHERE id = NEW.room_id;
  
  IF room_name IS NULL THEN
    room_name := 'Canal desconocido';
  END IF;
  
  -- Extraer menciones del mensaje
  mentioned_names := public.extract_mentions(NEW.mensaje);
  
  -- Procesar cada mención
  FOREACH mentioned_name IN ARRAY mentioned_names
  LOOP
    -- Buscar usuario por nombre (coincidencia flexible)
    FOR mentioned_user_record IN
      SELECT id, nombre
      FROM public.usuarios
      WHERE 
        -- Coincidencia exacta (case-insensitive)
        lower(trim(nombre)) = lower(trim(mentioned_name))
        OR
        -- Coincidencia parcial (sin dominio de email)
        (mentioned_name LIKE '%@%' AND lower(trim(nombre)) LIKE '%' || lower(split_part(mentioned_name, '@', 1)) || '%')
        OR
        -- Coincidencia por inicio del nombre
        lower(trim(nombre)) LIKE lower(trim(mentioned_name)) || '%'
      LIMIT 1
    LOOP
      mentioned_user_id := mentioned_user_record.id;
      
      -- No notificar al mismo usuario que envió el mensaje
      IF mentioned_user_id != NEW.id_usuario THEN
        BEGIN
          INSERT INTO public.user_notifications (
            user_id, 
            title, 
            description, 
            type, 
            orden_id,
            is_read
          ) VALUES (
            mentioned_user_id,
            '💬 Te mencionaron en el chat',
            format('%s te mencionó en %s: "%s"', 
              NEW.nombre_usuario, 
              room_name,
              substring(NEW.mensaje, 1, 100)),
            'mention',
            NULL,
            false
          );
          
          RAISE NOTICE '✅ Notificación creada para usuario % (mencionado: %)', 
            mentioned_user_record.nombre, mentioned_name;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error creando notificación de mención para %: %', 
            mentioned_name, SQLERRM;
        END;
      END IF;
      
      -- Salir del loop una vez encontrado
      EXIT;
    END LOOP;
  END FOREACH;
  
  RETURN NEW;
END;
$$;

-- Crear trigger solo si la tabla chat_messages existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'chat_messages'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_notify_chat_mentions ON public.chat_messages;
    CREATE TRIGGER trigger_notify_chat_mentions
      AFTER INSERT ON public.chat_messages
      FOR EACH ROW
      EXECUTE FUNCTION public.notify_chat_mentions();
    
    RAISE NOTICE '✅ Trigger de menciones en chat creado';
  ELSE
    RAISE NOTICE 'ℹ️ Tabla chat_messages no existe, saltando trigger de menciones';
  END IF;
END $$;

COMMIT;

