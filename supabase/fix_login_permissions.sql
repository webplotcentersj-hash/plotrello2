-- ============================================
-- Script para Arreglar Permisos del Login
-- ============================================

-- 1. Asegurarse de que la extensión pgcrypto esté instalada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Recrear la función login_usuario con permisos correctos
CREATE OR REPLACE FUNCTION public.login_usuario(p_usuario text, p_password text)
RETURNS TABLE (id integer, nombre text, rol text)
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
    RETURN QUERY SELECT user_rec.id, user_rec.nombre, user_rec.rol;
  END IF;
END;
$$;

-- 3. Dar permisos al rol anon para ejecutar la función
GRANT EXECUTE ON FUNCTION public.login_usuario(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.login_usuario(text, text) TO authenticated;

-- 4. Asegurarse de que la tabla usuarios sea accesible (si hay RLS, deshabilitarlo temporalmente o crear políticas)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 5. Crear política para que la función pueda leer usuarios (necesario para SECURITY DEFINER)
-- Nota: La función usa SECURITY DEFINER, así que debería poder leer sin políticas, pero por si acaso:
DROP POLICY IF EXISTS "Allow login function to read users" ON public.usuarios;
CREATE POLICY "Allow login function to read users" 
  ON public.usuarios
  FOR SELECT
  USING (true);

-- 6. Verificar que todo esté bien
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type
FROM pg_proc p
WHERE p.proname = 'login_usuario';

-- 7. Probar la función (reemplazá con tus credenciales)
-- SELECT * FROM public.login_usuario('admin', 'admin123');

