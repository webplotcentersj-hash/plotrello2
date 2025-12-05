BEGIN;

-- ==============================================================================
-- FIX: Corregir error "structure of query does not match function result type"
-- El error ocurre porque la función retornaba varchar(100) pero definía text,
-- y además usaba lógica obsoleta de roles.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_users_by_sector(p_sector_nombre text)
RETURNS TABLE (user_id integer, user_nombre text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Usar la nueva relación directa sector_id en la tabla usuarios
  -- y castear explícitamente nombre a text para coincidir con RETURNS TABLE
  RETURN QUERY
  SELECT 
    u.id AS user_id, 
    u.nombre::text AS user_nombre
  FROM public.usuarios u
  JOIN public.sectores s ON u.sector_id = s.id
  WHERE s.nombre = p_sector_nombre
  ORDER BY u.nombre;
END;
$$;

COMMIT;
