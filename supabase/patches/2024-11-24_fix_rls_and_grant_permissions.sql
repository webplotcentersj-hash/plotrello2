-- Script para crear políticas RLS y otorgar permisos
-- Ejecutar si RLS está bloqueando las operaciones

BEGIN;

-- ============================================
-- PASO 1: Verificar estado actual
-- ============================================
DO $$
DECLARE
  rls_enabled boolean;
  policy_count integer;
BEGIN
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = 'ordenes_trabajo';
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'ordenes_trabajo';
  
  RAISE NOTICE 'Estado actual:';
  RAISE NOTICE '  - RLS habilitado: %', CASE WHEN rls_enabled THEN 'SÍ' ELSE 'NO' END;
  RAISE NOTICE '  - Políticas existentes: %', policy_count;
END $$;

-- ============================================
-- PASO 2: Otorgar permisos GRANT explícitos
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordenes_trabajo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordenes_trabajo TO authenticated;

RAISE NOTICE '✅ Permisos GRANT otorgados a anon y authenticated';

-- ============================================
-- PASO 3: Crear políticas RLS si RLS está habilitado
-- ============================================
DO $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename = 'ordenes_trabajo';
  
  IF rls_enabled THEN
    -- Eliminar políticas existentes si las hay (opcional, comentado por seguridad)
    -- DROP POLICY IF EXISTS "Allow anon all" ON public.ordenes_trabajo;
    -- DROP POLICY IF EXISTS "Allow authenticated all" ON public.ordenes_trabajo;
    
    -- Crear políticas permisivas para anon
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'ordenes_trabajo'
        AND policyname = 'Allow anon select'
    ) THEN
      CREATE POLICY "Allow anon select" ON public.ordenes_trabajo
        FOR SELECT TO anon USING (true);
      RAISE NOTICE '✅ Política "Allow anon select" creada';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'ordenes_trabajo'
        AND policyname = 'Allow anon insert'
    ) THEN
      CREATE POLICY "Allow anon insert" ON public.ordenes_trabajo
        FOR INSERT TO anon WITH CHECK (true);
      RAISE NOTICE '✅ Política "Allow anon insert" creada';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'ordenes_trabajo'
        AND policyname = 'Allow anon update'
    ) THEN
      CREATE POLICY "Allow anon update" ON public.ordenes_trabajo
        FOR UPDATE TO anon USING (true) WITH CHECK (true);
      RAISE NOTICE '✅ Política "Allow anon update" creada';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'ordenes_trabajo'
        AND policyname = 'Allow anon delete'
    ) THEN
      CREATE POLICY "Allow anon delete" ON public.ordenes_trabajo
        FOR DELETE TO anon USING (true);
      RAISE NOTICE '✅ Política "Allow anon delete" creada';
    END IF;
    
    -- Crear políticas permisivas para authenticated
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'ordenes_trabajo'
        AND policyname = 'Allow authenticated select'
    ) THEN
      CREATE POLICY "Allow authenticated select" ON public.ordenes_trabajo
        FOR SELECT TO authenticated USING (true);
      RAISE NOTICE '✅ Política "Allow authenticated select" creada';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'ordenes_trabajo'
        AND policyname = 'Allow authenticated insert'
    ) THEN
      CREATE POLICY "Allow authenticated insert" ON public.ordenes_trabajo
        FOR INSERT TO authenticated WITH CHECK (true);
      RAISE NOTICE '✅ Política "Allow authenticated insert" creada';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'ordenes_trabajo'
        AND policyname = 'Allow authenticated update'
    ) THEN
      CREATE POLICY "Allow authenticated update" ON public.ordenes_trabajo
        FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
      RAISE NOTICE '✅ Política "Allow authenticated update" creada';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'ordenes_trabajo'
        AND policyname = 'Allow authenticated delete'
    ) THEN
      CREATE POLICY "Allow authenticated delete" ON public.ordenes_trabajo
        FOR DELETE TO authenticated USING (true);
      RAISE NOTICE '✅ Política "Allow authenticated delete" creada';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ RLS no está habilitado, no se necesitan políticas';
  END IF;
END $$;

-- ============================================
-- PASO 4: Deshabilitar RLS temporalmente (SOLO si es necesario)
-- ============================================
-- Descomenta la siguiente línea SOLO si las políticas no funcionan:
-- ALTER TABLE public.ordenes_trabajo DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- PASO 5: Verificar resultado
-- ============================================
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'ordenes_trabajo'
ORDER BY policyname;

