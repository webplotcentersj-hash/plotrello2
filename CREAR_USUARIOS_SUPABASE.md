# 👤 Crear Usuarios en Supabase

## 🚨 Problema

No hay usuarios creados por defecto en la base de datos. Necesitás crear al menos un usuario para poder hacer login.

## ✅ Solución: Crear Usuario en Supabase

### Opción 1: Desde el SQL Editor de Supabase (Recomendado)

1. **Ve a tu proyecto en Supabase**: https://app.supabase.com
2. **Abrí el SQL Editor** (menú lateral izquierdo)
3. **Ejecutá este SQL** para crear un usuario administrador:

```sql
-- Crear usuario administrador
-- Usuario: admin
-- Contraseña: admin123
INSERT INTO public.usuarios (nombre, password_hash, rol)
VALUES ('admin', crypt('admin123', gen_salt('bf')), 'administracion')
ON CONFLICT (nombre) DO NOTHING;
```

4. **O creá más usuarios** según necesites:

```sql
-- Usuario de taller
-- Usuario: taller
-- Contraseña: taller123
INSERT INTO public.usuarios (nombre, password_hash, rol)
VALUES ('taller', crypt('taller123', gen_salt('bf')), 'taller')
ON CONFLICT (nombre) DO NOTHING;

-- Usuario de mostrador
-- Usuario: mostrador
-- Contraseña: mostrador123
INSERT INTO public.usuarios (nombre, password_hash, rol)
VALUES ('mostrador', crypt('mostrador123', gen_salt('bf')), 'mostrador')
ON CONFLICT (nombre) DO NOTHING;
```

### Opción 2: Desde la Tabla Table Editor

1. **Ve a Table Editor** en Supabase
2. **Seleccioná la tabla `usuarios`**
3. **Hacé clic en "Insert row"**
4. **Completá los campos**:
   - `nombre`: `admin` (o el nombre que quieras)
   - `password_hash`: **NO lo pongas directamente**, necesitás hashearlo primero
   - `rol`: `administracion` (o `taller`, `mostrador`)

**⚠️ Problema**: No podés hashear la contraseña desde el Table Editor. Usá la **Opción 1** (SQL Editor) en su lugar.

## 🔑 Usuarios de Prueba Recomendados

### Usuario Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Rol**: `administracion`

### Usuario Taller
- **Usuario**: `taller`
- **Contraseña**: `taller123`
- **Rol**: `taller`

### Usuario Mostrador
- **Usuario**: `mostrador`
- **Contraseña**: `mostrador123`
- **Rol**: `mostrador`

## 🔐 Cambiar Contraseña de un Usuario Existente

Si querés cambiar la contraseña de un usuario:

```sql
-- Cambiar contraseña del usuario "admin" a "nueva_password"
UPDATE public.usuarios
SET password_hash = crypt('nueva_password', gen_salt('bf'))
WHERE nombre = 'admin';
```

## 📝 Verificar Usuarios Creados

Para ver qué usuarios tenés:

```sql
SELECT id, nombre, rol, last_seen
FROM public.usuarios;
```

**⚠️ Nota de Seguridad**: Nunca mostrés el `password_hash` en producción. Solo mostrá `id`, `nombre`, `rol`, etc.

## 🆘 Si No Podés Hacer Login

1. **Verificá que el usuario exista**:
   ```sql
   SELECT nombre, rol FROM public.usuarios WHERE nombre = 'tu_usuario';
   ```

2. **Verificá que la contraseña esté hasheada correctamente**:
   ```sql
   -- Probar si la contraseña funciona
   SELECT nombre, rol
   FROM public.usuarios
   WHERE nombre = 'admin'
     AND crypt('admin123', password_hash) = password_hash;
   ```

3. **Si no funciona, recreá el usuario**:
   ```sql
   -- Eliminar y recrear
   DELETE FROM public.usuarios WHERE nombre = 'admin';
   INSERT INTO public.usuarios (nombre, password_hash, rol)
   VALUES ('admin', crypt('admin123', gen_salt('bf')), 'administracion');
   ```

## 💡 Tips

- **Usá contraseñas seguras en producción** (no `admin123`)
- **Creá usuarios según los roles** que necesites
- **El nombre de usuario es case-insensitive** (admin = Admin = ADMIN)
- **Las contraseñas SÍ son case-sensitive** (admin123 ≠ Admin123)

## 🔒 Seguridad

- **Nunca compartas las contraseñas** en producción
- **Usá contraseñas fuertes** (mínimo 8 caracteres, mayúsculas, números, símbolos)
- **Considerá usar autenticación de Supabase** en el futuro para mejor seguridad


