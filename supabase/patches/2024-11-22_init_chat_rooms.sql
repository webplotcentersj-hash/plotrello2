-- Inicializar chat_rooms si no existen
-- Este script crea los rooms básicos necesarios para el chat

INSERT INTO public.chat_rooms (id, nombre, tipo, created_at)
VALUES 
  (1, 'General', 'publico', now()),
  (2, 'Taller Gráfico', 'publico', now()),
  (3, 'Mostrador', 'publico', now())
ON CONFLICT (id) DO NOTHING;

-- Si los IDs no están siendo usados como IDENTITY, podemos usar este enfoque alternativo:
-- Primero verificar si existen, y si no, crearlos

DO $$
BEGIN
  -- Crear room 1 (General) si no existe
  IF NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE id = 1) THEN
    INSERT INTO public.chat_rooms (id, nombre, tipo, created_at)
    VALUES (1, 'General', 'publico', now());
  END IF;

  -- Crear room 2 (Taller Gráfico) si no existe
  IF NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE id = 2) THEN
    INSERT INTO public.chat_rooms (id, nombre, tipo, created_at)
    VALUES (2, 'Taller Gráfico', 'publico', now());
  END IF;

  -- Crear room 3 (Mostrador) si no existe
  IF NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE id = 3) THEN
    INSERT INTO public.chat_rooms (id, nombre, tipo, created_at)
    VALUES (3, 'Mostrador', 'publico', now());
  END IF;
END $$;

