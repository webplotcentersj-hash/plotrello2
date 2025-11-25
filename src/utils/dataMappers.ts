import type { ActivityEvent, Priority, Task, TaskStatus } from '../types/board'
import type { HistorialMovimiento, OrdenTrabajo } from '../types/api'

const STATUS_TO_ESTADO: Record<TaskStatus, string> = {
  'diseno-grafico': 'Diseño Gráfico',
  'diseno-proceso': 'Diseño en Proceso',
  'en-espera': 'En Espera',
  imprenta: 'Imprenta (Área de Impresión)',
  'taller-imprenta': 'Taller de Imprenta',
  'taller-grafico': 'Taller Gráfico',
  instalaciones: 'Instalaciones',
  metalurgica: 'Metalúrgica',
  'finalizado-taller': 'Finalizado en Taller',
  'almacen-entrega': 'Almacén de Entrega'
}

const ESTADO_TO_STATUS: Record<string, TaskStatus> = Object.entries(STATUS_TO_ESTADO).reduce(
  (acc, [status, estado]) => {
    acc[estado.toLowerCase()] = status as TaskStatus
    return acc
  },
  {} as Record<string, TaskStatus>
)

const PRIORITY_TO_DB: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Normal',
  baja: 'Baja'
}

const PRIORITY_FROM_DB: Record<string, Priority> = {
  alta: 'alta',
  normal: 'media',
  media: 'media',
  baja: 'baja'
}

const IMPACT_TO_COMPLEJIDAD: Record<Task['impact'], string> = {
  alta: 'Alta',
  media: 'Media',
  low: 'Baja'
}

const COMPLEJIDAD_TO_IMPACT: Record<string, Task['impact']> = {
  alta: 'alta',
  media: 'media',
  baja: 'low'
}

export const mapStatusToEstado = (status: TaskStatus): string =>
  STATUS_TO_ESTADO[status] ?? status

export const mapEstadoToStatus = (estado: string): TaskStatus => {
  const normalized = estado?.toLowerCase().trim()
  return ESTADO_TO_STATUS[normalized] ?? 'en-espera'
}

export const mapPriorityToDb = (priority: Priority): string =>
  PRIORITY_TO_DB[priority] ?? 'Normal'

export const mapPriorityFromDb = (priority: string | null | undefined): Priority =>
  PRIORITY_FROM_DB[priority?.toLowerCase() ?? 'normal'] ?? 'media'

export const mapImpactToComplejidad = (impact: Task['impact']): string =>
  IMPACT_TO_COMPLEJIDAD[impact] ?? 'Media'

export const mapComplejidadToImpact = (
  complejidad: string | null | undefined
): Task['impact'] => COMPLEJIDAD_TO_IMPACT[complejidad?.toLowerCase() ?? 'media'] ?? 'media'

export const ordenToTask = (orden: OrdenTrabajo): Task => ({
  id: orden.id?.toString() ?? crypto.randomUUID(),
  opNumber: orden.numero_op,
  title: orden.cliente,
  dniCuit: orden.dni_cuit ?? undefined,
  summary: orden.descripcion ?? 'Sin descripción',
  status: mapEstadoToStatus(orden.estado),
  priority: mapPriorityFromDb(orden.prioridad),
  ownerId: orden.operario_asignado ?? 'sin-asignar',
  createdBy: orden.nombre_creador ?? 'Sistema',
  workingUser: orden.usuario_trabajando_nombre ?? undefined,
  tags: [],
  materials: orden.materiales
    ? orden.materiales.split(',').map((m) => m.trim()).filter(Boolean)
    : [],
  assignedSector: orden.sector ?? 'Sin sector',
  photoUrl: orden.foto_url ?? '',
  storyPoints: 0,
  progress: orden.estado?.toLowerCase().includes('finalizado') ? 100 : 50,
  createdAt: orden.fecha_creacion ?? new Date().toISOString(),
  dueDate: orden.fecha_entrega ?? orden.fecha_creacion ?? new Date().toISOString(),
  updatedAt: orden.fecha_ingreso ?? orden.fecha_creacion ?? new Date().toISOString(),
  impact: mapComplejidadToImpact(orden.complejidad)
})

export const historialToActivity = (registro: HistorialMovimiento): ActivityEvent => ({
  id: registro.id.toString(),
  taskId: registro.id_orden.toString(),
  from: mapEstadoToStatus(registro.estado_anterior),
  to: mapEstadoToStatus(registro.estado_nuevo),
  actorId: registro.id_usuario.toString(),
  timestamp: registro.timestamp,
  note: registro.comentario ?? 'Cambio de estado'
})

const toDateOnly = (value?: string) => {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().split('T')[0]
}

export const taskToOrdenPayload = (task: Omit<Task, 'id'> | Task): Partial<OrdenTrabajo> => {
  // Normalizar dniCuit: si es string vacío, convertir a null
  const dniCuitValue = task.dniCuit?.trim() || null
  
  return {
    numero_op: task.opNumber,
    cliente: task.title,
    dni_cuit: dniCuitValue,
  descripcion: task.summary,
  estado: mapStatusToEstado(task.status),
  prioridad: mapPriorityToDb(task.priority),
  fecha_entrega: toDateOnly(task.dueDate),
  fecha_creacion: task.createdAt,
  fecha_ingreso: task.updatedAt,
  operario_asignado: task.ownerId,
  complejidad: mapImpactToComplejidad(task.impact),
  sector: task.assignedSector,
    materiales: task.materials.join(', '),
    nombre_creador: task.createdBy,
    foto_url: task.photoUrl,
    usuario_trabajando_nombre: task.workingUser ?? null
  }
}

export const parseTaskIdToOrdenId = (taskId: string): number | null => {
  const direct = Number(taskId)
  if (!Number.isNaN(direct)) return direct
  const match = taskId.match(/(\d+)/)
  return match ? Number(match[1]) : null
}

