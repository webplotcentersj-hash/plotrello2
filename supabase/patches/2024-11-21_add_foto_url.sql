-- Agregar columna foto_url a ordenes_trabajo
-- Este parche es OBLIGATORIO para que las capturas funcionen correctamente

BEGIN;

-- Verificar si la columna ya existe antes de agregarla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ordenes_trabajo' 
    AND column_name = 'foto_url'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN foto_url text;
    
    RAISE NOTICE 'Columna foto_url agregada exitosamente';
  ELSE
    RAISE NOTICE 'La columna foto_url ya existe';
  END IF;
END $$;

COMMIT;

