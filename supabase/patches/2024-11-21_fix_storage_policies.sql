-- Configurar políticas RLS para el bucket 'archivos'
-- Este script permite que usuarios anónimos y autenticados suban y lean archivos

BEGIN;

-- Eliminar políticas existentes si las hay (para evitar duplicados)
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Política 1: Permitir que cualquier usuario (anon/authenticated) suba archivos al bucket 'archivos'
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'archivos');

-- Política 2: Permitir que cualquier usuario (anon/authenticated) lea archivos del bucket 'archivos'
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'archivos');

-- Política 3: Permitir que cualquier usuario (anon/authenticated) elimine archivos del bucket 'archivos'
-- (Opcional, pero útil para permitir reemplazar archivos)
CREATE POLICY "Allow public deletes"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'archivos');

-- Política 4: Permitir actualizar archivos (para upsert)
CREATE POLICY "Allow public updates"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'archivos')
WITH CHECK (bucket_id = 'archivos');

COMMIT;

-- Verificación: Ejecuta esto para ver las políticas creadas
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

