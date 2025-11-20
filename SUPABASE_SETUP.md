## Migración a Supabase

Esta guía documenta cómo reemplazar el backend PHP/MySQL por Supabase manteniendo el mismo esquema de datos (`u956355532_tg`). La app ahora consume Supabase directamente mediante `@supabase/supabase-js`; sólo necesitás exponer las credenciales vía variables de entorno.

### 📋 Resumen rápido (5 pasos)

1. **Crear proyecto en Supabase** → [app.supabase.com](https://app.supabase.com/)
2. **Ejecutar `supabase/schema.sql`** en el SQL Editor de Supabase
3. **Ejecutar `supabase/patches/2024-11-20_fix_sectores_y_creador.sql`** si tu esquema fue creado antes del 20/11
4. **Ejecutar `supabase/materiales_seed.sql`** en el SQL Editor de Supabase
5. **Crear archivo `.env`** con tus credenciales de Supabase (copiá `env.example`)
6. **Crear bucket `archivos`** en Storage (opcional, solo si usás archivos)

¡Listo! Ya podés correr `npm run dev` y la app debería funcionar.

---

### 📖 Guía detallada

### 1. Crear proyecto y variables de entorno

1. Crea un proyecto en [Supabase](https://app.supabase.com/).
2. En la pestaña *Project Settings → API* copia `Project URL` y `anon/public key`.
3. Duplica `env.example` → `.env` y completa:

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_SUPABASE_SERVICE_ROLE_KEY=<opcional para scripts>
VITE_SUPABASE_SCHEMA=u956355532_tg
```

> Si todavía necesitás usar el backend antiguo en paralelo, define `VITE_API_BASE_URL=https://tu-backend.legacy/api`. Si queda vacío, la app usa directamente supabase o datos mock en desarrollo.

### 2. Importar el esquema de la base de datos

**Paso a paso:**

1. **Abre Supabase Dashboard** → Tu proyecto → **SQL Editor** (menú lateral izquierdo)

2. **Ejecuta el schema completo:**
   - Abre el archivo `supabase/schema.sql` en tu editor
   - Copia **TODO** el contenido (Ctrl+A, Ctrl+C)
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en **RUN** (o presiona Ctrl+Enter)
   - ✅ Esto crea todas las tablas, funciones RPC (`login_usuario`, `logout_usuario`), vistas y secuencias
   - ✅ Desde 20/11 el schema ya incluye la precarga de los sectores requeridos

3. **Si ya habías ejecutado el schema antes del 20/11:** corre el parche `supabase/patches/2024-11-20_fix_sectores_y_creador.sql` para:
   - Actualizar el `CHECK` de `ordenes_trabajo.sector`
   - Añadir el campo `nombre_creador`
   - Precargar los sectores (`Diseño Gráfico`, `Taller de Imprenta`, etc.)

4. **Carga los datos de materiales:**
   - Abre el archivo `supabase/materiales_seed.sql` en tu editor
   - Copia **TODO** el contenido
   - Pégalo en el SQL Editor de Supabase (nueva pestaña o después del paso anterior)
   - Haz clic en **RUN**
   - ✅ Esto carga los 562 materiales en la tabla

> **Nota:** El `schema.sql` ya incluye las funciones RPC de autenticación (`login_usuario` y `logout_usuario`), así que no necesitás ejecutarlas por separado.

### 3. Configurar Row Level Security (RLS) - OPCIONAL

Por defecto, las tablas están **sin RLS activado** para facilitar el desarrollo. Si querés activarlo:

1. En el **SQL Editor** de Supabase, ejecuta:

```sql
-- Activa RLS en las tablas principales
ALTER TABLE ordenes_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (todos pueden leer, solo autenticados pueden escribir)
CREATE POLICY "read_ordenes" ON ordenes_trabajo
  FOR SELECT USING (true);

CREATE POLICY "manage_ordenes" ON ordenes_trabajo
  FOR ALL USING (true); -- Cambiá esto según tus necesidades de seguridad
```

> **Importante:** Si activás RLS, asegurate de crear políticas para todas las tablas que la app usa, o la app no podrá leer/escribir datos.

### 4. Configurar Storage para archivos

1. En Supabase Dashboard → **Storage** (menú lateral)
2. Haz clic en **New bucket**
3. Nombre: `archivos`
4. Marca **Public bucket** (o configurá políticas según necesites)
5. Haz clic en **Create bucket**

El frontend sube archivos a `archivos/ordenes/<id>/archivo.ext`.

### 5. Configurar variables de entorno

#### Para desarrollo local:

1. **Crea el archivo `.env`** en la raíz del proyecto:
   ```powershell
   # En PowerShell (Windows):
   Copy-Item env.example .env
   
   # O en Git Bash / Linux / Mac:
   cp env.example .env
   ```
   Luego editá `.env` con tu editor de texto y completá con tus credenciales de Supabase.

#### Para Vercel (producción):

1. **Ve a tu proyecto en Vercel** → **Settings** → **Environment Variables**
2. **Agregá estas variables** (para Production, Preview y Development):
   - `VITE_SUPABASE_URL` = `https://tu-proyecto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `tu-anon-key-aqui`
   - `VITE_SUPABASE_SCHEMA` = `public` (o el schema que uses)
3. **Hacé clic en "Save"** después de cada variable
4. **Redeploy** el proyecto para que tome las nuevas variables

> **Nota:** Si ya tenés el proyecto en Vercel, necesitás hacer un nuevo deploy después de agregar las variables.

### 6. Verificación rápida

1. **Iniciá el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Verificá que todo funcione:**
   - Abrí la app en el navegador (normalmente `http://localhost:5173`)
   - Abrí la consola del navegador (F12)
   - Si ves `Supabase no está configurado...` → revisá que `.env` tenga las variables correctas
   - Si no ves ese mensaje → ✅ Supabase está conectado

3. **Probá el login:**
   - Intentá iniciar sesión (necesitás tener usuarios creados en la tabla `usuarios`)
   - Si no tenés usuarios, creá uno manualmente en Supabase o ejecutá:
   ```sql
   -- Ejemplo: crear usuario de prueba (password: "test123")
   INSERT INTO usuarios (nombre, password_hash, rol)
   VALUES ('admin', crypt('test123', gen_salt('bf')), 'administracion');
   ```

### 7. Deploy a Vercel

Si ya tenés el proyecto conectado a Vercel:

1. **Hacé commit y push de tus cambios:**
   ```bash
   git add .
   git commit -m "Migración a Supabase"
   git push
   ```

2. **Vercel desplegará automáticamente** cuando detecte el push

3. **Verificá que las variables de entorno estén configuradas** en Vercel (ver paso 5)

Si no tenés el proyecto en Vercel, seguí la guía en `DEPLOY_VERCEL.md` (actualizada con las variables de Supabase).

### 8. Limpieza del backend legacy

El directorio `backend/` fue eliminado. Conserva la exportación SQL por si necesitás rehacer el dump o ejecutar migraciones manuales.

### 9. Próximos pasos

- Automatiza migraciones con `supabase/migrations`.
- Crea tests para los RPC críticos.
- Configura monitorización de errores (Sentry/Logflare) para las funciones.

Con esto la app queda 100% sobre Supabase y los componentes React consumen los datos en tiempo real sin depender del backend PHP original.

