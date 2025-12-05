BEGIN;

-- 1. Agregar columna sector_id a usuarios
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS sector_id integer REFERENCES public.sectores(id) ON DELETE SET NULL;

-- 2. Actualizar roles
-- Eliminar constraint existente
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

-- Migrar datos existentes (mapeo tentativo)
UPDATE public.usuarios SET rol = 'admin' WHERE rol = 'administracion';
UPDATE public.usuarios SET rol = 'empleado' WHERE rol IN ('taller', 'mostrador');
-- Default para otros casos o nuevos
ALTER TABLE public.usuarios ALTER COLUMN rol SET DEFAULT 'empleado';

-- Agregar nueva constraint
ALTER TABLE public.usuarios
ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin', 'empleado'));

-- 3. Actualizar función login_usuario para devolver sector_id
DROP FUNCTION IF EXISTS public.login_usuario(text, text);

CREATE OR REPLACE FUNCTION public.login_usuario(p_usuario text, p_password text)
RETURNS TABLE (id integer, nombre text, rol text, sector_id integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_rec public.usuarios%ROWTYPE;
BEGIN
  SELECT *
    INTO user_rec
    FROM public.usuarios
   WHERE lower(nombre) = lower(p_usuario)
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF crypt(p_password, user_rec.password_hash) = user_rec.password_hash THEN
    RETURN QUERY SELECT user_rec.id, user_rec.nombre, user_rec.rol, user_rec.sector_id;
  END IF;
END;
$$;

-- Otorgar permisos nuevamente
GRANT EXECUTE ON FUNCTION public.login_usuario(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.login_usuario(text, text) TO authenticated;

COMMIT;
