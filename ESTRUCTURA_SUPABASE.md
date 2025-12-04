# Estructura Actual de Supabase

Este documento describe la estructura completa de la base de datos Supabase basada en el schema y los patches aplicados.

## Tablas Principales

### 1. `usuarios`
- `id` (integer, PK, auto-increment)
- `nombre` (varchar(100), UNIQUE, NOT NULL)
- `password_hash` (varchar(255), NOT NULL)
- `rol` (text, CHECK: 'administracion', 'taller', 'mostrador')
- `last_seen` (timestamptz, DEFAULT now())

### 2. `sectores`
- `id` (integer, PK, auto-increment)
- `nombre` (varchar(100), UNIQUE, NOT NULL)
- `color` (varchar(7), DEFAULT '#6B7280')
- `activo` (boolean, DEFAULT true)
- `orden_visualizacion` (integer, DEFAULT 0)
- `created_at` (timestamptz, DEFAULT now())

**Sectores por defecto:**
- Diseño Gráfico (#f97316)
- Taller de Imprenta (#0ea5e9)
- Taller Gráfico (#6366f1)
- Instalaciones (#a855f7)
- Metalúrgica (#ec4899)
- Mostrador (#10b981)
- Caja (#facc15)

### 3. `ordenes_trabajo`
- `id` (integer, PK, auto-increment)
- `numero_op` (varchar(255), NOT NULL)
- `cliente` (varchar(255), NOT NULL)
- `dni_cuit` (varchar(32)) - **Agregado en patch 2024-11-23**
- `descripcion` (text)
- `fecha_entrega` (date, NOT NULL)
- `estado` (varchar(50), NOT NULL, DEFAULT 'Pendiente')
- `prioridad` (varchar(50), NOT NULL, DEFAULT 'Normal')
- `fecha_creacion` (timestamptz, NOT NULL, DEFAULT now())
- `fecha_ingreso` (timestamptz, NOT NULL, DEFAULT now())
- `operario_asignado` (varchar(100))
- `complejidad` (text, NOT NULL, DEFAULT 'Media', CHECK: 'Baja', 'Media', 'Alta')
- `sector` (text, NOT NULL, DEFAULT 'Diseño Gráfico', CHECK: valores de sectores)
- `materiales` (text)
- `hora_estimada_entrega` (time)
- `hora_entrega_efectiva` (time)
- `id_usuario_creador` (integer, FK → usuarios.id, ON DELETE SET NULL)
- `nombre_creador` (varchar(100))
- `foto_url` (text) - **Agregado en patch 2024-11-21**
- `usuario_trabajando_id` (integer)
- `usuario_trabajando_nombre` (varchar(100))
- `timestamp_inicio_trabajo` (timestamptz)

**Campos de contacto del cliente (agregados en patch 2024-11-24):**
- `telefono_cliente` (text)
- `email_cliente` (text)
- `direccion_cliente` (text)
- `whatsapp_link` (text)
- `ubicacion_link` (text)
- `drive_link` (text)

**Índices:**
- `idx_ordenes_fecha_estado` (fecha_creacion, estado)
- `idx_ordenes_estado_fecha` (estado, fecha_creacion)
- `idx_ordenes_sector_fecha` (sector, fecha_creacion)
- `idx_ordenes_complejidad` (complejidad)
- `idx_ordenes_operario_estado` (operario_asignado, estado)
- `idx_ordenes_cliente` (cliente)
- `idx_ordenes_prioridad_fecha` (prioridad, fecha_creacion)
- `idx_usuario_trabajando` (usuario_trabajando_id, timestamp_inicio_trabajo)

### 4. `historial_movimientos`
- `id` (integer, PK, auto-increment)
- `id_orden` (integer, NOT NULL, FK → ordenes_trabajo.id, ON DELETE CASCADE)
- `id_usuario` (integer, NOT NULL, FK → usuarios.id, ON DELETE CASCADE)
- `nombre_usuario` (varchar(100), NOT NULL)
- `estado_anterior` (varchar(50))
- `estado_nuevo` (varchar(50))
- `duracion_estado_anterior_seg` (integer)
- `timestamp` (timestamptz, NOT NULL, DEFAULT now())
- `comentario` (text)

**Índices:**
- `idx_historial_id_usuario` (id_usuario)
- `idx_historial_orden_timestamp` (id_orden, timestamp)
- `idx_historial_estado_timestamp` (estado_nuevo, timestamp)
- `idx_historial_usuario_timestamp` (nombre_usuario, timestamp)
- `idx_historial_duracion` (duracion_estado_anterior_seg)
- `idx_historial_estado_anterior` (estado_anterior, timestamp)

### 5. `materiales`
- `id` (integer, PK, auto-increment)
- `codigo` (text, UNIQUE)
- `descripcion` (text, NOT NULL)

### 6. `impresoras` - **Agregado en patch 2024-11-24**
- `id` (integer, PK, auto-increment)
- `nombre` (varchar(100), NOT NULL, UNIQUE)
- `modelo` (varchar(100))
- `estado` (varchar(50), NOT NULL, DEFAULT 'Disponible', CHECK: 'Disponible', 'En Uso', 'Mantenimiento', 'Fuera de Servicio')
- `capacidad_maxima_horas_dia` (numeric(10,2), DEFAULT 24.00)
- `activa` (boolean, DEFAULT true)
- `created_at` (timestamptz, DEFAULT now())
- `updated_at` (timestamptz, DEFAULT now())

**Índices:**
- `idx_impresoras_activa` (activa)

**Datos de ejemplo:**
- Impresora 1 (HP DesignJet)
- Impresora 2 (Canon ImagePROGRAF)
- Impresora 3 (Epson SureColor)

### 7. `impresora_uso` - **Agregado en patch 2024-11-24**
- `id` (integer, PK, auto-increment)
- `id_impresora` (integer, NOT NULL, FK → impresoras.id, ON DELETE CASCADE)
- `id_orden` (integer, NOT NULL, FK → ordenes_trabajo.id, ON DELETE CASCADE) - **FK condicional**
- `fecha_inicio` (timestamptz, NOT NULL, DEFAULT now())
- `fecha_fin` (timestamptz)
- `horas_usadas` (numeric(10,2)) - **Calculado automáticamente por trigger**
- `estado` (varchar(50), NOT NULL, DEFAULT 'En Proceso', CHECK: 'En Proceso', 'Completado', 'Cancelado')
- `operario` (varchar(100))
- `created_at` (timestamptz, DEFAULT now())

**Índices:**
- `idx_impresora_uso_impresora` (id_impresora)
- `idx_impresora_uso_orden` (id_orden)
- `idx_impresora_uso_fecha_inicio` (fecha_inicio)
- `idx_impresora_uso_estado` (estado)

**Trigger:**
- `trigger_calcular_horas_uso`: Calcula automáticamente `horas_usadas` cuando se actualiza `fecha_fin`

## Tablas de Relación

### 8. `orden_materiales`
- `id` (integer, PK, auto-increment)
- `id_orden` (integer, NOT NULL, FK → ordenes_trabajo.id, ON DELETE CASCADE)
- `id_material` (integer, NOT NULL, FK → materiales.id, ON DELETE CASCADE)
- `cantidad` (numeric(10,3), NOT NULL, DEFAULT 1.000)
- **UNIQUE** (id_orden, id_material)

**Índices:**
- `idx_orden_materiales_orden` (id_orden)
- `idx_orden_materiales_material` (id_material)
- `idx_orden_materiales_cantidad` (cantidad)

### 9. `orden_sectores`
- `id` (integer, PK, auto-increment)
- `id_orden` (integer, NOT NULL, FK → ordenes_trabajo.id, ON DELETE CASCADE)
- `id_sector` (integer, NOT NULL, FK → sectores.id, ON DELETE CASCADE)
- `fecha_asignacion` (timestamptz, DEFAULT now())
- **UNIQUE** (id_orden, id_sector)

**Índices:**
- `idx_orden_sectores_orden` (id_orden)
- `idx_orden_sectores_sector` (id_sector)

## Tablas de Archivos y Enlaces

### 10. `archivos_adjuntos`
- `id` (integer, PK, auto-increment)
- `id_orden` (integer, NOT NULL, FK → ordenes_trabajo.id, ON DELETE CASCADE)
- `nombre_archivo` (varchar(255), NOT NULL)
- `nombre_original` (varchar(255), NOT NULL)
- `fecha_subida` (timestamptz, NOT NULL, DEFAULT now())

**Índices:**
- `idx_archivos_orden` (id_orden)

### 11. `enlaces_adjuntos`
- `id` (integer, PK, auto-increment)
- `id_orden` (integer, NOT NULL, FK → ordenes_trabajo.id, ON DELETE CASCADE)
- `titulo` (varchar(255), NOT NULL)
- `url` (text, NOT NULL)
- `creado_en` (timestamptz, NOT NULL, DEFAULT now())

**Índices:**
- `idx_enlaces_orden` (id_orden)

## Tablas de Comentarios y Tareas

### 12. `comentarios_orden`
- `id` (integer, PK, auto-increment)
- `id_orden` (integer, NOT NULL, FK → ordenes_trabajo.id, ON DELETE CASCADE)
- `comentario` (text, NOT NULL)
- `usuario_nombre` (varchar(255), NOT NULL)
- `mencionados` (jsonb)
- `timestamp` (timestamptz, DEFAULT now())

**Índices:**
- `idx_comentarios_orden` (id_orden)
- `idx_comentarios_usuario` (usuario_nombre)
- `idx_comentarios_timestamp` (timestamp)

### 13. `tareas`
- `id` (integer, PK, auto-increment)
- `id_orden` (integer, NOT NULL, FK → ordenes_trabajo.id, ON DELETE CASCADE)
- `descripcion_tarea` (varchar(255), NOT NULL)
- `estado_kanban` (text, NOT NULL, DEFAULT 'Pendiente', CHECK: 'Pendiente', 'En Proceso', 'Finalizado')

**Índices:**
- `idx_tareas_orden` (id_orden)

## Tablas de Chat

### 14. `chat_rooms`
- `id` (integer, PK, auto-increment)
- `nombre` (varchar(255), NOT NULL)
- `tipo` (text, DEFAULT 'publico', CHECK: 'publico', 'privado')
- `created_at` (timestamptz, DEFAULT now())

### 15. `chat_messages`
- `id` (integer, PK, auto-increment)
- `room_id` (integer, NOT NULL, FK → chat_rooms.id, ON DELETE CASCADE, ON UPDATE CASCADE)
- `id_usuario` (integer, NOT NULL, FK → usuarios.id, ON DELETE CASCADE)
- `nombre_usuario` (varchar(100), NOT NULL)
- `mensaje` (text, NOT NULL)
- `timestamp` (timestamptz, NOT NULL, DEFAULT now())

**Índices:**
- `idx_chat_messages_usuario` (id_usuario)
- `idx_chat_messages_room` (room_id)

## Tablas de Notificaciones

### 16. `alertas_enviadas`
- `id` (integer, PK, auto-increment)
- `id_orden` (integer, NOT NULL, FK → ordenes_trabajo.id, ON DELETE CASCADE)
- `tipo_alerta` (text, NOT NULL, CHECK: 'estancada', 'plazo')
- `timestamp` (timestamptz, NOT NULL, DEFAULT now())
- **UNIQUE** (id_orden, tipo_alerta)

### 17. `notificaciones`
- `id` (integer, PK, auto-increment)
- `usuario_destino` (varchar(255), NOT NULL)
- `tipo` (varchar(50), NOT NULL, DEFAULT 'mencion')
- `mensaje` (text, NOT NULL)
- `id_orden` (integer, FK → ordenes_trabajo.id, ON DELETE CASCADE)
- `leida` (boolean, DEFAULT false)
- `timestamp` (timestamptz, DEFAULT now())

**Índices:**
- `idx_notificaciones_usuario_leida` (usuario_destino, leida)
- `idx_notificaciones_timestamp` (timestamp)
- `idx_notificaciones_orden` (id_orden)

### 18. `notificaciones_vistas`
- `id` (integer, PK, auto-increment)
- `id_usuario` (integer, NOT NULL, FK → usuarios.id, ON DELETE CASCADE)
- `id_historial` (integer, NOT NULL)
- `timestamp` (timestamptz, NOT NULL, DEFAULT now())
- **UNIQUE** (id_usuario, id_historial)

### 19. `user_notifications`
- `id` (integer, PK, auto-increment)
- `user_id` (integer, NOT NULL, FK → usuarios.id, ON DELETE CASCADE)
- `title` (varchar(255), NOT NULL)
- `description` (text)
- `type` (varchar(50), DEFAULT 'info')
- `orden_id` (integer, FK → ordenes_trabajo.id, ON DELETE CASCADE)
- `is_read` (boolean, DEFAULT false)
- `timestamp` (timestamptz, DEFAULT now())

**Índices:**
- `idx_user_notifications_user_read` (user_id, is_read)
- `idx_user_notifications_timestamp` (timestamp)

### 20. `online_users`
- `user_id` (integer, PK, FK → usuarios.id, ON DELETE CASCADE)
- `user_nombre` (varchar(255), NOT NULL)
- `last_seen` (timestamptz, NOT NULL, DEFAULT now())

## Tablas de Métricas e Inteligencia

### 21. `prediction_metrics`
- `id` (integer, PK, auto-increment)
- `orden_id` (integer, NOT NULL, FK → ordenes_trabajo.id, ON DELETE CASCADE)
- `numero_op` (varchar(50))
- `tiempo_predicho_horas` (numeric(10,2))
- `tiempo_real_horas` (numeric(10,2))
- `confianza_prediccion` (integer)
- `error_absoluto` (numeric(10,2))
- `error_porcentual` (numeric(10,2))
- `factores_aplicados` (text)
- `fecha_prediccion` (timestamptz, DEFAULT now())
- `fecha_completado` (timestamptz)

**Índices:**
- `idx_prediction_orden` (orden_id)
- `idx_prediction_fecha` (fecha_prediccion)
- `idx_prediction_completado` (fecha_completado)

### 22. `smart_alerts`
- `id` (integer, PK, auto-increment)
- `tipo_alerta` (text, NOT NULL, CHECK: 'retraso_predicho', 'sobrecarga_operario', 'cuello_botella', 'eficiencia_baja')
- `prioridad` (text, NOT NULL, CHECK: 'baja', 'media', 'alta', 'critica')
- `titulo` (varchar(255), NOT NULL)
- `descripcion` (text)
- `datos_contexto` (jsonb)
- `fecha_creacion` (timestamptz, DEFAULT now())
- `fecha_resuelto` (timestamptz)
- `resuelto` (boolean, DEFAULT false)

**Índices:**
- `idx_alerts_tipo` (tipo_alerta, resuelto)
- `idx_alerts_prioridad` (prioridad, fecha_creacion)

### 23. `stats_cache`
- `id` (integer, PK, auto-increment)
- `cache_key` (varchar(255), NOT NULL, UNIQUE)
- `cache_data` (jsonb, NOT NULL)
- `created_at` (timestamptz, DEFAULT now())
- `expires_at` (timestamptz, NOT NULL)

**Índices:**
- `idx_cache_key_expires` (cache_key, expires_at)

### 24. `trending_metrics`
- `id` (integer, PK, auto-increment)
- `fecha` (date, NOT NULL)
- `metrica` (varchar(100), NOT NULL)
- `valor` (numeric(15,4), NOT NULL)
- `categoria` (varchar(100))
- `subcategoria` (varchar(100))
- `created_at` (timestamptz, DEFAULT now())
- **UNIQUE** (fecha, metrica, categoria, subcategoria)

**Índices:**
- `idx_trending_fecha` (fecha)
- `idx_trending_metrica` (metrica, fecha)

## Vistas

### 1. `v_ordenes_stats`
Vista analítica que calcula métricas de órdenes:
- Horas transcurridas desde creación
- Horas completado (si está entregado)
- Semana, año, mes y día de semana de creación

### 2. `v_impresoras_ocupacion` - **Agregado en patch 2024-11-24**
Vista que calcula la ocupación de impresoras basada en órdenes de "Taller Gráfico":
- `id`, `nombre`, `modelo`, `estado_impresora`, `capacidad_maxima_horas_dia`, `activa`
- `horas_usadas_hoy` (calculado desde órdenes en Taller Gráfico)
- `horas_usadas_semana` (calculado desde órdenes en Taller Gráfico)
- `porcentaje_ocupacion_hoy` (horas_usadas_hoy / capacidad_maxima_horas_dia * 100)
- `porcentaje_ocupacion_semana` (horas_usadas_semana / (capacidad_maxima_horas_dia * 7) * 100)
- `trabajos_activos` (cantidad de órdenes actualmente en Taller Gráfico asignadas a esta impresora)

**Lógica de cálculo:**
- Distribuye órdenes entre impresoras activas usando round-robin (módulo)
- Calcula tiempo estimado basado en complejidad:
  - Alta: 4 horas
  - Media: 2 horas
  - Baja: 1 hora
- Usa `historial_movimientos` para determinar cuándo entró una orden a Taller Gráfico
- Solo cuenta órdenes con estado activo (no 'Entregado', 'Finalizado en Taller', 'Almacén de Entrega', 'Pendiente')

## Funciones

### 1. `login_usuario(p_usuario text, p_password text)`
Función de autenticación que:
- Busca usuario por nombre (case-insensitive)
- Verifica password usando `crypt()`
- Retorna: `id`, `nombre`, `rol`

**Permisos:** GRANT EXECUTE TO anon, authenticated

### 2. `logout_usuario()`
Función placeholder para compatibilidad con frontend.

### 3. `calcular_horas_uso()` - **Agregado en patch 2024-11-24**
Función trigger que calcula automáticamente `horas_usadas` en `impresora_uso` cuando se actualiza `fecha_fin`.

## Extensiones

- `pgcrypto`: Para funciones de encriptación (usado en login)

## Permisos

### Impresoras (patch 2024-11-24):
- `SELECT` en `impresoras`, `impresora_uso`, `v_impresoras_ocupacion` → anon, authenticated
- `INSERT, UPDATE` en `impresora_uso` → authenticated

## Patches Aplicados

1. **2024-11-20**: Fix sectores y creador
2. **2024-11-21**: Add foto_url a ordenes_trabajo
3. **2024-11-21**: Fix storage policies
4. **2024-11-22**: Init chat rooms
5. **2024-11-23**: Add dni_cuit a ordenes_trabajo
6. **2024-11-23**: Create usuario function (clean)
7. **2024-11-23**: Create usuario function
8. **2024-11-23**: Update usuario roles check
9. **2024-11-24**: Add contact fields to ordenes (telefono_cliente, email_cliente, direccion_cliente, whatsapp_link, ubicacion_link, drive_link)
10. **2024-11-24**: Create impresoras tables (impresoras, impresora_uso, v_impresoras_ocupacion)

## Notas Importantes

1. **Foreign Keys Condicionales**: Algunos patches verifican la existencia de tablas antes de crear foreign keys (ej: `impresora_uso.id_orden` → `ordenes_trabajo.id`)

2. **Vistas Condicionales**: La vista `v_impresoras_ocupacion` se crea de forma condicional:
   - Si existen `ordenes_trabajo` e `impresoras`: vista completa con cálculos
   - Si no: vista simple con valores en 0

3. **Triggers**: El trigger `trigger_calcular_horas_uso` se elimina antes de crearse para evitar errores de duplicación

4. **Campos Opcionales**: Los nuevos campos de contacto en `ordenes_trabajo` son opcionales (text, nullable)

