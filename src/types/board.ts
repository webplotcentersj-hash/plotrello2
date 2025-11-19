export type TaskStatus =
  | 'diseno-grafico'
  | 'diseno-proceso'
  | 'en-espera'
  | 'imprenta'
  | 'taller-imprenta'
  | 'taller-grafico'
  | 'instalaciones'
  | 'metalurgica'
  | 'finalizado-taller'
  | 'almacen-entrega'
export type Priority = 'alta' | 'media' | 'baja'

export interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
  productivity: number
}

export interface Task {
  id: string
  opNumber: string
  title: string
  summary: string
  status: TaskStatus
  priority: Priority
  ownerId: string
  createdBy: string
  tags: string[]
  materials: string[]
  assignedSector: string
  photoUrl: string
  storyPoints: number
  progress: number
  createdAt: string
  dueDate: string
  updatedAt: string
  impact: 'alta' | 'media' | 'low'
}

export interface ActivityEvent {
  id: string
  taskId: string
  from: TaskStatus
  to: TaskStatus
  actorId: string
  timestamp: string
  note: string
}

export interface ColumnConfig {
  id: TaskStatus
  label: string
  description: string
  accent: string
}

