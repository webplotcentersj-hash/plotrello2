import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const projectRoot = process.cwd()
const dumpPath = join(projectRoot, 'u956355532_tg (2).sql')
const outputPath = join(projectRoot, 'supabase', 'materiales_seed.sql')

const text = readFileSync(dumpPath, 'utf8')
const marker = 'INSERT INTO `materiales`'
const start = text.indexOf(marker)

if (start === -1) {
  throw new Error('No se encontró el bloque de materiales en el dump')
}

const fromMarker = text.slice(start)
const valuesStart = fromMarker.indexOf('VALUES')

if (valuesStart === -1) {
  throw new Error('El bloque de materiales no contiene VALUES')
}

const afterValues = fromMarker.slice(valuesStart + 'VALUES'.length).trim()
const endIdx = afterValues.indexOf(');')

if (endIdx === -1) {
  throw new Error('No se encontró el cierre del INSERT de materiales')
}

const valuesBlock = afterValues.slice(0, endIdx).trim()

const header = `INSERT INTO public.materiales (id, codigo, descripcion) VALUES
`

const footer = `
ON CONFLICT (id) DO UPDATE SET
  codigo = EXCLUDED.codigo,
  descripcion = EXCLUDED.descripcion;

SELECT setval('materiales_id_seq', COALESCE((SELECT MAX(id) FROM public.materiales), 0), true);
`

writeFileSync(outputPath, `${header}${valuesBlock});${footer}`, 'utf8')

console.log('materiales_seed.sql regenerado correctamente')

