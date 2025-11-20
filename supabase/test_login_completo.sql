-- ============================================
-- Script Completo de Prueba de Login
-- ============================================

-- 1. Verificar que la función existe y tiene los permisos correctos
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.prosecdef THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END as security_type,
  -- Verificar permisos
  (SELECT string_agg(privilege_type, ', ')
   FROM (
     SELECT privilege_type
     FROM information_schema.routine_privileges
     WHERE routine_schema = 'public' 
       AND routine_name = 'login_usuario'
   ) p) as permissions
FROM pg_proc p
WHERE p.proname = 'login_usuario';

-- 2. Verificar usuarios existentes
SELECT 
  id, 
  nombre, 
  rol,
  LENGTH(password_hash) as hash_length
FROM public.usuarios;

-- 3. Verificar que el usuario 'admin' existe y tiene hash correcto
SELECT 
  nombre,
  rol,
  -- Probar si la contraseña coincide
  crypt('admin123', password_hash) = password_hash as password_match,
  -- Ver los primeros caracteres del hash (para debugging)
  LEFT(password_hash, 10) as hash_preview
FROM public.usuarios
WHERE nombre = 'admin';

-- 4. Probar la función directamente
SELECT * FROM public.login_usuario('admin', 'admin123');

-- 5. Si el paso 4 retorna vacío, probar con diferentes variaciones
-- (por si hay problemas de case sensitivity o espacios)
SELECT * FROM public.login_usuario('Admin', 'admin123');
SELECT * FROM public.login_usuario('ADMIN', 'admin123');
SELECT * FROM public.login_usuario('admin ', 'admin123'); -- con espacio

-- 6. Verificar permisos de la tabla usuarios
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'usuarios';

-- 7. Ver políticas RLS en la tabla usuarios
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'usuarios';

-- 8. Si el usuario no existe o el hash está mal, recrearlo:
/*
DELETE FROM public.usuarios WHERE nombre = 'admin';
INSERT INTO public.usuarios (nombre, password_hash, rol)
VALUES ('admin', crypt('admin123', gen_salt('bf')), 'administracion');
*/

-- 9. Verificar permisos de ejecución de la función
SELECT 
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' 
  AND routine_name = 'login_usuario';


