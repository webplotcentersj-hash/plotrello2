export interface OrdenTrabajo {
  id: number
  numero_op: string
  cliente: string
  descripcion?: string | null
  estado: string
  prioridad: string
  fecha_creacion?: string | null
  fecha_entrega?: string | null
  fecha_ingreso?: string | null
  operario_asignado?: string | null
  complejidad?: string | null
  sector?: string | null
  materiales?: string | null
  nombre_creador?: string | null
  foto_url?: string | null
  usuario_trabajando_nombre?: string | null
}

export interface UsuarioRecord {
  id: number
  nombre: string
  rol: 'administracion' | 'taller' | 'mostrador'
}

export interface SectorRecord {
  id: number
  nombre: string
  color?: string | null
  activo?: boolean | null
}

export interface MaterialRecord {
  id: number
  codigo?: string | null
  descripcion: string
}

export interface HistorialMovimiento {
  id: number
  id_orden: number
  estado_anterior: string
  estado_nuevo: string
  id_usuario: number
  timestamp: string
  comentario?: string | null
}

export interface ChatMessage {
  id: number
  room_id: number
  id_usuario: number
  nombre_usuario?: string
  mensaje: string
  tipo?: 'message' | 'alert' | 'buzz'
  timestamp: string
}

export interface ComentarioOrden {
  id: number
  id_orden: number
  comentario: string
  usuario_nombre: string
  mencionados?: any
  timestamp: string
}

