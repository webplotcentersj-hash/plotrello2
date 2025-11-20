# ⚙️ Configurar Variables de Entorno en Vercel

## 🚨 Problema Actual

El error que estás viendo:
```
Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL
```

Significa que las variables de entorno de Supabase **NO están configuradas** en Vercel.

## ✅ Solución: Configurar Variables en Vercel

### Paso 1: Obtener las Credenciales de Supabase

1. Ve a https://app.supabase.com
2. Seleccioná tu proyecto
3. Ve a **Settings** → **API**
4. Copiá estos valores:
   - **Project URL** → Esta es tu `VITE_SUPABASE_URL`
   - **anon public** key → Esta es tu `VITE_SUPABASE_ANON_KEY`

### Paso 2: Configurar en Vercel

1. Ve a https://vercel.com/dashboard
2. Seleccioná tu proyecto **plotrello**
3. Ve a **Settings** → **Environment Variables**
4. Agregá estas 3 variables:

#### Variable 1: `VITE_SUPABASE_URL`
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://tu-proyecto.supabase.co` (la URL completa de tu proyecto Supabase)
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 2: `VITE_SUPABASE_ANON_KEY`
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `tu-anon-key-aqui` (la clave anon public de Supabase)
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 3: `VITE_SUPABASE_SCHEMA` (Opcional)
- **Key**: `VITE_SUPABASE_SCHEMA`
- **Value**: `public` (o el schema que uses, normalmente `public`)
- **Environment**: ✅ Production, ✅ Preview, ✅ Development

### Paso 3: Hacer Redeploy

**⚠️ IMPORTANTE**: Después de agregar/cambiar variables de entorno, **DEBÉS hacer un Redeploy**:

1. Ve a **Deployments** en Vercel
2. Hacé clic en los **3 puntos** (⋯) del último deployment
3. Seleccioná **Redeploy**
4. Esperá 1-2 minutos

**O** simplemente hacé un nuevo commit y push (Vercel desplegará automáticamente).

## 🔍 Verificar que Funcionó

1. Recargá la página de tu app en Vercel
2. Abrí la consola del navegador (F12)
3. Deberías ver:
   - ✅ `Cliente de Supabase inicializado correctamente`
   - ❌ NO deberías ver el error de "Invalid supabaseUrl"

## 📝 Ejemplo de Valores

```
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
VITE_SUPABASE_SCHEMA=public
```

## 🆘 Si Sigue Sin Funcionar

1. **Verificá que las variables estén en los 3 ambientes** (Production, Preview, Development)
2. **Verificá que no haya espacios** antes/después de los valores
3. **Verificá que la URL comience con `https://`**
4. **Hacé un Redeploy** después de cada cambio
5. **Revisá los logs del build** en Vercel para ver si hay errores

## 💡 Tip

Si querés probar localmente primero, creá un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SUPABASE_SCHEMA=public
```

Luego ejecutá `npm run dev` para probar localmente.


