-- Trigger para detectar menciones @usuario en mensajes de chat y crear notificaciones

BEGIN;

-- ============================================
-- FUNCIÓN: Extraer menciones de un texto
-- Mejorada para detectar mejor los nombres
-- ============================================
CREATE OR REPLACE FUNCTION public.extract_mentions(texto text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  mentions text[];
  match text;
  parts text[];
BEGIN
  mentions := ARRAY[]::text[];
  
  IF texto IS NULL OR trim(texto) = '' THEN
    RETURN mentions;
  END IF;
  
  -- Buscar todos los patrones @nombre en el texto
  -- Usar regex para encontrar @ seguido de caracteres alfanuméricos y espacios
  FOR match IN
    SELECT regexp_split_to_table(texto, E'@')
    WHERE regexp_split_to_table ~* '^[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\s]+'
  LOOP
    -- Extraer el nombre (hasta encontrar espacio, puntuación o fin de línea)
    match := regexp_replace(match, '[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\s].*', '');
    match := trim(match);
    
    -- Si el match tiene espacios, tomar solo la primera palabra
    IF position(' ' in match) > 0 THEN
      match := split_part(match, ' ', 1);
    END IF;
    
    IF match != '' AND length(match) > 0 AND NOT (match = ANY(mentions)) THEN
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
  
  -- Log para debugging
  IF array_length(mentioned_names, 1) > 0 THEN
    RAISE NOTICE '🔍 Menciones detectadas en mensaje: %', array_to_string(mentioned_names, ', ');
  END IF;
  
  -- Procesar cada mención
  FOREACH mentioned_name IN ARRAY mentioned_names
  LOOP
    -- Buscar usuario por nombre (coincidencia flexible)
    FOR mentioned_user_record IN
      SELECT id, nombre
      FROM public.usuarios
      WHERE 
        -- Coincidencia exacta (case-insensitive, sin espacios extra)
        lower(trim(nombre)) = lower(trim(mentioned_name))
        OR
        -- Coincidencia por inicio del nombre (al menos 3 caracteres)
        (length(trim(mentioned_name)) >= 3 AND lower(trim(nombre)) LIKE lower(trim(mentioned_name)) || '%')
        OR
        -- Coincidencia parcial en el nombre (para nombres compuestos)
        (length(trim(mentioned_name)) >= 3 AND lower(trim(nombre)) LIKE '%' || lower(trim(mentioned_name)) || '%')
      ORDER BY 
        CASE 
          WHEN lower(trim(nombre)) = lower(trim(mentioned_name)) THEN 1
          WHEN lower(trim(nombre)) LIKE lower(trim(mentioned_name)) || '%' THEN 2
          ELSE 3
        END
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
          
          RAISE NOTICE '✅ Notificación creada para usuario % (ID: %) - mencionado como: "%"', 
            mentioned_user_record.nombre, mentioned_user_id, mentioned_name;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING '❌ Error creando notificación de mención para "%" (usuario: %): %', 
            mentioned_name, mentioned_user_record.nombre, SQLERRM;
        END;
      ELSE
        RAISE NOTICE 'ℹ️ Usuario % se mencionó a sí mismo, no se crea notificación', mentioned_user_record.nombre;
      END IF;
      
      -- Salir del loop una vez encontrado
      EXIT;
    END LOOP;
    
    -- Si no se encontró el usuario
    IF mentioned_user_id IS NULL THEN
      RAISE NOTICE '⚠️ No se encontró usuario para mención: "%"', mentioned_name;
    END IF;
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

