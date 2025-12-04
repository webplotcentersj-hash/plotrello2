-- Script FORZADO para agregar campos de contacto
-- Usa ALTER TABLE directamente sin verificar si existen
-- Útil cuando el schema cache está desincronizado

BEGIN;

-- Agregar columnas directamente (si ya existen, dará error pero podemos ignorarlo)
-- Usamos IF NOT EXISTS a nivel de columna para evitar errores

DO $$
BEGIN
  -- Telefono cliente
  BEGIN
    ALTER TABLE public.ordenes_trabajo ADD COLUMN telefono_cliente text;
    RAISE NOTICE '✅ Columna telefono_cliente agregada';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'ℹ️ Columna telefono_cliente ya existe';
  END;

  -- Email cliente
  BEGIN
    ALTER TABLE public.ordenes_trabajo ADD COLUMN email_cliente text;
    RAISE NOTICE '✅ Columna email_cliente agregada';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'ℹ️ Columna email_cliente ya existe';
  END;

  -- Direccion cliente
  BEGIN
    ALTER TABLE public.ordenes_trabajo ADD COLUMN direccion_cliente text;
    RAISE NOTICE '✅ Columna direccion_cliente agregada';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'ℹ️ Columna direccion_cliente ya existe';
  END;

  -- WhatsApp link
  BEGIN
    ALTER TABLE public.ordenes_trabajo ADD COLUMN whatsapp_link text;
    RAISE NOTICE '✅ Columna whatsapp_link agregada';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'ℹ️ Columna whatsapp_link ya existe';
  END;

  -- Ubicacion link
  BEGIN
    ALTER TABLE public.ordenes_trabajo ADD COLUMN ubicacion_link text;
    RAISE NOTICE '✅ Columna ubicacion_link agregada';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'ℹ️ Columna ubicacion_link ya existe';
  END;

  -- Drive link
  BEGIN
    ALTER TABLE public.ordenes_trabajo ADD COLUMN drive_link text;
    RAISE NOTICE '✅ Columna drive_link agregada';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'ℹ️ Columna drive_link ya existe';
  END;
END $$;

COMMIT;

-- Verificar resultado
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ordenes_trabajo'
  AND column_name IN (
    'telefono_cliente',
    'email_cliente',
    'direccion_cliente',
    'whatsapp_link',
    'ubicacion_link',
    'drive_link'
  )
ORDER BY column_name;

