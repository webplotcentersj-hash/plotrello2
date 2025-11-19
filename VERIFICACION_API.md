# ✅ Verificación de API - Hostinger

## 🔍 Paso 1: Verificar que la API esté funcionando

### 1.1 Probar el endpoint de login

Abre tu navegador o usa Postman/curl y prueba:

```
POST https://trello.plotcenter.com.ar/api/auth/login.php
Content-Type: application/json

{
  "usuario": "Admin",
  "password": "tu_password"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "usuario": {
      "id": 1,
      "nombre": "Admin",
      "rol": "administracion"
    }
  }
}
```

### 1.2 Verificar errores comunes

Si obtienes un error, verifica:

#### Error 500 (Internal Server Error)
- ✅ Verifica que el archivo `.env` esté en `api/config/`
- ✅ Verifica las credenciales de la base de datos
- ✅ Revisa los logs de error de PHP en Hostinger

#### Error 404 (Not Found)
- ✅ Verifica que los archivos estén en la carpeta correcta: `public_html/api/`
- ✅ Verifica que `.htaccess` esté en la carpeta `api/`

#### Error de CORS
- ✅ Verifica que `.htaccess` tenga los headers CORS configurados
- ✅ Verifica que los headers estén en cada archivo PHP

### 1.3 Probar otros endpoints (después de login)

1. **Obtener usuarios** (requiere token):
```
GET https://trello.plotcenter.com.ar/api/usuarios.php
Headers:
  Authorization: Bearer tu_token_aqui
```

2. **Obtener órdenes**:
```
GET https://trello.plotcenter.com.ar/api/ordenes.php
Headers:
  Authorization: Bearer tu_token_aqui
```

## 🔧 Paso 2: Configurar Variables de Entorno

### 2.1 En el Frontend (Local)

Crea/edita el archivo `.env` en la raíz del proyecto:

```env
VITE_API_BASE_URL=https://trello.plotcenter.com.ar/api
VITE_GEMINI_API_KEY=tu_api_key_de_gemini
```

**⚠️ IMPORTANTE:** Reemplaza `tu-dominio.hostinger.com` con tu dominio real.

### 2.2 En Vercel (Producción)

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - `VITE_API_BASE_URL` = `https://trello.plotcenter.com.ar/api`
   - `VITE_GEMINI_API_KEY` = `tu_api_key_de_gemini`

## 🧪 Paso 3: Probar la Conexión desde el Frontend

### 3.1 Modo Desarrollo

1. Asegúrate de que `.env` esté configurado
2. Inicia el servidor de desarrollo:
```bash
npm run dev
```

3. Abre la consola del navegador (F12)
4. Intenta hacer login
5. Verifica que no haya errores de CORS o conexión

### 3.2 Verificar en la Consola

Deberías ver en la consola:
- ✅ Requests a la API
- ✅ Respuestas exitosas
- ❌ Si hay errores, aparecerán aquí

## 🔐 Paso 4: Verificar Autenticación

### 4.1 Probar Login

1. Abre la aplicación
2. Intenta hacer login con un usuario válido
3. Verifica que:
   - ✅ El token se guarde en `localStorage`
   - ✅ El usuario se guarde en `localStorage`
   - ✅ Redirija al tablero después del login

### 4.2 Verificar Permisos

1. **Con usuario administrador:**
   - ✅ Debe ver el botón "Estadísticas"
   - ✅ Debe poder acceder a `/statistics`

2. **Con usuario no administrador:**
   - ❌ No debe ver el botón "Estadísticas"
   - ❌ Debe ser redirigido si intenta acceder a `/statistics`

## 🐛 Solución de Problemas

### Problema: "CORS policy: No 'Access-Control-Allow-Origin'"

**Solución:**
1. Verifica que `.htaccess` esté en `public_html/api/`
2. Verifica que tenga:
```apache
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

### Problema: "401 Unauthorized"

**Solución:**
1. Verifica que el token se esté enviando en los headers
2. Verifica que el token no haya expirado
3. Intenta hacer login nuevamente

### Problema: "500 Internal Server Error"

**Solución:**
1. Revisa los logs de error de PHP en Hostinger
2. Verifica que las credenciales de BD sean correctas
3. Verifica que el archivo `.env` exista y tenga los valores correctos

### Problema: "Network Error" o "Failed to fetch"

**Solución:**
1. Verifica que la URL de la API sea correcta
2. Verifica que el servidor esté funcionando
3. Verifica que no haya firewall bloqueando las requests

## 📝 Checklist de Verificación

- [ ] API responde en `https://trello.plotcenter.com.ar/api/auth/login.php`
- [ ] Login funciona correctamente
- [ ] Token se genera y guarda correctamente
- [ ] Endpoints protegidos requieren token
- [ ] CORS está configurado correctamente
- [ ] Variables de entorno están configuradas
- [ ] Frontend puede conectarse a la API
- [ ] Permisos de administrador funcionan correctamente

## 🚀 Siguiente Paso

Una vez que todo esté verificado, puedes:
1. Desplegar el frontend en Vercel
2. Configurar las variables de entorno en Vercel
3. Probar la aplicación completa en producción

