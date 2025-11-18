import type { ActivityEvent, ColumnConfig, Task, TeamMember } from '../types/board'

export const BOARD_COLUMNS: ColumnConfig[] = [
  {
    id: 'diseno-grafico',
    label: 'Diseño Gráfico',
    description: 'Briefs y piezas esperando toma de trabajo',
    accent: '#f97316'
  },
  {
    id: 'diseno-proceso',
    label: 'Diseño en Proceso',
    description: 'Diseñadores actuando ahora mismo',
    accent: '#fbbf24'
  },
  {
    id: 'en-espera',
    label: 'En Espera',
    description: 'Pedidos pausados por aprobación o insumo',
    accent: '#facc15'
  },
  {
    id: 'imprenta',
    label: 'Imprenta (Área de Impresión)',
    description: 'Archivos listos para salida de impresión',
    accent: '#38bdf8'
  },
  {
    id: 'taller-imprenta',
    label: 'Taller de Imprenta',
    description: 'Procesos físicos dentro de imprenta',
    accent: '#0ea5e9'
  },
  {
    id: 'taller-grafico',
    label: 'Taller Gráfico',
    description: 'Acabados, montaje y control visual',
    accent: '#6366f1'
  },
  {
    id: 'instalaciones',
    label: 'Instalaciones',
    description: 'Equipos listos para ir al sitio del cliente',
    accent: '#a855f7'
  },
  {
    id: 'metalurgica',
    label: 'Metalúrgica',
    description: 'Estructuras y soportes especiales',
    accent: '#ec4899'
  },
  {
    id: 'finalizado-taller',
    label: 'Finalizado en Taller',
    description: 'Listo para entregar desde taller',
    accent: '#22c55e'
  },
  {
    id: 'almacen-entrega',
    label: 'Almacén de Entrega',
    description: 'Pedidos embalados esperando retiro/entrega',
    accent: '#84cc16'
  }
]

export const teamMembers: TeamMember[] = [
  {
    id: 'laura',
    name: 'Laura Méndez',
    role: 'Product Lead',
    avatar: 'LM',
    productivity: 92
  },
  {
    id: 'diego',
    name: 'Diego Ríos',
    role: 'Frontend',
    avatar: 'DR',
    productivity: 84
  },
  {
    id: 'ximena',
    name: 'Ximena Díaz',
    role: 'Backend',
    avatar: 'XD',
    productivity: 88
  },
  {
    id: 'sofia',
    name: 'Sofía Salas',
    role: 'QA Lead',
    avatar: 'SS',
    productivity: 79
  },
  {
    id: 'leo',
    name: 'Leo Navarro',
    role: 'Data',
    avatar: 'LN',
    productivity: 81
  }
]

const now = new Date()
const daysAgo = (count: number) => {
  const date = new Date(now)
  date.setDate(now.getDate() - count)
  return date.toISOString()
}

export const initialTasks: Task[] = [
  {
    id: 'PLT-204',
    title: 'Dashboard de insights en tiempo real',
    summary: 'Unifica métricas de throughput y calidad con alertas rápidas',
    status: 'diseno-proceso',
    priority: 'alta',
    ownerId: 'diego',
    tags: ['frontend', 'realtime'],
    storyPoints: 5,
    progress: 62,
    createdAt: daysAgo(10),
    dueDate: daysAgo(-3),
    updatedAt: daysAgo(0),
    impact: 'alta'
  },
  {
    id: 'PLT-198',
    title: 'Motor de recomendaciones de trabajo',
    summary: 'Sugiere el siguiente trabajo usando señales históricas',
    status: 'diseno-grafico',
    priority: 'alta',
    ownerId: 'leo',
    tags: ['ml', 'priorities'],
    storyPoints: 8,
    progress: 5,
    createdAt: daysAgo(14),
    dueDate: daysAgo(-1),
    updatedAt: daysAgo(6),
    impact: 'alta'
  },
  {
    id: 'PLT-201',
    title: 'Alertas de riesgo de retraso',
    summary: 'Dispara avisos cuando los tickets superan el SLA interno',
    status: 'en-espera',
    priority: 'alta',
    ownerId: 'sofia',
    tags: ['observability'],
    storyPoints: 3,
    progress: 90,
    createdAt: daysAgo(7),
    dueDate: daysAgo(1),
    updatedAt: daysAgo(1),
    impact: 'alta'
  },
  {
    id: 'PLT-185',
    title: 'Integración con Trello Enterprise',
    summary: 'Sincroniza tableros y permisos corporativos',
    status: 'finalizado-taller',
    priority: 'media',
    ownerId: 'ximena',
    tags: ['backend', 'integraciones'],
    storyPoints: 13,
    progress: 100,
    createdAt: daysAgo(21),
    dueDate: daysAgo(5),
    updatedAt: daysAgo(4),
    impact: 'media'
  },
  {
    id: 'PLT-210',
    title: 'Kit visual Trello Plot',
    summary: 'Componentes UI consistentes con el color eb671b',
    status: 'diseno-grafico',
    priority: 'media',
    ownerId: 'laura',
    tags: ['design', 'branding'],
    storyPoints: 2,
    progress: 0,
    createdAt: daysAgo(3),
    dueDate: daysAgo(6),
    updatedAt: daysAgo(3),
    impact: 'media'
  },
  {
    id: 'PLT-193',
    title: 'API de eventos de movimiento',
    summary: 'Expone cambios de estado para analytics',
    status: 'taller-grafico',
    priority: 'alta',
    ownerId: 'ximena',
    tags: ['backend', 'api'],
    storyPoints: 8,
    progress: 40,
    createdAt: daysAgo(9),
    dueDate: daysAgo(2),
    updatedAt: daysAgo(0),
    impact: 'alta'
  },
  {
    id: 'PLT-188',
    title: 'Playbook de handoff',
    summary: 'Checklist inteligente entre squads',
    status: 'imprenta',
    priority: 'media',
    ownerId: 'laura',
    tags: ['ops'],
    storyPoints: 5,
    progress: 75,
    createdAt: daysAgo(5),
    dueDate: daysAgo(2),
    updatedAt: daysAgo(2),
    impact: 'media'
  },
  {
    id: 'PLT-214',
    title: 'Widget de rendimiento individual',
    summary: 'Expone movimientos por persona con comparativa semanal',
    status: 'almacen-entrega',
    priority: 'alta',
    ownerId: 'leo',
    tags: ['analytics'],
    storyPoints: 3,
    progress: 10,
    createdAt: daysAgo(4),
    dueDate: daysAgo(0),
    updatedAt: daysAgo(1),
    impact: 'alta'
  }
]

export const initialActivity: ActivityEvent[] = [
  {
    id: 'move-1',
    taskId: 'PLT-185',
    from: 'taller-grafico',
    to: 'finalizado-taller',
    actorId: 'ximena',
    timestamp: daysAgo(4),
    note: 'Integración validada por seguridad'
  },
  {
    id: 'move-2',
    taskId: 'PLT-193',
    from: 'diseno-proceso',
    to: 'taller-grafico',
    actorId: 'ximena',
    timestamp: daysAgo(3),
    note: 'API aprobada en planning'
  },
  {
    id: 'move-3',
    taskId: 'PLT-201',
    from: 'diseno-proceso',
    to: 'en-espera',
    actorId: 'sofia',
    timestamp: daysAgo(2),
    note: 'Pasó test unitarios'
  },
  {
    id: 'move-4',
    taskId: 'PLT-188',
    from: 'imprenta',
    to: 'taller-grafico',
    actorId: 'laura',
    timestamp: daysAgo(1),
    note: 'Listo para QA'
  },
  {
    id: 'move-5',
    taskId: 'PLT-204',
    from: 'diseno-grafico',
    to: 'diseno-proceso',
    actorId: 'diego',
    timestamp: daysAgo(1),
    note: 'Sprint express'
  }
]

