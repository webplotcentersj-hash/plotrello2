# 📋 Instrucciones para Crear Tablas de Chat

## ⚠️ Problema Detectado

Estás intentando ejecutar código PHP como SQL. El error ocurre porque estás copiando código PHP (con comentarios `//`) directamente en phpMyAdmin.

## ✅ Solución

### Opción 1: Si NO tienes datos en chat_messages (Recomendado)

1. **Abre phpMyAdmin** en Hostinger
2. **Selecciona tu base de datos** `u956355532_tg`
3. **Ve a la pestaña "SQL"**
4. **Copia y pega SOLO el contenido del archivo `crear_tablas_chat.sql`**
5. **Haz clic en "Continuar"**

El archivo `crear_tablas_chat.sql` contiene **SOLO consultas SQL**, sin código PHP ni comentarios que causen problemas.

### Opción 2: Si YA tienes datos en chat_messages

Si ya tienes mensajes en la tabla antigua y quieres conservarlos:

1. **Haz un backup** de tu base de datos primero
2. **Ejecuta `migrar_chat_messages.sql`** paso a paso
3. **Verifica que los datos se migraron correctamente**
4. **Luego renombra las tablas** (instrucciones en el archivo)

## 📝 Estructura de Tablas Necesaria

### Tabla: `chat_messages`

La API espera esta estructura:

```sql
CREATE TABLE `chat_messages` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `canal` VARCHAR(100) NOT NULL DEFAULT 'general',
  `usuario_id` INT(11) NOT NULL,
  `contenido` TEXT NOT NULL,
  `tipo` VARCHAR(50) DEFAULT 'message',
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  INDEX `idx_canal` (`canal`),
  INDEX `idx_usuario_id` (`usuario_id`),
  INDEX `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Columnas importantes:**
- `canal`: Nombre del canal (ej: 'general', 'taller-grafico', 'mostrador')
- `usuario_id`: ID del usuario (debe existir en tabla `usuarios`)
- `contenido`: El mensaje
- `tipo`: Tipo de mensaje ('message', 'buzz', 'alert')
- `timestamp`: Fecha y hora del mensaje

### Tabla: `chat_rooms` (Opcional)

Si quieres usar salas de chat:

```sql
CREATE TABLE `chat_rooms` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `tipo` ENUM('publico','privado') DEFAULT 'publico',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 🔍 Verificar que Funciona

Después de crear las tablas:

1. **Verifica que las tablas existen:**
   ```sql
   SHOW TABLES LIKE 'chat%';
   ```

2. **Verifica la estructura:**
   ```sql
   DESCRIBE chat_messages;
   ```

3. **Prueba insertar un mensaje de prueba:**
   ```sql
   INSERT INTO chat_messages (canal, usuario_id, contenido, tipo)
   VALUES ('general', 1, 'Mensaje de prueba', 'message');
   ```

4. **Prueba la API:**
   - Haz login en la aplicación
   - Ve a la página de Chat
   - Intenta enviar un mensaje

## ❌ Errores Comunes

### Error: "No se puede ejecutar código PHP en SQL"
- **Solución**: Usa solo el archivo `crear_tablas_chat.sql`, no copies código PHP

### Error: "Table already exists"
- **Solución**: Usa `CREATE TABLE IF NOT EXISTS` o elimina la tabla primero:
  ```sql
  DROP TABLE IF EXISTS chat_messages;
  ```

### Error: "Foreign key constraint fails"
- **Solución**: Verifica que existan usuarios en la tabla `usuarios`:
  ```sql
  SELECT * FROM usuarios LIMIT 5;
  ```

### Error: "Column 'canal' cannot be null"
- **Solución**: Asegúrate de que la columna `canal` tenga un valor por defecto o siempre insertes un valor

## 📞 Si Necesitas Ayuda

1. **Verifica la estructura actual:**
   ```sql
   DESCRIBE chat_messages;
   ```

2. **Comparte el error completo** que recibes

3. **Indica si ya tienes datos** en la tabla chat_messages

## ✅ Checklist

- [ ] Archivo `crear_tablas_chat.sql` creado
- [ ] Ejecutado en phpMyAdmin (solo SQL, sin código PHP)
- [ ] Tablas creadas correctamente
- [ ] Estructura verificada con `DESCRIBE`
- [ ] Prueba de inserción exitosa
- [ ] API funciona correctamente

