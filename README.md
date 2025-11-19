# Trello Plot - Sistema de Gestión de Producción

Sistema de gestión de órdenes de trabajo tipo Trello para producción gráfica e imprenta.

## 🚀 Características

- **Tablero Kanban** con drag & drop
- **Estadísticas y reportes** en vivo
- **Chat en tiempo real** estilo Slack
- **PlotAI** - Asistente con IA generativa
- **Optimizador de Sprint** automatizado
- **Zumbidos y alertas** reactivas
- **Integración nativa con Supabase**

## 📦 Instalación

### Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/webplotcentersj-hash/plotrello.git
cd plotrello

# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

### Producción

Consulta [DEPLOYMENT.md](./DEPLOYMENT.md) para deployment en Vercel u otros entornos Jamstack.

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto o configura los valores en tu plataforma de hosting:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=opcional_para_scripts
VITE_SUPABASE_SCHEMA=u956355532_tg
# Sólo si mantenés un backend legacy al mismo tiempo
VITE_API_BASE_URL=https://tu-backend-php/api
```

### Backend / Datos

El backend PHP fue reemplazado por Supabase (PostgreSQL + Storage + Auth). La app se comunica directamente mediante `@supabase/supabase-js`. Sigue la guía [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para importar el dump `u956355532_tg (2).sql`, crear funciones RPC (`login_usuario`, `logout_usuario`) y habilitar storage para adjuntos.

## 📁 Estructura del Proyecto

```
├── src/
│   ├── components/      # Componentes React
│   ├── pages/           # Páginas (Board, Statistics, Chat)
│   ├── services/        # API Supabase, Gemini
│   ├── data/            # Datos mock/fallback
│   └── utils/           # Utilidades
├── public/              # Estáticos Vite
└── SUPABASE_SETUP.md    # Pasos de migración
```

## 🛠️ Tecnologías

- **Frontend**: React 19, TypeScript, Vite
- **Estilos**: CSS Modules
- **Drag & Drop**: `@hello-pangea/dnd`
- **Gráficos**: Recharts
- **Routing**: React Router
- **IA**: Google Gemini
- **Backend**: Supabase (PostgreSQL + Storage)

## 📝 Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
```

## 🔐 Autenticación

El login se resuelve vía la función RPC `login_usuario` (ver guía). La sesión se propaga en `localStorage` para mantener compatibilidad con los hooks existentes.

## 📡 Acceso a datos

Los servicios React consultan tablas Supabase:

- `ordenes_trabajo`: órdenes y estados
- `historial_movimientos`: actividad para feeds y métricas
- `usuarios`: roles (`administracion`, `taller`, `mostrador`)
- `chat_messages`: canales `general`, `taller-grafico`, `mostrador`
- Storage bucket `archivos`: adjuntos por orden

Si no hay credenciales configuradas, se usan datos mock (`src/data/mockData.ts`) para desarrollo offline.

## 🚀 Deployment

1. Conecta el repo en Vercel.
2. Configura las variables de entorno anteriores.
3. Usa los scripts estándar (`npm run build`) definidos en `package.json`.

Para detalles adicionales (headers, rewrites, etc.) consulta [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📄 Licencia

Propietario - Plot Center

## 👥 Contribuidores

- Equipo Plot Center

