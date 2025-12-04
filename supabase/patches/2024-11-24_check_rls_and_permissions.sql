-- Script para verificar y corregir permisos y políticas RLS para ordenes_trabajo
-- Ejecutar después de confirmar que las columnas existen

BEGIN;

-- ============================================
-- PASO 1: Verificar estado de RLS
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
  
  IF rls_enabled THEN
    RAISE NOTICE '⚠️ RLS está habilitado en ordenes_trabajo';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ordenes_trabajo';
    
    RAISE NOTICE '📊 Políticas RLS encontradas: %', policy_count;
    
    IF policy_count = 0 THEN
      RAISE WARNING '⚠️ RLS está habilitado pero NO hay políticas. Esto bloquea TODAS las operaciones!';
      RAISE NOTICE '   Solución: Deshabilitar RLS o crear políticas que permitan INSERT/UPDATE';
    END IF;
  ELSE
    RAISE NOTICE '✅ RLS NO está habilitado - no hay restricciones de políticas';
  END IF;
END $$;

-- ============================================
-- PASO 2: Verificar permisos GRANT
-- ============================================
DO $$
DECLARE
  has_insert_anon boolean;
  has_update_anon boolean;
  has_select_anon boolean;
  has_insert_auth boolean;
  has_update_auth boolean;
  has_select_auth boolean;
BEGIN
  -- Verificar permisos para rol anon
  SELECT 
    has_table_privilege('anon', 'ordenes_trabajo', 'INSERT'),
    has_table_privilege('anon', 'ordenes_trabajo', 'UPDATE'),
    has_table_privilege('anon', 'ordenes_trabajo', 'SELECT')
  INTO has_insert_anon, has_update_anon, has_select_anon;
  
  RAISE NOTICE '🔐 Permisos para rol "anon":';
  RAISE NOTICE '  - INSERT: %', CASE WHEN has_insert_anon THEN '✅' ELSE '❌ FALTA' END;
  RAISE NOTICE '  - UPDATE: %', CASE WHEN has_update_anon THEN '✅' ELSE '❌ FALTA' END;
  RAISE NOTICE '  - SELECT: %', CASE WHEN has_select_anon THEN '✅' ELSE '❌ FALTA' END;
  
  -- Verificar permisos para rol authenticated
  SELECT 
    has_table_privilege('authenticated', 'ordenes_trabajo', 'INSERT'),
    has_table_privilege('authenticated', 'ordenes_trabajo', 'UPDATE'),
    has_table_privilege('authenticated', 'ordenes_trabajo', 'SELECT')
  INTO has_insert_auth, has_update_auth, has_select_auth;
  
  RAISE NOTICE '🔐 Permisos para rol "authenticated":';
  RAISE NOTICE '  - INSERT: %', CASE WHEN has_insert_auth THEN '✅' ELSE '❌ FALTA' END;
  RAISE NOTICE '  - UPDATE: %', CASE WHEN has_update_auth THEN '✅' ELSE '❌ FALTA' END;
  RAISE NOTICE '  - SELECT: %', CASE WHEN has_select_auth THEN '✅' ELSE '❌ FALTA' END;
  
  -- Si faltan permisos, ofrecer solución
  IF NOT has_insert_anon OR NOT has_update_anon OR NOT has_select_anon THEN
    RAISE WARNING '⚠️ Faltan permisos para rol "anon". Ejecuta:';
    IF NOT has_insert_anon THEN
      RAISE NOTICE '   GRANT INSERT ON public.ordenes_trabajo TO anon;';
    END IF;
    IF NOT has_update_anon THEN
      RAISE NOTICE '   GRANT UPDATE ON public.ordenes_trabajo TO anon;';
    END IF;
    IF NOT has_select_anon THEN
      RAISE NOTICE '   GRANT SELECT ON public.ordenes_trabajo TO anon;';
    END IF;
  END IF;
  
  IF NOT has_insert_auth OR NOT has_update_auth OR NOT has_select_auth THEN
    RAISE WARNING '⚠️ Faltan permisos para rol "authenticated". Ejecuta:';
    IF NOT has_insert_auth THEN
      RAISE NOTICE '   GRANT INSERT ON public.ordenes_trabajo TO authenticated;';
    END IF;
    IF NOT has_update_auth THEN
      RAISE NOTICE '   GRANT UPDATE ON public.ordenes_trabajo TO authenticated;';
    END IF;
    IF NOT has_select_auth THEN
      RAISE NOTICE '   GRANT SELECT ON public.ordenes_trabajo TO authenticated;';
    END IF;
  END IF;
END $$;

-- ============================================
-- PASO 3: Listar todas las políticas RLS existentes
-- ============================================
SELECT 
  policyname as "Nombre de Política",
  cmd as "Comando",
  roles as "Roles",
  qual as "Condición (USING)",
  with_check as "Condición (WITH CHECK)"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'ordenes_trabajo'
ORDER BY policyname;

-- ============================================
-- PASO 4: Verificar si RLS está bloqueando
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
  
  IF rls_enabled AND policy_count = 0 THEN
    RAISE WARNING '🚨 PROBLEMA DETECTADO: RLS está habilitado pero NO hay políticas.';
    RAISE WARNING '   Esto significa que TODAS las operaciones están bloqueadas.';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUCIÓN 1 (Recomendada): Crear políticas que permitan INSERT/UPDATE';
    RAISE NOTICE '   Ejecuta el siguiente bloque para crear políticas básicas:';
    RAISE NOTICE '';
    RAISE NOTICE '   CREATE POLICY "Allow anon insert" ON public.ordenes_trabajo';
    RAISE NOTICE '     FOR INSERT TO anon WITH CHECK (true);';
    RAISE NOTICE '';
    RAISE NOTICE '   CREATE POLICY "Allow anon update" ON public.ordenes_trabajo';
    RAISE NOTICE '     FOR UPDATE TO anon USING (true) WITH CHECK (true);';
    RAISE NOTICE '';
    RAISE NOTICE '   CREATE POLICY "Allow anon select" ON public.ordenes_trabajo';
    RAISE NOTICE '     FOR SELECT TO anon USING (true);';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUCIÓN 2: Deshabilitar RLS (menos seguro)';
    RAISE NOTICE '   ALTER TABLE public.ordenes_trabajo DISABLE ROW LEVEL SECURITY;';
  END IF;
END $$;

COMMIT;

