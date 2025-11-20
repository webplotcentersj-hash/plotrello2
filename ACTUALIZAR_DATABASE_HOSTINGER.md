# ⚠️ IMPORTANTE: Actualizar database.php en Hostinger

## 🔐 Contraseña Configurada

La contraseña de la base de datos ha sido configurada localmente: `x2?5CLimwA`

## ✅ Pasos para Actualizar en Hostinger

### Paso 1: Acceder al archivo

1. **Accede a tu panel de Hostinger**
2. **Ve a "File Manager"**
3. **Navega a**: `public_html/api/config/`
4. **Abre el archivo**: `database.php`

### Paso 2: Editar la contraseña

1. **Busca esta línea** (alrededor de la línea 31):
   ```php
   $password = ''; // ← EDITA ESTO: Pon tu contraseña de BD aquí
   ```

2. **Reemplázala con**:
   ```php
   $password = 'x2?5CLimwA'; // Contraseña de la base de datos
   ```

3. **Guarda el archivo**

### Paso 3: Verificar

1. **Prueba la API**:
   ```
   https://trello.plotcenter.com.ar/api/auth/login.php
   ```

2. **Debería funcionar** sin el error de conexión

## 📋 Configuración Completa

El archivo `database.php` debe tener estos valores:

```php
$host = 'localhost';
$dbname = 'u956355532_tg';
$username = 'u956355532_tallerg';
$password = 'x2?5CLimwA'; // ← Esta es la línea que debes cambiar
```

## ✅ Checklist

- [ ] Archivo `database.php` abierto en Hostinger
- [ ] Contraseña actualizada a `x2?5CLimwA`
- [ ] Archivo guardado
- [ ] API probada y funcionando

## 🆘 Si sigue sin funcionar

1. **Verifica que la contraseña esté entre comillas simples**: `'x2?5CLimwA'`
2. **Verifica que no haya espacios** antes o después
3. **Verifica que la base de datos exista** en phpMyAdmin
4. **Revisa los logs de error** en Hostinger







