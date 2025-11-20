BEGIN;

-- Asegura que el campo sector acepte todos los valores requeridos
ALTER TABLE public.ordenes_trabajo
  DROP CONSTRAINT IF EXISTS ordenes_trabajo_sector_check;

ALTER TABLE public.ordenes_trabajo
  ALTER COLUMN sector SET DEFAULT 'Diseño Gráfico';

ALTER TABLE public.ordenes_trabajo
  ADD CONSTRAINT ordenes_trabajo_sector_check CHECK (
    sector IN (
      'Diseño Gráfico',
      'Taller de Imprenta',
      'Taller Gráfico',
      'Instalaciones',
      'Metalúrgica',
      'Mostrador',
      'Caja'
    )
  );

-- Añade el campo opcional para mostrar en UI quién creó la orden
ALTER TABLE public.ordenes_trabajo
  ADD COLUMN IF NOT EXISTS nombre_creador varchar(100);

-- Precarga los sectores solicitados
INSERT INTO public.sectores (nombre, color, activo, orden_visualizacion)
VALUES
  ('Diseño Gráfico', '#f97316', true, 1),
  ('Taller de Imprenta', '#0ea5e9', true, 2),
  ('Taller Gráfico', '#6366f1', true, 3),
  ('Instalaciones', '#a855f7', true, 4),
  ('Metalúrgica', '#ec4899', true, 5),
  ('Mostrador', '#10b981', true, 6),
  ('Caja', '#facc15', true, 7)
ON CONFLICT (nombre) DO UPDATE
SET
  color = EXCLUDED.color,
  activo = EXCLUDED.activo,
  orden_visualizacion = EXCLUDED.orden_visualizacion;

COMMIT;

