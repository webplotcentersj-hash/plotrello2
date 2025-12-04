-- Script completo para agregar y verificar campos de contacto en ordenes_trabajo
-- Ejecutar este script en Supabase SQL Editor

BEGIN;

-- ============================================
-- PASO 1: Verificar que la tabla existe
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
  ) THEN
    RAISE EXCEPTION 'La tabla ordenes_trabajo no existe. Ejecuta primero el schema.sql';
  END IF;
END $$;

-- ============================================
-- PASO 2: Agregar columnas de contacto si no existen
-- ============================================

-- Telefono cliente
DO $$
BEGIN
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
END $$;

-- Email cliente
DO $$
BEGIN
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
END $$;

-- Direccion cliente
DO $$
BEGIN
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
END $$;

-- WhatsApp link
DO $$
BEGIN
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
END $$;

-- Ubicacion link
DO $$
BEGIN
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
END $$;

-- Drive link
DO $$
BEGIN
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
-- PASO 3: Verificar estado de RLS
-- ============================================
DO $$
DECLARE
  rls_enabled boolean;
  policy_count integer;
BEGIN
  -- Verificar si RLS está habilitado
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = 'ordenes_trabajo';
  
  IF rls_enabled THEN
    RAISE NOTICE '⚠️ RLS está habilitado en ordenes_trabajo';
    
    -- Contar políticas existentes
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ordenes_trabajo';
    
    RAISE NOTICE '📊 Políticas RLS encontradas: %', policy_count;
    
    -- Listar políticas
    FOR policy_count IN
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'ordenes_trabajo'
    LOOP
      RAISE NOTICE '  - Política: % (comando: %)', policy_count;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ RLS NO está habilitado - no hay restricciones de políticas';
  END IF;
END $$;

-- ============================================
-- PASO 4: Verificar permisos de la tabla
-- ============================================
DO $$
DECLARE
  has_insert boolean;
  has_update boolean;
  has_select boolean;
BEGIN
  -- Verificar permisos para rol anon
  SELECT 
    has_table_privilege('anon', 'ordenes_trabajo', 'INSERT'),
    has_table_privilege('anon', 'ordenes_trabajo', 'UPDATE'),
    has_table_privilege('anon', 'ordenes_trabajo', 'SELECT')
  INTO has_insert, has_update, has_select;
  
  RAISE NOTICE '🔐 Permisos para rol "anon":';
  RAISE NOTICE '  - INSERT: %', CASE WHEN has_insert THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  - UPDATE: %', CASE WHEN has_update THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  - SELECT: %', CASE WHEN has_select THEN '✅' ELSE '❌' END;
  
  -- Verificar permisos para rol authenticated
  SELECT 
    has_table_privilege('authenticated', 'ordenes_trabajo', 'INSERT'),
    has_table_privilege('authenticated', 'ordenes_trabajo', 'UPDATE'),
    has_table_privilege('authenticated', 'ordenes_trabajo', 'SELECT')
  INTO has_insert, has_update, has_select;
  
  RAISE NOTICE '🔐 Permisos para rol "authenticated":';
  RAISE NOTICE '  - INSERT: %', CASE WHEN has_insert THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  - UPDATE: %', CASE WHEN has_update THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  - SELECT: %', CASE WHEN has_select THEN '✅' ELSE '❌' END;
END $$;

-- ============================================
-- PASO 5: Verificar que las columnas fueron creadas
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
  
  RAISE NOTICE '📋 Verificación final:';
  RAISE NOTICE '  - Columnas de contacto encontradas: % de 6', col_count;
  
  IF col_count = 6 THEN
    RAISE NOTICE '✅ Todas las columnas de contacto están presentes';
  ELSE
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
    
    RAISE WARNING '⚠️ Faltan columnas: %', array_to_string(missing_cols, ', ');
  END IF;
END $$;

COMMIT;

-- ============================================
-- RESUMEN: Mostrar todas las columnas de ordenes_trabajo
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'ordenes_trabajo'
  AND column_name IN (
    'telefono_cliente',
    'email_cliente',
    'direccion_cliente',
    'whatsapp_link',
    'ubicacion_link',
    'drive_link',
    'foto_url',
    'dni_cuit'
  )
ORDER BY column_name;

