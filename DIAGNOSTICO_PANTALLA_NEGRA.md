# 🔍 Diagnóstico: Pantalla Negra

## ✅ Cambios Aplicados

1. **ErrorBoundary agregado**: Captura errores de JavaScript y muestra un mensaje útil
2. **Mejor logging**: Ahora se muestran las variables de entorno en la consola
3. **Manejo de errores global**: Captura errores no manejados

## 🔧 Pasos para Diagnosticar

### 1. Verificar Variables de Entorno en Vercel

1. Ve a https://vercel.com/dashboard
2. Seleccioná tu proyecto `plotrello`
3. Settings → Environment Variables
4. Verificá que estén configuradas:
   - `VITE_SUPABASE_URL` = `https://tu-proyecto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `tu-anon-key`
   - `VITE_SUPABASE_SCHEMA` = `public` (o el schema que uses)

**⚠️ IMPORTANTE**: Después de agregar/cambiar variables, hacé un **Redeploy**

### 2. Revisar Consola del Navegador

1. Abrí https://plotrello.vercel.app
2. Presioná **F12** (o clic derecho → Inspeccionar)
3. Ve a la pestaña **Console**
4. Buscá errores en rojo

**Errores comunes**:
- `VITE_SUPABASE_URL is not defined` → Variables no configuradas
- `Failed to fetch` → Problema de conexión a Supabase
- `Cannot read property 'X' of undefined` → Error en el código

### 3. Verificar Network

1. En las herramientas de desarrollador, ve a **Network**
2. Recargá la página (F5)
3. Buscá requests que fallen (en rojo)
4. Revisá especialmente:
   - Requests a Supabase
   - Carga de archivos JS/CSS

### 4. Verificar que el Deploy esté Actualizado

1. Ve a Vercel Dashboard → Deployments
2. Verificá que el último deploy sea reciente
3. Si no, hacé clic en "Redeploy"

## 🐛 Soluciones Comunes

### Problema: Pantalla completamente negra sin mensaje

**Causa**: Error de JavaScript que rompe React antes de que se renderice algo

**Solución**:
1. Revisá la consola del navegador (F12)
2. Buscá el primer error en rojo
3. Compartí el error para diagnosticarlo

### Problema: Pantalla negra con mensaje de error del ErrorBoundary

**Causa**: Error capturado por el ErrorBoundary

**Solución**:
1. El mensaje de error debería aparecer en pantalla
2. Hacé clic en "Detalles técnicos" para ver el stack trace
3. Compartí el error completo

### Problema: "Supabase no está configurado" en consola

**Causa**: Variables de entorno no configuradas en Vercel

**Solución**:
1. Configurá las variables en Vercel (ver paso 1)
2. Hacé un **Redeploy** después de agregar variables
3. Verificá que las variables estén en Production, Preview y Development

### Problema: "Failed to fetch" o errores de CORS

**Causa**: Problema de conexión a Supabase o CORS mal configurado

**Solución**:
1. Verificá que la URL de Supabase sea correcta
2. Verificá que el proyecto Supabase esté activo
3. Revisá la configuración de RLS en Supabase

## 📋 Checklist de Verificación

- [ ] Variables de entorno configuradas en Vercel
- [ ] Redeploy hecho después de agregar variables
- [ ] Consola del navegador revisada (F12)
- [ ] No hay errores en rojo en la consola
- [ ] El último deploy en Vercel es reciente
- [ ] Supabase está activo y accesible
- [ ] Tablas creadas en Supabase (schema.sql ejecutado)

## 🆘 Si Nada Funciona

1. **Compartí**:
   - Captura de pantalla de la consola del navegador (F12)
   - Captura de pantalla de las variables de entorno en Vercel
   - El mensaje de error completo (si aparece)

2. **Verificá localmente**:
   ```powershell
   npm run build
   npm run preview
   ```
   Si funciona localmente pero no en Vercel, es un problema de configuración de variables.

## 📝 Notas

- El ErrorBoundary ahora captura errores y muestra un mensaje útil
- Los errores se loguean en la consola para debugging
- Si ves un mensaje de error en pantalla, ese es el problema específico

