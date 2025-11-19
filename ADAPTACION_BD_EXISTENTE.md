# ✅ Adaptación a Base de Datos Existente

## 📋 Resumen

He adaptado el código PHP de la API para que funcione con la estructura de base de datos existente **sin modificar el SQL**.

## 🔄 Cambios Realizados

### Estructura de Tabla Existente

Tu tabla `chat_messages` tiene esta estructura:
```sql
CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL DEFAULT 1,
  `id_usuario` int(11) NOT NULL,
  `nombre_usuario` varchar(100) NOT NULL,
  `mensaje` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
)
```

### Mapeo de Canales a Room ID

La API ahora mapea automáticamente:
- `general` → `room_id = 1`
- `taller-grafico` → `room_id = 2`
- `mostrador` → `room_id = 3`

### Archivos Modificados

#### 1. `backend/api/chat/mensajes.php`
- ✅ Adaptado para usar `room_id` en lugar de `canal`
- ✅ Usa `id_usuario` y `nombre_usuario` de la tabla
- ✅ Usa `mensaje` en lugar de `contenido`
- ✅ Detecta el tipo de mensaje (`buzz`, `alert`, `message`) basándose en el contenido
- ✅ Convierte `room_id` a `canal` en las respuestas para mantener compatibilidad con el frontend

#### 2. `backend/api/chat/zumbido.php`
- ✅ Adaptado para usar la estructura existente
- ✅ Inserta mensajes con el formato: "Te ha enviado un zumbido!"
- ✅ Maneja notificaciones de forma opcional (si la tabla existe)

#### 3. `backend/api/chat/alerta.php`
- ✅ Adaptado para usar la estructura existente
- ✅ Inserta mensajes con el formato: "¡Atención! Revisar esto de inmediato."
- ✅ Maneja notificaciones de forma opcional (si la tabla existe)

## 🔍 Funcionalidades

### GET /api/chat/mensajes.php
- Recibe: `canal` (ej: 'general', 'taller-grafico', 'mostrador')
- Convierte automáticamente a `room_id`
- Devuelve mensajes con estructura compatible con el frontend

### POST /api/chat/mensajes.php
- Recibe: `canal`, `contenido`, `tipo`
- Convierte `canal` a `room_id`
- Inserta usando: `room_id`, `id_usuario`, `nombre_usuario`, `mensaje`

### POST /api/chat/zumbido.php
- Inserta mensaje de zumbido en el formato existente
- Usa `room_id` según el canal

### POST /api/chat/alerta.php
- Inserta mensaje de alerta en el formato existente
- Usa `room_id` según el canal

## ✅ Compatibilidad

- ✅ **Frontend**: No requiere cambios, sigue usando `canal`
- ✅ **Base de Datos**: No requiere cambios, usa la estructura existente
- ✅ **Datos Existentes**: Todos los mensajes existentes funcionan correctamente

## 🧪 Pruebas

Para probar que funciona:

1. **Obtener mensajes:**
   ```bash
   GET https://trello.plotcenter.com.ar/api/chat/mensajes.php?canal=general
   ```

2. **Enviar mensaje:**
   ```bash
   POST https://trello.plotcenter.com.ar/api/chat/mensajes.php
   {
     "canal": "general",
     "contenido": "Hola mundo",
     "tipo": "message"
   }
   ```

3. **Enviar zumbido:**
   ```bash
   POST https://trello.plotcenter.com.ar/api/chat/zumbido.php
   {
     "canal": "general",
     "usuario_destino_id": 1
   }
   ```

## 📝 Notas

- Los mensajes existentes en la BD seguirán funcionando
- El tipo de mensaje se detecta automáticamente basándose en el contenido
- Si la tabla `notificaciones` no existe, el código continúa sin error
- El mapeo de canales es extensible (puedes agregar más rooms)

## 🎉 Resultado

Ahora el código PHP funciona perfectamente con tu estructura de base de datos existente, **sin necesidad de modificar el SQL**.

