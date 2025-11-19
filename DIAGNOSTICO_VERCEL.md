# 🔍 Diagnóstico de Conexión - Vercel

## ⚠️ Problema: Variables de Entorno no Funcionan

Si subiste las variables pero nada está conectado, sigue estos pasos:

## ✅ Paso 1: Verificar Variables en Vercel

1. **Ve a tu proyecto en Vercel Dashboard**
2. **Settings → Environment Variables**
3. **Verifica que tengas estas variables:**
   - `VITE_API_BASE_URL` = `https://trello.plotcenter.com.ar/api`
   - `VITE_GEMINI_API_KEY` = `tu_api_key_aqui`

4. **⚠️ IMPORTANTE:** Asegúrate de que estén configuradas para:
   - ✅ **Production**
   - ✅ **Preview** 
   - ✅ **Development**

## ✅ Paso 2: Hacer un Nuevo Deploy

**Las variables de entorno solo se aplican en nuevos deploys.**

1. **Opción A: Desde el Dashboard**
   - Ve a "Deployments"
   - Haz clic en los 3 puntos del último deployment
   - Selecciona "Redeploy"
   - ✅ **Marca la casilla "Use existing Build Cache"** (opcional)

2. **Opción B: Desde Git**
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

## ✅ Paso 3: Verificar en el Build

1. **Ve a tu deployment en Vercel**
2. **Haz clic en el deployment**
3. **Ve a "Build Logs"**
4. **Busca las variables de entorno** (deberían aparecer en el build)

## ✅ Paso 4: Verificar en el Navegador

1. **Abre tu app desplegada en Vercel**
2. **Abre la consola del navegador** (F12)
3. **Ve a la pestaña "Console"**
4. **Escribe esto y presiona Enter:**
   ```javascript
   console.log('API URL:', import.meta.env.VITE_API_BASE_URL)
   console.log('Gemini Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Configurada' : 'NO CONFIGURADA')
   ```

**Si muestra `undefined` o valores incorrectos:**
- Las variables no se están cargando
- Necesitas hacer un nuevo deploy

## ✅ Paso 5: Verificar la API

1. **Abre la consola del navegador** (F12)
2. **Ve a la pestaña "Network"**
3. **Intenta hacer login**
4. **Busca el request a `/api/auth/login.php`**
5. **Verifica:**
   - ✅ La URL debe ser: `https://trello.plotcenter.com.ar/api/auth/login.php`
   - ✅ Si es otra URL, las variables no están funcionando

## ✅ Paso 6: Verificar CORS

Si ves errores de CORS:

1. **Verifica que `.htaccess` en Hostinger tenga:**
   ```apache
   Header always set Access-Control-Allow-Origin "*"
   ```

2. **O si quieres ser más específico, agrega tu dominio de Vercel:**
   ```apache
   Header always set Access-Control-Allow-Origin "https://tu-app.vercel.app"
   ```

## 🐛 Errores Comunes

### Error: "Failed to fetch"

**Causas:**
1. La URL de la API está mal configurada
2. CORS no está configurado
3. La API no está respondiendo

**Solución:**
1. Verifica la URL en la consola del navegador
2. Prueba la API directamente: `https://trello.plotcenter.com.ar/api/auth/login.php`
3. Verifica CORS en `.htaccess`

### Error: Variables son `undefined`

**Causa:** Las variables no se aplicaron en el build

**Solución:**
1. Verifica que las variables estén en Vercel
2. Haz un nuevo deploy
3. Verifica que el build use las variables

### Error: "Network Error" o "CORS Error"

**Causa:** CORS no configurado o URL incorrecta

**Solución:**
1. Verifica `.htaccess` en Hostinger
2. Verifica que la URL de la API sea correcta
3. Prueba la API directamente con curl o Postman

## 🔧 Solución Rápida

Si nada funciona, prueba esto:

1. **Elimina las variables de entorno en Vercel**
2. **Vuelve a agregarlas** (copiando y pegando cuidadosamente)
3. **Haz un nuevo deploy**
4. **Verifica en la consola del navegador**

## 📝 Checklist de Verificación

- [ ] Variables configuradas en Vercel (Production, Preview, Development)
- [ ] Nuevo deploy realizado después de agregar variables
- [ ] Build logs muestran las variables
- [ ] Consola del navegador muestra las variables correctas
- [ ] Network tab muestra requests a la URL correcta
- [ ] API responde correctamente
- [ ] CORS configurado en `.htaccess`

## 🆘 Si Nada Funciona

1. **Verifica la URL de la API directamente:**
   ```
   https://trello.plotcenter.com.ar/api/auth/login.php
   ```
   Debe mostrar un error JSON, no un 404

2. **Prueba con curl:**
   ```bash
   curl -X POST https://trello.plotcenter.com.ar/api/auth/login.php \
     -H "Content-Type: application/json" \
     -d '{"usuario":"Admin","password":"tu_password"}'
   ```

3. **Revisa los logs de Vercel:**
   - Ve a tu deployment
   - Revisa "Function Logs" o "Build Logs"
   - Busca errores

4. **Contacta soporte:**
   - Comparte capturas de pantalla de:
     - Variables de entorno en Vercel
     - Consola del navegador
     - Network tab
     - Errores específicos

