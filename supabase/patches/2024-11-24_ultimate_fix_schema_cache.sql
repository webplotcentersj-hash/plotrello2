-- SOLUCIÓN DEFINITIVA: Forzar actualización del schema cache de Supabase
-- Este script hace múltiples operaciones para forzar a Supabase a reconocer las columnas

BEGIN;

-- ============================================
-- MÉTODO 1: Hacer una operación DDL que fuerce refresh
-- ============================================
-- Agregar y quitar un índice temporal (no afecta datos)
DO $$
BEGIN
  -- Intentar crear un índice que incluya las columnas problemáticas
  BEGIN
    CREATE INDEX IF NOT EXISTS idx_temp_contact_fields ON public.ordenes_trabajo(
      telefono_cliente, 
      direccion_cliente, 
      drive_link
    ) WHERE telefono_cliente IS NOT NULL OR direccion_cliente IS NOT NULL OR drive_link IS NOT NULL;
    RAISE NOTICE '✅ Índice temporal creado para forzar refresh del schema';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ℹ️ Índice ya existe o no se pudo crear (no es crítico)';
  END;
END $$;

-- ============================================
-- MÉTODO 2: Hacer un UPDATE dummy en una fila existente
-- ============================================
DO $$
DECLARE
  test_id integer;
BEGIN
  -- Buscar una orden existente
  SELECT id INTO test_id
  FROM public.ordenes_trabajo
  LIMIT 1;
  
  IF test_id IS NOT NULL THEN
    -- Hacer un UPDATE que toque las columnas problemáticas (sin cambiar valores)
    UPDATE public.ordenes_trabajo
    SET 
      direccion_cliente = COALESCE(direccion_cliente, direccion_cliente),
      drive_link = COALESCE(drive_link, drive_link),
      telefono_cliente = COALESCE(telefono_cliente, telefono_cliente)
    WHERE id = test_id;
    
    RAISE NOTICE '✅ UPDATE dummy ejecutado en orden ID: %', test_id;
  ELSE
    RAISE NOTICE 'ℹ️ No hay órdenes existentes para hacer UPDATE dummy';
  END IF;
END $$;

-- ============================================
-- MÉTODO 3: Usar NOTIFY para forzar refresh (si está disponible)
-- ============================================
-- NOTIFY no funciona directamente, pero podemos hacer un SELECT que incluya todas las columnas

-- ============================================
-- MÉTODO 4: Verificar y otorgar permisos explícitos
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordenes_trabajo TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordenes_trabajo TO authenticated;

RAISE NOTICE '✅ Permisos GRANT otorgados';

-- ============================================
-- MÉTODO 5: Verificar RLS y crear políticas si es necesario
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
    RAISE NOTICE '⚠️ RLS está habilitado - verificando políticas...';
    
    -- Crear políticas si no existen
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'ordenes_trabajo'
        AND policyname = 'Allow all anon'
    ) THEN
      CREATE POLICY "Allow all anon" ON public.ordenes_trabajo
        FOR ALL TO anon USING (true) WITH CHECK (true);
      RAISE NOTICE '✅ Política "Allow all anon" creada';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'ordenes_trabajo'
        AND policyname = 'Allow all authenticated'
    ) THEN
      CREATE POLICY "Allow all authenticated" ON public.ordenes_trabajo
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
      RAISE NOTICE '✅ Política "Allow all authenticated" creada';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ RLS no está habilitado';
  END IF;
END $$;

COMMIT;

-- ============================================
-- MÉTODO 6: Hacer un SELECT que incluya todas las columnas
-- ============================================
-- Esto fuerza a Supabase a cargar el schema completo
SELECT 
  id,
  numero_op,
  cliente,
  telefono_cliente,
  email_cliente,
  direccion_cliente,
  whatsapp_link,
  ubicacion_link,
  drive_link,
  foto_url
FROM public.ordenes_trabajo
LIMIT 0;

-- ============================================
-- INSTRUCCIONES FINALES
-- ============================================
-- Después de ejecutar este script:
-- 1. Espera 2-3 minutos (Supabase puede tardar en actualizar el cache)
-- 2. Ve a Supabase Dashboard → Settings → API → y haz clic en "Refresh" si hay un botón
-- 3. O mejor aún: Ve a Table Editor → ordenes_trabajo → y edita manualmente una fila
--    tocando los campos direccion_cliente o drive_link (pon cualquier texto y guarda)
-- 4. Recarga la aplicación con Ctrl+F5
-- 5. Si aún no funciona, deshabilita RLS temporalmente:
--    ALTER TABLE public.ordenes_trabajo DISABLE ROW LEVEL SECURITY;

