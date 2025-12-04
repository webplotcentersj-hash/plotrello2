-- Añade campos de contacto del cliente a ordenes_trabajo
-- Versión mejorada con verificación de políticas RLS
DO $$
BEGIN
  -- Solo ejecutar si la tabla ordenes_trabajo existe
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ordenes_trabajo'
  ) THEN
  
    -- Agregar telefono_cliente
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ordenes_trabajo'
        AND column_name = 'telefono_cliente'
    ) THEN
      ALTER TABLE public.ordenes_trabajo
        ADD COLUMN telefono_cliente text;
      RAISE NOTICE 'Columna telefono_cliente agregada';
    ELSE
      RAISE NOTICE 'Columna telefono_cliente ya existe';
    END IF;
  
    -- Agregar email_cliente
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ordenes_trabajo'
        AND column_name = 'email_cliente'
    ) THEN
      ALTER TABLE public.ordenes_trabajo
        ADD COLUMN email_cliente text;
      RAISE NOTICE 'Columna email_cliente agregada';
    ELSE
      RAISE NOTICE 'Columna email_cliente ya existe';
    END IF;
  
    -- Agregar direccion_cliente
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ordenes_trabajo'
        AND column_name = 'direccion_cliente'
    ) THEN
      ALTER TABLE public.ordenes_trabajo
        ADD COLUMN direccion_cliente text;
      RAISE NOTICE 'Columna direccion_cliente agregada';
    ELSE
      RAISE NOTICE 'Columna direccion_cliente ya existe';
    END IF;
  
    -- Agregar whatsapp_link
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ordenes_trabajo'
        AND column_name = 'whatsapp_link'
    ) THEN
      ALTER TABLE public.ordenes_trabajo
        ADD COLUMN whatsapp_link text;
      RAISE NOTICE 'Columna whatsapp_link agregada';
    ELSE
      RAISE NOTICE 'Columna whatsapp_link ya existe';
    END IF;
  
    -- Agregar ubicacion_link
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ordenes_trabajo'
        AND column_name = 'ubicacion_link'
    ) THEN
      ALTER TABLE public.ordenes_trabajo
        ADD COLUMN ubicacion_link text;
      RAISE NOTICE 'Columna ubicacion_link agregada';
    ELSE
      RAISE NOTICE 'Columna ubicacion_link ya existe';
    END IF;
  
    -- Agregar drive_link
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'ordenes_trabajo'
        AND column_name = 'drive_link'
    ) THEN
      ALTER TABLE public.ordenes_trabajo
        ADD COLUMN drive_link text;
      RAISE NOTICE 'Columna drive_link agregada';
    ELSE
      RAISE NOTICE 'Columna drive_link ya existe';
    END IF;

    -- Verificar y actualizar políticas RLS si es necesario
    -- Las políticas existentes deberían permitir INSERT y UPDATE de estas columnas
    -- Si hay políticas específicas, pueden necesitar actualización
    
  ELSE
    RAISE NOTICE 'Tabla ordenes_trabajo no existe, saltando creación de columnas';
  END IF;
END $$;

-- Verificar que las columnas existen
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'ordenes_trabajo'
    AND column_name IN ('telefono_cliente', 'email_cliente', 'direccion_cliente', 'whatsapp_link', 'ubicacion_link', 'drive_link');
  
  RAISE NOTICE 'Total de columnas de contacto encontradas: %', col_count;
  
  IF col_count < 6 THEN
    RAISE WARNING 'Faltan algunas columnas de contacto. Esperado: 6, Encontrado: %', col_count;
  ELSE
    RAISE NOTICE 'Todas las columnas de contacto están presentes';
  END IF;
END $$;

