# 🔧 Solución de Problemas - Trello Plot

## ✅ Cambios Realizados

### 1. **Sistema de Autenticación Integrado**
- ✅ Login integrado en `App.tsx`
- ✅ La app muestra el login si no hay usuario autenticado
- ✅ Botón de logout en el header
- ✅ Manejo de estado de autenticación

### 2. **Archivo .htaccess Creado**
- ✅ Creado `backend/api/.htaccess` con configuración CORS
- ✅ Configuración de PHP para archivos grandes

### 3. **Mejoras en Manejo de Errores**
- ✅ Mejor manejo de errores en `api.ts`
- ✅ Mensajes de error más descriptivos

## 🐛 Problemas Comunes y Soluciones

### Error: "No se puede conectar a la API"

**Causas posibles:**
1. El backend no está en la ruta correcta
2. CORS no está configurado
3. El archivo `.htaccess` no está en `public_html/api/`

**Solución:**
1. Verifica que los archivos estén en `public_html/api/` en Hostinger
2. Asegúrate de que `backend/api/.htaccess` esté subido
3. Prueba la URL directamente: `https://trello.plotcenter.com.ar/api/auth/login.php`

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solución:**
1. Verifica que `.htaccess` esté en `public_html/api/`
2. Asegúrate de que el servidor tenga el módulo `mod_headers` habilitado
3. Si usas Hostinger, contacta soporte para habilitar `mod_headers`

### Error: "Credenciales inválidas"

**Causas posibles:**
1. Usuario o contraseña incorrectos
2. La contraseña en la BD no está hasheada con `password_hash()`
3. El campo en la BD se llama diferente

**Solución:**
1. Verifica que el usuario exista en la tabla `usuarios`
2. Asegúrate de que las contraseñas estén hasheadas:
   ```sql
   UPDATE usuarios SET password_hash = PASSWORD('tu_password') WHERE nombre = 'Admin';
   ```
   O mejor, usa PHP:
   ```php
   $hash = password_hash('tu_password', PASSWORD_DEFAULT);
   ```

### Error: "404 Not Found" al acceder a la API

**Solución:**
1. Verifica la estructura de carpetas en Hostinger:
   ```
   public_html/
   └── api/
       ├── .htaccess
       ├── config/
       │   ├── database.php
       │   └── auth.php
       ├── auth/
       │   └── login.php
       ├── ordenes.php
       └── ...
   ```
2. Prueba accediendo directamente: `https://trello.plotcenter.com.ar/api/auth/login.php`

### Error: "Failed to fetch" o "Network error"

**Causas posibles:**
1. El servidor no responde
2. Problema de red
3. SSL/HTTPS no configurado

**Solución:**
1. Verifica que el dominio tenga SSL activo
2. Prueba con curl:
   ```bash
   curl -X POST https://trello.plotcenter.com.ar/api/auth/login.php \
     -H "Content-Type: application/json" \
     -d '{"usuario":"Admin","password":"tu_password"}'
   ```

## 📋 Checklist de Verificación

### Backend (Hostinger)
- [ ] Archivos PHP en `public_html/api/`
- [ ] Archivo `.htaccess` en `public_html/api/`
- [ ] Archivo `.env` o variables de entorno configuradas
- [ ] Base de datos conectada
- [ ] Usuarios en la tabla `usuarios` con contraseñas hasheadas
- [ ] SSL/HTTPS activo

### Frontend (Local/Vercel)
- [ ] Archivo `.env` con `VITE_API_BASE_URL=https://trello.plotcenter.com.ar/api`
- [ ] `npm run dev` funciona sin errores
- [ ] El login se muestra correctamente
- [ ] Puedes hacer login con un usuario válido

### Pruebas
- [ ] Login funciona: `POST https://trello.plotcenter.com.ar/api/auth/login.php`
- [ ] Obtener órdenes funciona: `GET https://trello.plotcenter.com.ar/api/ordenes.php`
- [ ] CORS permite requests desde el frontend
- [ ] El token se guarda en localStorage

## 🔍 Cómo Probar

### 1. Probar la API directamente

Abre `test-api.html` en tu navegador o usa curl:

```bash
# Login
curl -X POST https://trello.plotcenter.com.ar/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"usuario":"Admin","password":"tu_password"}'

# Obtener órdenes (requiere token)
curl -X GET https://trello.plotcenter.com.ar/api/ordenes.php \
  -H "Authorization: Bearer tu_token_aqui"
```

### 2. Probar desde el Frontend

1. Ejecuta `npm run dev`
2. Abre la consola del navegador (F12)
3. Intenta hacer login
4. Revisa los errores en la consola

### 3. Verificar en la Consola del Navegador

Abre las DevTools (F12) y revisa:
- **Console**: Errores de JavaScript
- **Network**: Requests a la API y sus respuestas
- **Application**: localStorage (debe tener `usuario` y `auth_token`)

## 📞 Si Nada Funciona

1. **Verifica la URL de la API:**
   - Abre `https://trello.plotcenter.com.ar/api/auth/login.php` en el navegador
   - Debe mostrar un error JSON, no un 404

2. **Revisa los logs del servidor:**
   - En Hostinger, revisa los logs de error de PHP
   - Busca errores de conexión a la BD

3. **Prueba con Postman:**
   - Crea un request POST a `https://trello.plotcenter.com.ar/api/auth/login.php`
   - Body: `{"usuario":"Admin","password":"tu_password"}`
   - Headers: `Content-Type: application/json`

4. **Contacta soporte:**
   - Si el problema persiste, comparte:
     - URL exacta que estás usando
     - Mensaje de error completo
     - Respuesta de la API (si hay)

