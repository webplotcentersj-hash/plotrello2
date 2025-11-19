# Guía de Deployment - Trello Plot

Esta guía te ayudará a desplegar la aplicación Trello Plot en producción.

## 📋 Requisitos Previos

- Cuenta en Vercel (para frontend)
- Hosting en Hostinger (para backend y base de datos)
- Base de datos MySQL/MariaDB configurada
- Acceso SSH/FTP a Hostinger
- Git configurado

## 🗄️ Paso 1: Configurar Base de Datos en Hostinger

1. **Accede a phpMyAdmin** en tu panel de Hostinger
2. **Importa el archivo SQL**:
   - Ve a la base de datos `u956355532_tg`
   - Haz clic en "Importar"
   - Selecciona el archivo `u956355532_tg (2).sql`
   - Haz clic en "Continuar"

3. **Verifica las tablas**:
   - Deberías ver tablas como: `ordenes_trabajo`, `historial_movimientos`, `usuarios`, `chat_messages`, etc.

## 🔧 Paso 2: Configurar Backend PHP en Hostinger

1. **Sube los archivos del backend**:
   ```
   backend/
   ├── api/
   │   ├── config/
   │   │   ├── database.php
   │   │   └── auth.php
   │   ├── ordenes.php
   │   ├── ordenes/
   │   │   └── mover.php
   │   ├── historial.php
   │   ├── usuarios.php
   │   ├── estadisticas.php
   │   ├── chat/
   │   │   ├── mensajes.php
   │   │   ├── zumbido.php
   │   │   └── alerta.php
   │   └── auth/
   │       └── login.php
   └── .htaccess
   ```

2. **Crea el archivo `.env`** en `backend/api/config/`:
   ```env
   DB_HOST=localhost
   DB_NAME=u956355532_tg
   DB_USER=u956355532_tallerg
   DB_PASS=tu_password_real
   JWT_SECRET=genera-una-clave-segura-aqui
   FRONTEND_URL=https://tu-app.vercel.app
   ```

3. **Configura permisos**:
   - Asegúrate de que los archivos PHP tengan permisos 644
   - Los directorios deben tener permisos 755

4. **Prueba la API**:
   - Visita: `https://tu-dominio.hostinger.com/api/usuarios.php`
   - Deberías ver un JSON con los usuarios (después de autenticarte)

## 🚀 Paso 3: Desplegar Frontend en Vercel

1. **Conecta tu repositorio de GitHub a Vercel**:
   - Ve a [vercel.com](https://vercel.com)
   - Importa el proyecto desde GitHub
   - Selecciona el repositorio `plotrello`

2. **Configura las variables de entorno** en Vercel:
   ```
   VITE_API_BASE_URL=https://tu-dominio.hostinger.com/api
   VITE_GEMINI_API_KEY=tu_api_key_de_gemini
   ```

3. **Configura el build**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Despliega**:
   - Haz clic en "Deploy"
   - Espera a que termine el build
   - Tu app estará disponible en `https://tu-app.vercel.app`

## 🔐 Paso 4: Configurar Autenticación

1. **Actualiza el frontend** para usar el servicio de API:
   - El servicio `src/services/api.ts` ya está configurado
   - Necesitas crear un componente de login

2. **Implementa el login**:
   ```typescript
   // Ejemplo de uso
   const response = await apiService.login('usuario', 'password')
   if (response.success) {
     // Usuario autenticado
   }
   ```

## 🔄 Paso 5: Integrar con el Backend Real

1. **Actualiza `App.tsx`** para usar la API real:
   ```typescript
   useEffect(() => {
     const loadData = async () => {
       const ordenes = await apiService.getOrdenes()
       const usuarios = await apiService.getUsuarios()
       const historial = await apiService.getHistorialMovimientos()
       // Actualizar estado
     }
     loadData()
   }, [])
   ```

2. **Actualiza las funciones de movimiento**:
   ```typescript
   const handleMoveTask = async (taskId: string, destination: TaskStatus) => {
     await apiService.moveOrden(taskId, destination, currentUserId)
     // Recargar datos
   }
   ```

## 📡 Paso 6: WebSockets para Tiempo Real (Opcional)

Para funcionalidades en tiempo real (chat, notificaciones):

1. **Instala Ratchet** en el servidor:
   ```bash
   composer require cboden/ratchet
   ```

2. **Crea un servidor WebSocket** (ver `backend/websocket/server.php`)

3. **Conecta el frontend** usando WebSocket API

## 🔒 Paso 7: Seguridad

1. **HTTPS**: Asegúrate de que tanto Vercel como Hostinger usen HTTPS
2. **CORS**: Configurado en `.htaccess` y en los archivos PHP
3. **JWT**: Los tokens expiran después de 24 horas
4. **Validación**: Todos los inputs deben ser validados en el backend
5. **SQL Injection**: Usar prepared statements (ya implementado)

## 🧪 Paso 8: Pruebas

1. **Prueba la autenticación**:
   - Login con usuario válido
   - Verificación de token

2. **Prueba CRUD de órdenes**:
   - Crear orden
   - Leer órdenes
   - Actualizar orden
   - Eliminar orden
   - Mover orden entre estados

3. **Prueba el chat**:
   - Enviar mensajes
   - Enviar zumbidos
   - Enviar alertas

4. **Prueba estadísticas**:
   - Verificar que los datos se cargan correctamente

## 📝 Notas Importantes

- **CORS**: El backend debe permitir requests desde tu dominio de Vercel
- **Base de datos**: Asegúrate de que las credenciales sean correctas
- **Variables de entorno**: Nunca subas el archivo `.env` al repositorio
- **Backup**: Haz backup regular de la base de datos
- **Logs**: Revisa los logs de error en Hostinger regularmente

## 🆘 Solución de Problemas

### Error de CORS
- Verifica que `.htaccess` esté configurado correctamente
- Asegúrate de que `FRONTEND_URL` en `.env` sea correcta

### Error de conexión a BD
- Verifica credenciales en `.env`
- Asegúrate de que el usuario de BD tenga permisos

### Error 500 en API
- Revisa los logs de error de PHP
- Verifica que todas las dependencias estén instaladas

## 📞 Soporte

Para más ayuda, consulta:
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Hostinger](https://www.hostinger.com/tutorials)
- [Documentación de PHP PDO](https://www.php.net/manual/es/book.pdo.php)

