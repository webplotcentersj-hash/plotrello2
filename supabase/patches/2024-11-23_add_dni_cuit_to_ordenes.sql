-- Agregar columna dni_cuit a ordenes_trabajo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'dni_cuit'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN dni_cuit VARCHAR(32);
  END IF;
END $$;


