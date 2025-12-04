-- Crear tabla para relacionar usuarios con sectores
-- Esto permite que cada usuario pertenezca a uno o más sectores

BEGIN;

-- ============================================
-- Crear tabla usuario_sectores
-- ============================================
CREATE TABLE IF NOT EXISTS public.usuario_sectores (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  sector_id integer NOT NULL REFERENCES public.sectores(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_usuario_sector UNIQUE (usuario_id, sector_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_usuario_sectores_usuario ON public.usuario_sectores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_sectores_sector ON public.usuario_sectores(sector_id);

-- Permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuario_sectores TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE usuario_sectores_id_seq TO anon, authenticated;

-- ============================================
-- Función para obtener usuarios de un sector por nombre
-- ============================================
CREATE OR REPLACE FUNCTION public.get_users_by_sector_name(sector_nombre text)
RETURNS TABLE (user_id integer, user_nombre text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT u.id, u.nombre
  FROM public.usuarios u
  INNER JOIN public.usuario_sectores us ON u.id = us.usuario_id
  INNER JOIN public.sectores s ON us.sector_id = s.id
  WHERE s.nombre = sector_nombre
  ORDER BY u.nombre;
END;
$$;

-- ============================================
-- Función para asignar un usuario a un sector
-- ============================================
CREATE OR REPLACE FUNCTION public.asignar_usuario_a_sector(
  p_usuario_id integer,
  p_sector_nombre text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sector_id integer;
BEGIN
  -- Obtener el ID del sector por nombre
  SELECT id INTO v_sector_id
  FROM public.sectores
  WHERE nombre = p_sector_nombre;
  
  IF v_sector_id IS NULL THEN
    RAISE EXCEPTION 'Sector "%" no encontrado', p_sector_nombre;
  END IF;
  
  -- Insertar relación si no existe
  INSERT INTO public.usuario_sectores (usuario_id, sector_id)
  VALUES (p_usuario_id, v_sector_id)
  ON CONFLICT (usuario_id, sector_id) DO NOTHING;
  
  RETURN true;
END;
$$;

RAISE NOTICE '✅ Tabla usuario_sectores creada';
RAISE NOTICE '✅ Funciones de gestión de sectores creadas';
RAISE NOTICE '';
RAISE NOTICE '💡 Para asignar usuarios a sectores, usa:';
RAISE NOTICE '   SELECT public.asignar_usuario_a_sector(usuario_id, ''Nombre del Sector'');';
RAISE NOTICE '';
RAISE NOTICE '💡 Ejemplo:';
RAISE NOTICE '   SELECT public.asignar_usuario_a_sector(1, ''Diseño Gráfico'');';

COMMIT;

