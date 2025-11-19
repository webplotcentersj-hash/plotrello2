# 🔧 Solución: "Credenciales Inválidas" en Login

## 🔍 Diagnóstico

Si te dice "Credenciales inválidas" o "Usuario o contraseña incorrectos", puede ser por varias razones:

### 1. El hash de la contraseña no es correcto

**Problema más común**: Si creaste el usuario desde el Table Editor de Supabase o con un método que no usa `crypt()`, el hash puede estar mal.

**Solución**: Recreá el usuario con el hash correcto:

```sql
-- Eliminar el usuario existente
DELETE FROM public.usuarios WHERE nombre = 'admin';

-- Crear el usuario con el hash correcto
INSERT INTO public.usuarios (nombre, password_hash, rol)
VALUES ('admin', crypt('admin123', gen_salt('bf')), 'administracion');
```

### 2. La función RPC no está creada

**Verificá que la función exista**:

```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'login_usuario';
```

Si no existe, ejecutá el `schema.sql` completo o solo esta parte:

```sql
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
```

### 3. El usuario no existe

**Verificá que el usuario exista**:

```sql
SELECT id, nombre, rol FROM public.usuarios;
```

Si no hay usuarios, creá uno (ver paso 1).

### 4. Problema con la extensión pgcrypto

**Verificá que la extensión esté instalada**:

```sql
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
```

Si no está, instalala:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 5. Probar el login directamente en SQL

**Probá si la función funciona**:

```sql
-- Esto debería retornar el usuario si las credenciales son correctas
SELECT * FROM public.login_usuario('admin', 'admin123');
```

Si retorna vacío, el problema está en el hash de la contraseña o el usuario no existe.

## ✅ Solución Completa Paso a Paso

### Paso 1: Verificar y Recrear Usuario

```sql
-- 1. Ver usuarios existentes
SELECT id, nombre, rol FROM public.usuarios;

-- 2. Eliminar usuario si existe (opcional, solo si querés recrearlo)
DELETE FROM public.usuarios WHERE nombre = 'admin';

-- 3. Crear usuario con hash correcto
INSERT INTO public.usuarios (nombre, password_hash, rol)
VALUES ('admin', crypt('admin123', gen_salt('bf')), 'administracion');

-- 4. Verificar que se creó
SELECT id, nombre, rol FROM public.usuarios WHERE nombre = 'admin';
```

### Paso 2: Probar la Función RPC

```sql
-- Esto debería retornar el usuario
SELECT * FROM public.login_usuario('admin', 'admin123');
```

Si retorna `id`, `nombre`, `rol` → ✅ La función funciona correctamente.

Si retorna vacío → El problema está en el hash o el usuario.

### Paso 3: Verificar el Hash Manualmente

```sql
-- Verificar si el hash coincide con la contraseña
SELECT 
  nombre,
  password_hash,
  crypt('admin123', password_hash) = password_hash as password_match
FROM public.usuarios
WHERE nombre = 'admin';
```

Si `password_match` es `false`, necesitás recrear el usuario (ver Paso 1).

## 🆘 Si Nada Funciona

1. **Ejecutá el script de diagnóstico**:
   - Abrí `supabase/diagnostico_login.sql` en el SQL Editor
   - Ejecutá todas las consultas
   - Revisá los resultados

2. **Verificá la consola del navegador** (F12):
   - Buscá errores en rojo
   - Verificá que las variables de entorno estén configuradas
   - Verificá que Supabase esté conectado

3. **Verificá los logs de Supabase**:
   - Ve a tu proyecto en Supabase
   - Logs → Postgres Logs
   - Buscá errores relacionados con `login_usuario`

## 💡 Tips

- **Usá siempre `crypt()` con `gen_salt('bf')`** para hashear contraseñas
- **No uses el Table Editor** para crear usuarios (no hashea correctamente)
- **El nombre de usuario es case-insensitive** (admin = Admin = ADMIN)
- **La contraseña SÍ es case-sensitive** (admin123 ≠ Admin123)

## 📝 Ejemplo Completo

```sql
-- Limpiar usuarios de prueba
DELETE FROM public.usuarios WHERE nombre IN ('admin', 'taller', 'mostrador');

-- Crear usuarios de prueba
INSERT INTO public.usuarios (nombre, password_hash, rol) VALUES
  ('admin', crypt('admin123', gen_salt('bf')), 'administracion'),
  ('taller', crypt('taller123', gen_salt('bf')), 'taller'),
  ('mostrador', crypt('mostrador123', gen_salt('bf')), 'mostrador');

-- Verificar
SELECT id, nombre, rol FROM public.usuarios;

-- Probar login
SELECT * FROM public.login_usuario('admin', 'admin123');
```

