# 🔧 Configurar Base de Datos en Hostinger

## ⚠️ Error: "Error de conexión a la base de datos"

Este error significa que el archivo `database.php` no puede conectarse a la base de datos MySQL.

## ✅ Solución: Editar database.php directamente

En Hostinger, generalmente no se pueden usar archivos `.env`, así que debes editar el archivo `database.php` directamente.

### Paso 1: Obtener tus credenciales de Hostinger

1. **Accede a tu panel de Hostinger**
2. **Ve a "Bases de datos MySQL"**
3. **Encuentra tu base de datos** `u956355532_tg`
4. **Anota estas credenciales:**
   - **Host**: Generalmente `localhost` o `127.0.0.1`
   - **Base de datos**: `u956355532_tg`
   - **Usuario**: `u956355532_tallerg`
   - **Contraseña**: Tu contraseña de la base de datos

### Paso 2: Editar database.php

1. **Abre el archivo** `public_html/api/config/database.php` en Hostinger
2. **Busca esta línea** (alrededor de la línea 30):
   ```php
   $password = ''; // ← EDITA ESTO: Pon tu contraseña de BD aquí
   ```
3. **Reemplaza** `''` con tu contraseña real:
   ```php
   $password = 'tu_contraseña_real_aqui';
   ```

### Paso 3: Verificar otros valores

Asegúrate de que estos valores sean correctos:

```php
$host = 'localhost'; // Generalmente 'localhost' en Hostinger
$dbname = 'u956355532_tg'; // Tu nombre de base de datos
$username = 'u956355532_tallerg'; // Tu usuario de BD
$password = 'tu_contraseña_real'; // ← ESTO ES LO MÁS IMPORTANTE
```

### Paso 4: Guardar y probar

1. **Guarda el archivo** en Hostinger
2. **Prueba la API** nuevamente:
   ```
   https://trello.plotcenter.com.ar/api/auth/login.php
   ```

## 🔍 Verificar que la base de datos existe

1. **Accede a phpMyAdmin** en Hostinger
2. **Verifica que la base de datos** `u956355532_tg` existe
3. **Verifica que la tabla** `usuarios` existe:
   ```sql
   SHOW TABLES;
   SELECT * FROM usuarios LIMIT 1;
   ```

## 🐛 Errores Comunes

### Error: "Access denied for user"

**Causa:** Usuario o contraseña incorrectos

**Solución:**
1. Verifica las credenciales en el panel de Hostinger
2. Asegúrate de copiar la contraseña exactamente (sin espacios)
3. Verifica que el usuario tenga permisos en la base de datos

### Error: "Unknown database"

**Causa:** El nombre de la base de datos es incorrecto

**Solución:**
1. Verifica el nombre exacto de la base de datos en phpMyAdmin
2. Asegúrate de que coincida exactamente en `database.php`

### Error: "Connection refused" o "Can't connect to MySQL server"

**Causa:** El host es incorrecto

**Solución:**
1. En Hostinger, generalmente es `localhost`
2. Si no funciona, prueba con `127.0.0.1`
3. Verifica en el panel de Hostinger cuál es el host correcto

## 📝 Ejemplo de database.php configurado

```php
<?php
function getDatabaseConnection() {
    static $db = null;
    
    if ($db === null) {
        // ⚠️ EDITA ESTOS VALORES CON TUS CREDENCIALES
        $host = 'localhost';
        $dbname = 'u956355532_tg';
        $username = 'u956355532_tallerg';
        $password = 'TU_CONTRASEÑA_AQUI'; // ← Cambia esto
        
        try {
            $db = new PDO(
                "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
                $username,
                $password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }
    }
    
    return $db;
}
```

## ✅ Checklist

- [ ] Credenciales obtenidas del panel de Hostinger
- [ ] Archivo `database.php` editado con la contraseña correcta
- [ ] Base de datos existe en phpMyAdmin
- [ ] Tabla `usuarios` existe
- [ ] API probada y funcionando

## 🆘 Si sigue sin funcionar

1. **Verifica los logs de error de PHP** en Hostinger
2. **Prueba conectarte desde phpMyAdmin** con las mismas credenciales
3. **Contacta soporte de Hostinger** si las credenciales no funcionan







