-- Agregar soporte para múltiples sectores y sub-tareas
-- Este script agrega campos para sectores múltiples y sector inicial

BEGIN;

-- ============================================
-- PASO 1: Agregar campos a ordenes_trabajo
-- ============================================
DO $$
BEGIN
  -- Agregar campo sectores (array de sectores requeridos)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'sectores'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
    ADD COLUMN sectores text[] DEFAULT ARRAY[]::text[];
    
    -- Migrar datos existentes: convertir sector único a array
    UPDATE public.ordenes_trabajo
    SET sectores = ARRAY[sector]
    WHERE sector IS NOT NULL AND sector != '';
    
    RAISE NOTICE '✅ Columna sectores agregada a ordenes_trabajo';
  ELSE
    RAISE NOTICE 'ℹ️ Columna sectores ya existe';
  END IF;

  -- Agregar campo sector_inicial (dónde aparece la ficha principal)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'sector_inicial'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
    ADD COLUMN sector_inicial text;
    
    -- Migrar datos existentes: usar sector como sector_inicial
    UPDATE public.ordenes_trabajo
    SET sector_inicial = sector
    WHERE sector IS NOT NULL AND sector != '';
    
    RAISE NOTICE '✅ Columna sector_inicial agregada a ordenes_trabajo';
  ELSE
    RAISE NOTICE 'ℹ️ Columna sector_inicial ya existe';
  END IF;
END $$;

-- ============================================
-- PASO 2: Modificar tabla tareas para sub-tareas
-- ============================================
DO $$
BEGIN
  -- Agregar campo sector a tareas (para saber en qué columna aparece)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tareas'
      AND column_name = 'sector'
  ) THEN
    ALTER TABLE public.tareas
    ADD COLUMN sector text;
    
    RAISE NOTICE '✅ Columna sector agregada a tareas';
  ELSE
    RAISE NOTICE 'ℹ️ Columna sector ya existe en tareas';
  END IF;

  -- Agregar campo es_sub_tarea (para distinguir sub-tareas de tareas normales)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tareas'
      AND column_name = 'es_sub_tarea'
  ) THEN
    ALTER TABLE public.tareas
    ADD COLUMN es_sub_tarea boolean DEFAULT false;
    
    RAISE NOTICE '✅ Columna es_sub_tarea agregada a tareas';
  ELSE
    RAISE NOTICE 'ℹ️ Columna es_sub_tarea ya existe en tareas';
  END IF;
END $$;

-- ============================================
-- PASO 3: Crear función para crear sub-tareas automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.crear_sub_tareas_automaticas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sector_nombre text;
  tarea_existente boolean;
BEGIN
  -- Solo crear sub-tareas si hay múltiples sectores
  IF NEW.sectores IS NOT NULL AND array_length(NEW.sectores, 1) > 1 THEN
    -- Crear una sub-tarea para cada sector (excepto el sector inicial)
    FOREACH sector_nombre IN ARRAY NEW.sectores
    LOOP
      -- No crear sub-tarea para el sector inicial (ese es donde va la ficha principal)
      IF sector_nombre != NEW.sector_inicial THEN
        -- Verificar si ya existe una sub-tarea para este sector
        SELECT EXISTS (
          SELECT 1 FROM public.tareas
          WHERE id_orden = NEW.id
            AND sector = sector_nombre
            AND es_sub_tarea = true
        ) INTO tarea_existente;
        
        -- Solo crear si no existe
        IF NOT tarea_existente THEN
          INSERT INTO public.tareas (
            id_orden,
            descripcion_tarea,
            estado_kanban,
            sector,
            es_sub_tarea
          ) VALUES (
            NEW.id,
            format('Tarea para sector %s - OP #%s', sector_nombre, NEW.numero_op),
            'Pendiente',
            sector_nombre,
            true
          );
          
          RAISE NOTICE '✅ Sub-tarea creada para sector: % (OP: %)', sector_nombre, NEW.numero_op;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- PASO 4: Crear trigger para crear sub-tareas automáticamente
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_crear_sub_tareas ON public.ordenes_trabajo;
    CREATE TRIGGER trigger_crear_sub_tareas
      AFTER INSERT ON public.ordenes_trabajo
      FOR EACH ROW
      EXECUTE FUNCTION public.crear_sub_tareas_automaticas();
    
    RAISE NOTICE '✅ Trigger para crear sub-tareas automáticamente creado';
  END IF;
END $$;

-- ============================================
-- PASO 5: Crear función para actualizar sub-tareas cuando se modifican los sectores
-- ============================================
CREATE OR REPLACE FUNCTION public.actualizar_sub_tareas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sector_nombre text;
  tarea_existente boolean;
BEGIN
  -- Solo procesar si los sectores cambiaron
  IF OLD.sectores IS DISTINCT FROM NEW.sectores OR OLD.sector_inicial IS DISTINCT FROM NEW.sector_inicial THEN
    -- Eliminar sub-tareas de sectores que ya no están en la lista
    DELETE FROM public.tareas
    WHERE id_orden = NEW.id
      AND es_sub_tarea = true
      AND sector != ALL(NEW.sectores);
    
    -- Crear sub-tareas para sectores nuevos (excepto sector inicial)
    IF NEW.sectores IS NOT NULL AND array_length(NEW.sectores, 1) > 1 THEN
      FOREACH sector_nombre IN ARRAY NEW.sectores
      LOOP
        IF sector_nombre != NEW.sector_inicial THEN
          SELECT EXISTS (
            SELECT 1 FROM public.tareas
            WHERE id_orden = NEW.id
              AND sector = sector_nombre
              AND es_sub_tarea = true
          ) INTO tarea_existente;
          
          IF NOT tarea_existente THEN
            INSERT INTO public.tareas (
              id_orden,
              descripcion_tarea,
              estado_kanban,
              sector,
              es_sub_tarea
            ) VALUES (
              NEW.id,
              format('Tarea para sector %s - OP #%s', sector_nombre, NEW.numero_op),
              'Pendiente',
              sector_nombre,
              true
            );
          END IF;
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para actualizar sub-tareas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_actualizar_sub_tareas ON public.ordenes_trabajo;
    CREATE TRIGGER trigger_actualizar_sub_tareas
      AFTER UPDATE ON public.ordenes_trabajo
      FOR EACH ROW
      EXECUTE FUNCTION public.actualizar_sub_tareas();
    
    RAISE NOTICE '✅ Trigger para actualizar sub-tareas creado';
  END IF;
END $$;

COMMIT;

