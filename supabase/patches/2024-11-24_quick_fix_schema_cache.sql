-- SOLUCIÓN RÁPIDA: Refrescar schema cache de Supabase
-- Ejecutar este script cuando las columnas existen pero Supabase no las reconoce

BEGIN;

-- Método 1: Usar COMMENT ON COLUMN para forzar actualización del cache
COMMENT ON COLUMN public.ordenes_trabajo.telefono_cliente IS 'Teléfono del cliente';
COMMENT ON COLUMN public.ordenes_trabajo.email_cliente IS 'Email del cliente';
COMMENT ON COLUMN public.ordenes_trabajo.direccion_cliente IS 'Dirección del cliente';
COMMENT ON COLUMN public.ordenes_trabajo.whatsapp_link IS 'Link de WhatsApp';
COMMENT ON COLUMN public.ordenes_trabajo.ubicacion_link IS 'Link de ubicación (Google Maps)';
COMMENT ON COLUMN public.ordenes_trabajo.drive_link IS 'Link de Google Drive';

-- Método 2: Hacer un SELECT que incluya todas las columnas para forzar carga del schema
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
WHERE false; -- No devolver datos, solo cargar schema

COMMIT;

-- IMPORTANTE: Después de ejecutar este script:
-- 1. Espera 30-60 segundos
-- 2. Recarga la aplicación con Ctrl+F5 (hard refresh)
-- 3. Prueba crear/editar una orden nuevamente

