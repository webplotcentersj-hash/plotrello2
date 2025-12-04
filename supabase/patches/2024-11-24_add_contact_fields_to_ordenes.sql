-- Añade campos de contacto del cliente a ordenes_trabajo
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'email_cliente'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN email_cliente text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'direccion_cliente'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN direccion_cliente text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'whatsapp_link'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN whatsapp_link text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'ubicacion_link'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN ubicacion_link text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
      AND column_name = 'drive_link'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN drive_link text;
  END IF;
END $$;


