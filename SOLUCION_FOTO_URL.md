# 🔧 Solución: Error "Could not find the 'foto_url' column"

## Problema
Si ves el error: **"Could not find the 'foto_url' column of 'ordenes_trabajo' in the schema cache"**, significa que falta la columna `foto_url` en tu tabla de Supabase.

## Solución Rápida (2 pasos)

### Paso 1: Ejecutar el parche SQL en Supabase

1. **Abre tu proyecto en Supabase** → [app.supabase.com](https://app.supabase.com/)
2. Ve a **SQL Editor** (menú lateral izquierdo)
3. **Copia y pega** este SQL:

```sql
BEGIN;

-- Verificar si la columna ya existe antes de agregarla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'ordenes_trabajo' 
    AND column_name = 'foto_url'
  ) THEN
    ALTER TABLE public.ordenes_trabajo
      ADD COLUMN foto_url text;
    
    RAISE NOTICE 'Columna foto_url agregada exitosamente';
  ELSE
    RAISE NOTICE 'La columna foto_url ya existe';
  END IF;
END $$;

COMMIT;
```

4. Haz clic en **RUN** (o presiona Ctrl+Enter)
5. ✅ Deberías ver el mensaje: "Columna foto_url agregada exitosamente"

### Paso 2: Refrescar la aplicación

1. **Cierra y vuelve a abrir** la aplicación en el navegador
2. O haz **Ctrl+Shift+R** (hard refresh) para limpiar la caché
3. ✅ El error debería desaparecer y podrás crear fichas con fotos

## Verificación

Para verificar que la columna existe:

1. En Supabase → **Table Editor** → `ordenes_trabajo`
2. Deberías ver la columna `foto_url` en la lista de columnas

## Nota

El código ahora es más resiliente y funcionará aunque falte la columna (sin guardar fotos), pero **es esencial ejecutar el parche** para que las capturas funcionen correctamente.

