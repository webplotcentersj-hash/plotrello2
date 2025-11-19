# 🚀 Guía de Deployment en Vercel

## 📋 Pasos para Actualizar Vercel

### Opción 1: Si tienes Vercel CLI instalado (Rápido)

1. **Instala Vercel CLI** (si no lo tienes):
   ```bash
   npm install -g vercel
   ```

2. **Inicia sesión en Vercel**:
   ```bash
   vercel login
   ```

3. **Despliega**:
   ```bash
   vercel --prod
   ```

### Opción 2: Desde el Dashboard de Vercel (Recomendado)

#### Si ya tienes el proyecto conectado a Git:

1. **Haz commit y push de tus cambios**:
   ```bash
   git add .
   git commit -m "Actualización: Sistema de autenticación y adaptación a BD existente"
   git push
   ```

2. **Vercel desplegará automáticamente** cuando detecte el push

#### Si NO tienes el proyecto conectado:

1. **Ve a [vercel.com](https://vercel.com)**
2. **Inicia sesión** con tu cuenta
3. **Haz clic en "Add New Project"**
4. **Importa tu repositorio** desde GitHub/GitLab
5. **Configura el proyecto**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. **Configura Variables de Entorno**:
   - `VITE_SUPABASE_URL` = `https://tu-proyecto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `tu-anon-key-aqui`
   - `VITE_SUPABASE_SCHEMA` = `public` (o el schema que uses)
   - `VITE_GEMINI_API_KEY` = `tu_api_key_de_gemini` (opcional, solo si usás Gemini)

7. **Haz clic en "Deploy"**

### Opción 3: Deploy Manual (Drag & Drop)

1. **Compila el proyecto localmente**:
   ```bash
   npm run build
   ```

2. **Ve a [vercel.com](https://vercel.com)**
3. **Haz clic en "Add New Project"**
4. **Selecciona "Deploy" → "Browse"**
5. **Arrastra la carpeta `dist/`** al navegador
6. **Configura las variables de entorno** en Settings después del deploy

## ⚙️ Configuración de Variables de Entorno

### Variables Requeridas

En Vercel, ve a **Settings → Environment Variables** y agrega:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | `tu-anon-key-aqui` | Clave pública anónima de Supabase |
| `VITE_SUPABASE_SCHEMA` | `public` | Schema de la base de datos (normalmente `public`) |
| `VITE_GEMINI_API_KEY` | `tu_api_key_aqui` | API Key de Google Gemini (opcional) |

**⚠️ IMPORTANTE:**
- Agrega estas variables para **Production**, **Preview** y **Development**
- Haz clic en "Save" después de agregar cada variable
- Si cambias una variable, necesitas hacer un **nuevo deploy** (Redeploy)
- Las variables de Supabase las encontrás en: **Supabase Dashboard** → **Project Settings** → **API**

## 🔍 Verificar el Deploy

1. **Espera a que termine el build** (generalmente 1-2 minutos)
2. **Visita la URL** que Vercel te proporciona
3. **Verifica que funcione**:
   - Debe mostrarse la pantalla de login
   - Debe poder conectarse a la API
   - Debe funcionar el login

## 🔄 Actualizar un Deploy Existente

### Si el proyecto ya está en Vercel:

1. **Haz push de tus cambios a Git**:
   ```bash
   git add .
   git commit -m "Actualización: [descripción de cambios]"
   git push
   ```

2. **Vercel detectará automáticamente** el cambio y desplegará

3. **O manualmente desde Vercel Dashboard**:
   - Ve a tu proyecto en Vercel
   - Haz clic en "Deployments"
   - Haz clic en "Redeploy" en el último deployment

## 🐛 Solución de Problemas

### Error: "Build failed"

**Causas comunes:**
- Variables de entorno no configuradas
- Errores de TypeScript
- Dependencias faltantes

**Solución:**
1. Revisa los logs del build en Vercel
2. Verifica que todas las variables de entorno estén configuradas
3. Prueba el build localmente: `npm run build`

### Error: "Supabase no está configurado" o "API connection failed"

**Solución:**
1. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén configuradas en Vercel
2. Verifica que las variables estén en **Production**, **Preview** y **Development**
3. Haz un **Redeploy** después de agregar/cambiar variables
4. Verifica que el proyecto Supabase esté activo y las tablas estén creadas
5. Revisa la consola del navegador para ver errores específicos

### Error: "404 on routes"

**Solución:**
- Verifica que `vercel.json` tenga las rewrites configuradas
- Asegúrate de que el `outputDirectory` sea `dist`

## 📝 Checklist Pre-Deploy

- [ ] Código compilado sin errores (`npm run build`)
- [ ] Variables de Supabase configuradas en Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_SCHEMA`)
- [ ] Tablas creadas en Supabase (ejecutaste `schema.sql` y `materiales_seed.sql`)
- [ ] `vercel.json` configurado correctamente
- [ ] Cambios commiteados y pusheados (si usas Git)

## 🎉 Después del Deploy

1. **Prueba la aplicación** en la URL de Vercel
2. **Verifica el login** funciona
3. **Verifica que se conecte a la API**
4. **Configura dominio personalizado** (opcional):
   - Ve a Settings → Domains
   - Agrega tu dominio personalizado

## 🔗 URLs Importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com/
- **Documentación Vercel**: https://vercel.com/docs
- **Documentación Supabase**: https://supabase.com/docs

---

## 💡 Tips

- **Deploy Preview**: Cada pull request crea un preview deployment automáticamente
- **Rollback**: Puedes hacer rollback a deployments anteriores desde el dashboard
- **Logs**: Revisa los logs en tiempo real durante el build
- **Analytics**: Activa Vercel Analytics para ver métricas de tu app

