-- Script para refrescar el schema cache de Supabase
-- El error "Could not find the 'X' column in the schema cache" indica que
-- Supabase necesita refrescar su cache interno del schema

BEGIN;

-- ============================================
-- PASO 1: Verificar que las columnas realmente existen
-- ============================================
DO $$
DECLARE
  col_count integer;
  missing_cols text[];
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'ordenes_trabajo'
    AND column_name IN ('telefono_cliente', 'email_cliente', 'direccion_cliente', 'whatsapp_link', 'ubicacion_link', 'drive_link');
  
  RAISE NOTICE '📋 Columnas de contacto en la base de datos: % de 6', col_count;
  
  IF col_count < 6 THEN
    -- Listar columnas faltantes
    SELECT ARRAY_AGG(expected_col)
    INTO missing_cols
    FROM (
      SELECT unnest(ARRAY['telefono_cliente', 'email_cliente', 'direccion_cliente', 'whatsapp_link', 'ubicacion_link', 'drive_link']) as expected_col
    ) expected
    WHERE NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ordenes_trabajo'
        AND column_name = expected.expected_col
    );
    
    RAISE WARNING '⚠️ Faltan columnas en la base de datos: %', array_to_string(missing_cols, ', ');
    RAISE NOTICE '   Ejecuta el script 2024-11-24_add_contact_fields_to_ordenes.sql para crearlas';
  ELSE
    RAISE NOTICE '✅ Todas las columnas existen en la base de datos';
  END IF;
END $$;

-- ============================================
-- PASO 2: Forzar actualización del schema cache
-- ============================================
-- Nota: Supabase actualiza su schema cache automáticamente, pero a veces
-- necesita un "trigger" para refrescarse. Hacer una operación DDL simple
-- puede ayudar a forzar la actualización.

DO $$
BEGIN
  -- Hacer una operación DDL simple que no cambie nada pero que fuerce
  -- a Supabase a refrescar el schema cache
  -- Usamos COMMENT ON COLUMN que es seguro y no modifica la estructura
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'telefono_cliente'
  ) THEN
    COMMENT ON COLUMN public.ordenes_trabajo.telefono_cliente IS 'Teléfono del cliente - actualizado para refrescar schema cache';
    RAISE NOTICE '✅ Schema cache refrescado para telefono_cliente';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'direccion_cliente'
  ) THEN
    COMMENT ON COLUMN public.ordenes_trabajo.direccion_cliente IS 'Dirección del cliente - actualizado para refrescar schema cache';
    RAISE NOTICE '✅ Schema cache refrescado para direccion_cliente';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'drive_link'
  ) THEN
    COMMENT ON COLUMN public.ordenes_trabajo.drive_link IS 'Link de Google Drive - actualizado para refrescar schema cache';
    RAISE NOTICE '✅ Schema cache refrescado para drive_link';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'ubicacion_link'
  ) THEN
    COMMENT ON COLUMN public.ordenes_trabajo.ubicacion_link IS 'Link de ubicación (Google Maps) - actualizado para refrescar schema cache';
    RAISE NOTICE '✅ Schema cache refrescado para ubicacion_link';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'email_cliente'
  ) THEN
    COMMENT ON COLUMN public.ordenes_trabajo.email_cliente IS 'Email del cliente - actualizado para refrescar schema cache';
    RAISE NOTICE '✅ Schema cache refrescado para email_cliente';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'whatsapp_link'
  ) THEN
    COMMENT ON COLUMN public.ordenes_trabajo.whatsapp_link IS 'Link de WhatsApp - actualizado para refrescar schema cache';
    RAISE NOTICE '✅ Schema cache refrescado para whatsapp_link';
  END IF;
END $$;

-- ============================================
-- PASO 3: Verificar que las columnas son accesibles
-- ============================================
-- Hacer un SELECT simple para forzar a Supabase a cargar el schema
SELECT 
  id,
  numero_op,
  cliente,
  telefono_cliente,
  email_cliente,
  direccion_cliente,
  whatsapp_link,
  ubicacion_link,
  drive_link
FROM public.ordenes_trabajo
LIMIT 0; -- Solo para cargar el schema, no devolver datos

RAISE NOTICE '✅ Schema verificado - las columnas deberían estar disponibles ahora';

COMMIT;

-- ============================================
-- INSTRUCCIONES ADICIONALES
-- ============================================
-- Si después de ejecutar este script sigues viendo el error:
-- 1. Espera 1-2 minutos para que Supabase actualice su cache
-- 2. Recarga la aplicación en el navegador (Ctrl+F5 para hard refresh)
-- 3. Si persiste, verifica en Supabase Dashboard → Table Editor que las columnas existen
-- 4. Si las columnas NO existen ahí, ejecuta: 2024-11-24_add_contact_fields_to_ordenes.sql

