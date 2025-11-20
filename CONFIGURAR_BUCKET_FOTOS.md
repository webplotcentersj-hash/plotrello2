# 📸 Configurar Bucket para Fotos

## Problema
Si no puedes subir fotos, probablemente falta el bucket `archivos` en Supabase Storage o no tiene los permisos correctos.

## Solución (3 pasos)

### Paso 1: Crear el bucket

1. Ve a **Supabase Dashboard** → Tu proyecto
2. En el menú lateral, haz clic en **Storage**
3. Haz clic en **New bucket**
4. Configura:
   - **Name**: `archivos` (exactamente así, en minúsculas)
   - **Public bucket**: ✅ **MARCAR ESTA OPCIÓN** (muy importante)
5. Haz clic en **Create bucket**

### Paso 2: Configurar políticas (si es necesario)

Si el bucket no es público o necesitas más control:

1. En Storage → `archivos` → **Policies**
2. Crea una política para permitir uploads:

```sql
-- Política para permitir que cualquier usuario suba archivos
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'archivos');
```

3. Crea otra para permitir lectura:

```sql
-- Política para permitir lectura pública
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'archivos');
```

### Paso 3: Verificar

1. Intenta subir una foto en la app
2. Si ves un error, revisa la consola del navegador (F12) para ver el mensaje exacto
3. Los errores comunes:
   - **"bucket not found"** → El bucket no existe, créalo (Paso 1)
   - **"row-level security policy"** → Faltan políticas, créalas (Paso 2)
   - **"permission denied"** → El bucket no es público, márcalo como público

## Verificación rápida

En Supabase → Storage deberías ver:
- ✅ Bucket `archivos` existe
- ✅ Tiene el ícono de "público" (globo)
- ✅ Puedes hacer clic y ver su contenido

## Nota importante

El bucket **DEBE** ser público para que las fotos se puedan mostrar en la aplicación. Si lo haces privado, necesitarás configurar políticas RLS más complejas.

