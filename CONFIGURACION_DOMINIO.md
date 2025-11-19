# 🌐 Configuración del Dominio - Trello Plot

## ✅ Dominio Configurado

Tu dominio es: **trello.plotcenter.com.ar**

## 📋 Configuración Actual

### Frontend (React)
- **URL de la API**: `https://trello.plotcenter.com.ar/api`
- **Configurado en**: `src/services/api.ts`

### Backend (PHP)
- **Ubicación**: `public_html/api/` o `htdocs/api/`
- **URL base**: `https://trello.plotcenter.com.ar/api`

## 🔧 Pasos de Configuración

### 1. Variables de Entorno (Frontend)

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_API_BASE_URL=https://trello.plotcenter.com.ar/api
VITE_GEMINI_API_KEY=tu_api_key_de_gemini
```

**⚠️ IMPORTANTE:** 
- El archivo `.env` NO debe subirse a Git (ya está en `.gitignore`)
- En Vercel, configura estas variables en Settings → Environment Variables

### 2. Verificar Backend en Hostinger

Asegúrate de que los archivos estén en:
```
public_html/
└── api/
    ├── config/
    │   ├── database.php
    │   └── auth.php
    ├── ordenes.php
    ├── historial.php
    ├── usuarios.php
    ├── estadisticas.php
    ├── chat/
    ├── auth/
    └── .htaccess
```

### 3. Configurar CORS en Backend

El archivo `.htaccess` debe permitir requests desde:
- `https://trello.plotcenter.com.ar` (si el frontend está en el mismo dominio)
- O desde tu dominio de Vercel (si desplegas allí)

Ejemplo de `.htaccess`:
```apache
Header always set Access-Control-Allow-Origin "https://trello.plotcenter.com.ar"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
```

### 4. Probar la API

Abre `test-api.html` en tu navegador y prueba:

1. **URL de API**: `https://trello.plotcenter.com.ar/api`
2. **Login**: Usa un usuario válido de tu base de datos
3. **Endpoints**: Verifica que todos respondan correctamente

## 🧪 URLs de Prueba

### Endpoints de la API:

- **Login**: `POST https://trello.plotcenter.com.ar/api/auth/login.php`
- **Usuarios**: `GET https://trello.plotcenter.com.ar/api/usuarios.php`
- **Órdenes**: `GET https://trello.plotcenter.com.ar/api/ordenes.php`
- **Estadísticas**: `GET https://trello.plotcenter.com.ar/api/estadisticas.php`
- **Historial**: `GET https://trello.plotcenter.com.ar/api/historial.php`

## 🚀 Deployment

### Opción 1: Mismo Dominio (Subdirectorio)

Si quieres servir el frontend desde el mismo dominio:
```
trello.plotcenter.com.ar/          → Frontend (React)
trello.plotcenter.com.ar/api/      → Backend (PHP)
```

### Opción 2: Vercel (Recomendado)

1. Frontend en Vercel: `https://tu-app.vercel.app`
2. Backend en Hostinger: `https://trello.plotcenter.com.ar/api`
3. Configura CORS para permitir requests desde Vercel

## ✅ Checklist

- [ ] Backend subido a `public_html/api/`
- [ ] Archivo `.htaccess` configurado
- [ ] Variables de entorno configuradas en `.env`
- [ ] API responde en `https://trello.plotcenter.com.ar/api`
- [ ] Login funciona correctamente
- [ ] CORS configurado correctamente
- [ ] Frontend puede conectarse a la API

## 🐛 Solución de Problemas

### Error: "Failed to fetch"
- Verifica que la URL sea correcta: `https://trello.plotcenter.com.ar/api`
- Verifica que el servidor esté funcionando
- Verifica CORS en `.htaccess`

### Error: "CORS policy"
- Asegúrate de que `.htaccess` tenga los headers CORS
- Verifica que el dominio del frontend esté permitido

### Error: "404 Not Found"
- Verifica que los archivos estén en `public_html/api/`
- Verifica que `.htaccess` esté en la carpeta correcta

