# 🚀 Guía de Implementación Completa - Trello Plot

## 📋 Resumen Ejecutivo

Esta guía te llevará paso a paso para poner en producción el sistema Trello Plot, conectando el frontend React con el backend PHP y la base de datos MySQL en **trello.plotcenter.com.ar**.

## 🎯 Objetivo

Conectar la aplicación frontend (React) con el backend real (PHP/MySQL) para que funcione con datos reales en producción, incluyendo autenticación completa y todas las funcionalidades.

---

## 🌐 Configuración del Dominio

**Dominio configurado:** `trello.plotcenter.com.ar`

- **Backend API**: `https://trello.plotcenter.com.ar/api`
- **Frontend**: Se puede servir desde el mismo dominio o desde Vercel

---

## 📦 PARTE 1: Preparación del Backend en Hostinger

### 1.1 Estructura de Archivos en Hostinger

Los archivos deben estar en la siguiente estructura:

```
public_html/
└── api/
    ├── .htaccess                    ← IMPORTANTE: Debe estar aquí
    ├── config/
    │   ├── database.php
    │   ├── auth.php
    │   └── .env                     ← Variables de entorno (opcional)
    ├── auth/
    │   └── login.php
    ├── ordenes.php
    ├── ordenes/
    │   └── mover.php
    ├── historial.php
    ├── usuarios.php
    ├── estadisticas.php
    ├── chat/
    │   ├── mensajes.php
    │   ├── zumbido.php
    │   └── alerta.php
    └── archivos/
        └── subir.php
```

### 1.2 Subir Archivos PHP

1. **Accede a tu panel de Hostinger** → File Manager
2. **Navega a `public_html`**
3. **Crea la carpeta `api`** si no existe
4. **Sube todos los archivos** de la carpeta `backend/api/`:
   - Todos los archivos `.php`
   - El archivo `.htaccess` (muy importante)
   - Mantén la estructura de carpetas (`config/`, `auth/`, `chat/`, etc.)

### 1.3 Configurar el Archivo .htaccess

El archivo `backend/api/.htaccess` ya está creado y configurado. Asegúrate de que esté en `public_html/api/.htaccess` con este contenido:

```apache
# Configuración para API REST
RewriteEngine On
RewriteBase /api/

# Habilitar CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Manejar OPTIONS para CORS
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# Redirigir a index.php si el archivo no existe
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Configuración de PHP
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value max_execution_time 300
php_value max_input_time 300
```

**⚠️ IMPORTANTE:** Si Hostinger no permite `Header always set`, contacta a soporte para habilitar el módulo `mod_headers`.

### 1.4 Configurar Variables de Entorno

#### Opción A: Usar archivo .env (si Hostinger lo soporta)

Crea `public_html/api/config/.env`:

```env
DB_HOST=localhost
DB_NAME=u956355532_tg
DB_USER=u956355532_tallerg
DB_PASS=tu_password_real_de_hostinger
JWT_SECRET=genera-una-clave-segura-aqui
FRONTEND_URL=https://trello.plotcenter.com.ar
```

#### Opción B: Editar directamente database.php

Si Hostinger no soporta `.env`, edita `public_html/api/config/database.php` directamente:

```php
$host = 'localhost';
$dbname = 'u956355532_tg';
$username = 'u956355532_tallerg';
$password = 'tu_password_real';
```

### 1.5 Verificar Base de Datos

1. **Accede a phpMyAdmin** en Hostinger
2. **Verifica que la base de datos** `u956355532_tg` existe
3. **Verifica que las tablas** estén creadas:
   - `ordenes_trabajo`
   - `historial_movimientos`
   - `usuarios`
   - `chat_messages`
   - etc.

4. **Verifica usuarios en la tabla `usuarios`**:
   ```sql
   SELECT * FROM usuarios;
   ```

5. **Asegúrate de que las contraseñas estén hasheadas**:
   ```sql
   -- Verificar si hay contraseñas hasheadas
   SELECT id, nombre, password_hash FROM usuarios LIMIT 1;
   ```
   
   Si las contraseñas no están hasheadas, actualízalas:
   ```php
   // Ejecuta esto en PHP o crea un script temporal
   $hash = password_hash('tu_password', PASSWORD_DEFAULT);
   // Luego actualiza en la BD
   ```

### 1.6 Probar la API

#### Prueba 1: Verificar que la API responde

Abre en tu navegador:
```
https://trello.plotcenter.com.ar/api/auth/login.php
```

**Debe mostrar:**
- Un error JSON (no un 404)
- Algo como: `{"success":false,"error":"Método no permitido"}` (si haces GET)
- O un error de conexión a BD (si las credenciales están mal)

**Si muestra 404:**
- Verifica que los archivos estén en `public_html/api/`
- Verifica que `.htaccess` esté en `public_html/api/.htaccess`

#### Prueba 2: Probar el login

Usa `test-api.html` o curl:

```bash
curl -X POST https://trello.plotcenter.com.ar/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"usuario":"Admin","password":"tu_password"}'
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

---

## 🎨 PARTE 2: Configurar Frontend

### 2.1 Variables de Entorno

Crea/edita el archivo `.env` en la raíz del proyecto:

```env
VITE_API_BASE_URL=https://trello.plotcenter.com.ar/api
VITE_GEMINI_API_KEY=tu_api_key_de_gemini
```

**⚠️ IMPORTANTE:**
- El archivo `.env` NO debe subirse a Git (ya está en `.gitignore`)
- En Vercel, configura estas variables en Settings → Environment Variables

**Obtén tu API Key de Gemini:**
1. Ve a https://makersuite.google.com/app/apikey
2. Crea una nueva API key
3. Cópiala en `.env`

### 2.2 Sistema de Autenticación

El sistema de autenticación ya está integrado en `App.tsx`. La aplicación:

1. **Muestra el login** si no hay usuario autenticado
2. **Guarda el token** en `localStorage` después del login
3. **Muestra el tablero** si hay usuario autenticado
4. **Permite cerrar sesión** con el botón "🚪 Salir" en el header

### 2.3 Probar Localmente

1. **Instala dependencias** (si no lo has hecho):
   ```bash
   npm install
   ```

2. **Ejecuta el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

3. **Abre el navegador** en la URL que muestra (generalmente `http://localhost:5173`)

4. **Deberías ver la pantalla de login**

5. **Intenta hacer login** con un usuario válido de tu base de datos

6. **Verifica en la consola del navegador** (F12):
   - **Console**: No debe haber errores
   - **Network**: Debe mostrar requests a `https://trello.plotcenter.com.ar/api/auth/login.php`
   - **Application → Local Storage**: Debe tener `usuario` y `auth_token` después del login

### 2.4 Integrar Datos Reales (Opcional)

Actualmente la app usa datos mock. Para usar datos reales de la API:

1. **Crea/actualiza el hook `useApiData`** (ya existe en `src/hooks/useApiData.ts`)

2. **Actualiza `App.tsx`** para usar datos reales:
   ```typescript
   import { useApiData } from './hooks/useApiData'
   
   function App() {
     const { tasks, activity, teamMembers, loading, error, setTasks, setActivity } = useApiData()
     // ... resto del código
   }
   ```

---

## 🚀 PARTE 3: Deployment

### 3.1 Frontend en Vercel (Recomendado)

#### Paso 1: Preparar el Repositorio

1. **Asegúrate de que tu código esté en GitHub/GitLab**
2. **Verifica que `.env` esté en `.gitignore`** (no debe subirse)

#### Paso 2: Conectar a Vercel

1. **Ve a [vercel.com](https://vercel.com)**
2. **Importa proyecto** desde GitHub
3. **Selecciona tu repositorio** `plotrello` o el nombre que tengas

#### Paso 3: Configurar Build

Vercel debería detectar automáticamente Vite, pero verifica:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### Paso 4: Configurar Variables de Entorno

En Vercel, ve a **Settings → Environment Variables** y agrega:

```
VITE_API_BASE_URL = https://trello.plotcenter.com.ar/api
VITE_GEMINI_API_KEY = tu_api_key_de_gemini
```

**⚠️ IMPORTANTE:** 
- Agrega estas variables para **Production**, **Preview** y **Development**
- Haz clic en "Save" después de agregar cada variable

#### Paso 5: Deploy

1. **Haz clic en "Deploy"**
2. **Espera a que termine el build**
3. **Verifica que el deploy sea exitoso**

#### Paso 6: Configurar Dominio Personalizado (Opcional)

Si quieres usar `trello.plotcenter.com.ar` para el frontend también:

1. En Vercel, ve a **Settings → Domains**
2. Agrega `trello.plotcenter.com.ar`
3. Configura los DNS según las instrucciones de Vercel

### 3.2 Actualizar CORS en Backend

Si desplegaste el frontend en Vercel, actualiza `.htaccess` en Hostinger:

```apache
# Reemplaza la línea de Access-Control-Allow-Origin
Header always set Access-Control-Allow-Origin "https://tu-app.vercel.app"
```

O si quieres permitir ambos:

```apache
# Permite múltiples orígenes (requiere lógica adicional en PHP)
Header always set Access-Control-Allow-Origin "*"
```

### 3.3 Frontend en el Mismo Dominio (Alternativa)

Si prefieres servir el frontend desde el mismo dominio:

1. **Compila el frontend**:
   ```bash
   npm run build
   ```

2. **Sube la carpeta `dist/`** a `public_html/` en Hostinger

3. **Configura `.htaccess`** en `public_html/` para redirigir a `index.html`:
   ```apache
   RewriteEngine On
   RewriteBase /
   RewriteRule ^api/ - [L]
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

---

## ✅ PARTE 4: Verificación y Pruebas

### 4.1 Checklist de Verificación

#### Backend (Hostinger)
- [ ] Archivos PHP subidos a `public_html/api/`
- [ ] Archivo `.htaccess` en `public_html/api/`
- [ ] Estructura de carpetas correcta (`config/`, `auth/`, `chat/`, etc.)
- [ ] Variables de entorno configuradas (`.env` o en `database.php`)
- [ ] Base de datos conectada y funcionando
- [ ] Usuarios en la tabla `usuarios` con contraseñas hasheadas
- [ ] SSL/HTTPS activo en el dominio
- [ ] API responde en `https://trello.plotcenter.com.ar/api/auth/login.php`

#### Frontend (Local/Vercel)
- [ ] Archivo `.env` con `VITE_API_BASE_URL=https://trello.plotcenter.com.ar/api`
- [ ] Variables de entorno configuradas en Vercel (si aplica)
- [ ] `npm run dev` funciona sin errores
- [ ] El login se muestra correctamente
- [ ] Puedes hacer login con un usuario válido
- [ ] El token se guarda en localStorage
- [ ] El tablero se muestra después del login

### 4.2 Pruebas Funcionales

#### Prueba 1: Login
1. Abre la aplicación
2. Debe mostrarse la pantalla de login
3. Ingresa usuario y contraseña válidos
4. Debe redirigir al tablero
5. Verifica en DevTools → Application → Local Storage:
   - `usuario`: Debe tener los datos del usuario
   - `auth_token`: Debe tener el token JWT

#### Prueba 2: Carga de Datos
1. Después del login, verifica que:
   - Las órdenes se cargan (si usas `useApiData`)
   - Los usuarios se cargan
   - El historial se carga

#### Prueba 3: Movimiento de Órdenes
1. Arrastra una orden entre columnas
2. Verifica que se guarda en la BD
3. Verifica que aparece en el historial

#### Prueba 4: Chat
1. Ve a la página de Chat
2. Envía un mensaje
3. Envía un zumbido
4. Envía una alerta

#### Prueba 5: Estadísticas (Solo Admin)
1. Si eres administrador, ve a Estadísticas
2. Verifica que se carguen los datos
3. Si no eres admin, verifica que no puedas acceder

### 4.3 Pruebas de API Directas

Usa `test-api.html` o curl para probar:

```bash
# 1. Login
curl -X POST https://trello.plotcenter.com.ar/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"usuario":"Admin","password":"tu_password"}'

# 2. Obtener órdenes (requiere token)
curl -X GET https://trello.plotcenter.com.ar/api/ordenes.php \
  -H "Authorization: Bearer tu_token_aqui"

# 3. Obtener usuarios
curl -X GET https://trello.plotcenter.com.ar/api/usuarios.php \
  -H "Authorization: Bearer tu_token_aqui"
```

---

## 🐛 PARTE 5: Solución de Problemas

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
4. Alternativa: Agrega headers CORS directamente en cada archivo PHP

### Error: "Credenciales inválidas"

**Causas posibles:**
1. Usuario o contraseña incorrectos
2. La contraseña en la BD no está hasheada con `password_hash()`
3. El campo en la BD se llama diferente

**Solución:**
1. Verifica que el usuario exista en la tabla `usuarios`
2. Asegúrate de que las contraseñas estén hasheadas:
   ```php
   // Crea un script temporal: hash_password.php
   <?php
   $hash = password_hash('tu_password', PASSWORD_DEFAULT);
   echo $hash;
   // Luego actualiza en la BD
   UPDATE usuarios SET password_hash = '$hash' WHERE nombre = 'Admin';
   ```

### Error: "404 Not Found" al acceder a la API

**Solución:**
1. Verifica la estructura de carpetas en Hostinger
2. Prueba accediendo directamente: `https://trello.plotcenter.com.ar/api/auth/login.php`
3. Verifica que `.htaccess` esté en la carpeta correcta

### Error: "Failed to fetch" o "Network error"

**Causas posibles:**
1. El servidor no responde
2. Problema de red
3. SSL/HTTPS no configurado

**Solución:**
1. Verifica que el dominio tenga SSL activo
2. Prueba con curl (ver sección 4.3)
3. Verifica los logs de error de PHP en Hostinger

### Error: "Database connection error"

**Solución:**
1. Verifica las credenciales en `database.php` o `.env`
2. Verifica que la base de datos exista
3. Verifica que el usuario de BD tenga permisos
4. Revisa los logs de error de PHP en Hostinger

---

## 📞 Soporte y Recursos Adicionales

### Documentos Relacionados

- **`CONFIGURACION_DOMINIO.md`**: Configuración específica del dominio
- **`SOLUCION_PROBLEMAS.md`**: Guía detallada de troubleshooting
- **`VERIFICACION_API.md`**: Pasos para verificar la API
- **`test-api.html`**: Herramienta para probar la API desde el navegador

### Cómo Obtener Ayuda

1. **Revisa los logs de error**:
   - Frontend: Consola del navegador (F12)
   - Backend: Logs de PHP en Hostinger

2. **Verifica la configuración**:
   - Variables de entorno
   - Estructura de archivos
   - Credenciales de BD

3. **Prueba los endpoints directamente**:
   - Usa `test-api.html` o curl
   - Verifica las respuestas de la API

4. **Contacta soporte**:
   - Si el problema persiste, comparte:
     - URL exacta que estás usando
     - Mensaje de error completo
     - Respuesta de la API (si hay)
     - Capturas de pantalla de la consola

---

## 🎉 ¡Listo!

Una vez completados todos los pasos y verificaciones, tu aplicación estará funcionando en producción con:

- ✅ Autenticación completa
- ✅ Conexión a base de datos real
- ✅ API funcionando
- ✅ Frontend desplegado
- ✅ Todas las funcionalidades operativas

**URLs importantes:**
- **API**: `https://trello.plotcenter.com.ar/api`
- **Frontend**: Tu URL de Vercel o `https://trello.plotcenter.com.ar` (si lo serviste desde Hostinger)

---

## 📝 Notas Finales

- **Seguridad**: En producción, considera usar variables de entorno seguras y no exponer credenciales
- **Backups**: Haz backups regulares de la base de datos
- **Monitoreo**: Considera implementar logging y monitoreo de errores
- **Actualizaciones**: Mantén las dependencias actualizadas

¡Buena suerte con tu implementación! 🚀
