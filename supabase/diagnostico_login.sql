-- ============================================
-- Script de Diagnóstico para Login
-- ============================================

-- 1. Verificar que los usuarios existan
SELECT 
  id, 
  nombre, 
  rol, 
  LENGTH(password_hash) as hash_length,
  last_seen
FROM public.usuarios;

-- 2. Verificar que la función login_usuario exista
SELECT 
  proname as function_name,
  prosrc as function_code
FROM pg_proc
WHERE proname = 'login_usuario';

-- 3. Probar el login manualmente (reemplazá 'admin' y 'admin123' con tus credenciales)
SELECT * FROM public.login_usuario('admin', 'admin123');

-- 4. Verificar el hash de un usuario específico
SELECT 
  nombre,
  password_hash,
  -- Probar si la contraseña coincide
  crypt('admin123', password_hash) = password_hash as password_match
FROM public.usuarios
WHERE nombre = 'admin';

-- 5. Si el password_match es false, necesitás recrear el usuario con el hash correcto
-- Ejemplo para recrear el usuario 'admin' con contraseña 'admin123':
/*
DELETE FROM public.usuarios WHERE nombre = 'admin';
INSERT INTO public.usuarios (nombre, password_hash, rol)
VALUES ('admin', crypt('admin123', gen_salt('bf')), 'administracion');
*/

-- 6. Verificar permisos de la función
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type
FROM pg_proc p
WHERE p.proname = 'login_usuario';


