-- Actualizar el CHECK constraint del campo sector para incluir TODOS los sectores del Kanban
-- Esto asegura que los valores del frontend coincidan con los permitidos en la BD

BEGIN;

-- Eliminar el constraint antiguo
ALTER TABLE public.ordenes_trabajo
  DROP CONSTRAINT IF EXISTS ordenes_trabajo_sector_check;

-- Crear el nuevo constraint con TODOS los sectores del Kanban
ALTER TABLE public.ordenes_trabajo
  ADD CONSTRAINT ordenes_trabajo_sector_check CHECK (
    sector IN (
      -- Sectores originales
      'Diseño Gráfico',
      'Taller de Imprenta',
      'Taller Gráfico',
      'Instalaciones',
      'Metalúrgica',
      'Mostrador',
      'Caja',
      -- Sectores adicionales del Kanban
      'Diseño en Proceso',
      'En Espera',
      'Imprenta (Área de Impresión)',
      'Finalizado en Taller',
      'Almacén de Entrega'
    )
  );

-- Verificar que el constraint se aplicó correctamente
DO $$
DECLARE
  constraint_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND constraint_name = 'ordenes_trabajo_sector_check'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✅ Constraint ordenes_trabajo_sector_check actualizado correctamente';
  ELSE
    RAISE WARNING '⚠️ El constraint no se creó correctamente';
  END IF;
END $$;

-- También actualizar la tabla sectores para incluir todos los sectores del Kanban
INSERT INTO public.sectores (nombre, color, activo, orden_visualizacion)
VALUES
  -- Sectores originales (si no existen)
  ('Diseño Gráfico', '#f97316', true, 1),
  ('Taller de Imprenta', '#06b6d4', true, 2),
  ('Taller Gráfico', '#3b82f6', true, 3),
  ('Instalaciones', '#8b5cf6', true, 4),
  ('Metalúrgica', '#ec4899', true, 5),
  ('Mostrador', '#10b981', true, 6),
  ('Caja', '#facc15', true, 7),
  -- Sectores adicionales del Kanban
  ('Diseño en Proceso', '#ef4444', true, 8),
  ('En Espera', '#eab308', true, 9),
  ('Imprenta (Área de Impresión)', '#22c55e', true, 10),
  ('Finalizado en Taller', '#14b8a6', true, 11),
  ('Almacén de Entrega', '#a3e635', true, 12)
ON CONFLICT (nombre) DO UPDATE
SET
  color = EXCLUDED.color,
  activo = EXCLUDED.activo,
  orden_visualizacion = EXCLUDED.orden_visualizacion;

DO $$
BEGIN
  RAISE NOTICE '✅ Sectores actualizados en la tabla sectores';
END $$;

COMMIT;

