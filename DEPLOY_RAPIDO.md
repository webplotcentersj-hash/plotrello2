# 🚀 Deploy Rápido a Vercel

## Opción 1: Deploy desde Dashboard (MÁS FÁCIL)

### Paso 1: Subir a GitHub (si no lo tenés)

1. **Creá un repositorio en GitHub**:
   - Ve a https://github.com/new
   - Nombre: `trello-plotcenter` (o el que quieras)
   - Creá el repo (público o privado)

2. **Inicializá Git en tu proyecto** (si no lo hiciste):
   ```powershell
   git init
   git add .
   git commit -m "Initial commit - Supabase migration"
   ```

3. **Conectá con GitHub**:
   ```powershell
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git branch -M main
   git push -u origin main
   ```

### Paso 2: Deploy en Vercel

1. **Ve a https://vercel.com**
2. **Iniciá sesión** (con GitHub, Google, etc.)
3. **Hacé clic en "Add New Project"**
4. **Importá tu repositorio** de GitHub
5. **Configurá el proyecto**:
   - **Framework Preset**: Vite (debería detectarlo automáticamente)
   - **Root Directory**: `./` (raíz)
   - **Build Command**: `npm run build` (ya está configurado)
   - **Output Directory**: `dist` (ya está configurado)

6. **⚠️ IMPORTANTE: Configurá las Variables de Entorno**:
   
   Antes de hacer clic en "Deploy", hacé clic en **"Environment Variables"** y agregá:
   
   | Variable | Valor |
   |----------|-------|
   | `VITE_SUPABASE_URL` | `https://tu-proyecto.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `tu-anon-key-de-supabase` |
   | `VITE_SUPABASE_SCHEMA` | `public` (o `u956355532_tg` si usás ese schema) |
   
   **Marcá las 3 opciones**: Production, Preview, Development
   
   **Dónde encontrar las keys de Supabase**:
   - Ve a tu proyecto en https://app.supabase.com
   - Settings → API
   - Copiá "Project URL" y "anon public" key

7. **Hacé clic en "Deploy"**
8. **Esperá 1-2 minutos** mientras se construye
9. **¡Listo!** Tu app estará en `https://tu-proyecto.vercel.app`

---

## Opción 2: Deploy Manual (Sin Git)

### Paso 1: Compilá el proyecto

```powershell
npm run build
```

### Paso 2: Subí a Vercel

1. **Ve a https://vercel.com**
2. **Iniciá sesión**
3. **Hacé clic en "Add New Project"**
4. **Seleccioná "Deploy" → "Browse"**
5. **Arrastrá la carpeta `dist/`** completa
6. **Configurá las variables de entorno** (igual que arriba)
7. **Deploy**

**⚠️ Nota**: Con este método, cada cambio requiere volver a compilar y subir manualmente.

---

## Opción 3: Vercel CLI (si el login funcionó)

Si ya te logueaste en Vercel CLI:

```powershell
vercel --prod
```

Seguí las instrucciones que te aparezcan.

---

## ✅ Verificación Post-Deploy

1. **Visitá la URL** que Vercel te dio
2. **Verificá que aparezca la pantalla de login**
3. **Probá hacer login** con un usuario de prueba
4. **Revisá la consola del navegador** (F12) por errores

---

## 🔧 Si algo no funciona

### Error: "Supabase no está configurado"
- Verificá que las variables de entorno estén en Vercel
- Hacé un **Redeploy** después de agregar variables

### Error: "404 en las rutas"
- Verificá que `vercel.json` esté en el proyecto (ya está ✅)

### Error: "Build failed"
- Revisá los logs en Vercel
- Probá `npm run build` localmente primero

---

## 📝 Checklist

- [ ] Proyecto compilado (`npm run build` funciona)
- [ ] Variables de Supabase configuradas en Vercel
- [ ] Tablas creadas en Supabase (ejecutaste `schema.sql` y `materiales_seed.sql`)
- [ ] Deploy completado
- [ ] App funcionando en la URL de Vercel

---

**¿Necesitás ayuda con algún paso?** Decime en qué parte estás y te ayudo.

