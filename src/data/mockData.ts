import type { ActivityEvent, ColumnConfig, Task, TeamMember } from '../types/board'

export const BOARD_COLUMNS: ColumnConfig[] = [
  {
    id: 'backlog',
    label: 'Ideas activas',
    description: 'Trabajo priorizado y listo para arrancar',
    accent: 'var(--brand)'
  },
  {
    id: 'in-progress',
    label: 'En ejecución',
    description: 'Equipos trabajando ahora mismo',
    accent: '#5a8dee'
  },
  {
    id: 'review',
    label: 'QA / Review',
    description: 'Pendiente de validación y pruebas',
    accent: '#ffcf5c'
  },
  {
    id: 'done',
    label: 'Listo',
    description: 'Entregado y con métricas capturadas',
    accent: '#3dd598'
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
    status: 'in-progress',
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
    status: 'backlog',
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
    status: 'review',
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
    status: 'done',
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
    status: 'backlog',
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
    status: 'in-progress',
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
    status: 'review',
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
    status: 'backlog',
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
    from: 'review',
    to: 'done',
    actorId: 'ximena',
    timestamp: daysAgo(4),
    note: 'Integración validada por seguridad'
  },
  {
    id: 'move-2',
    taskId: 'PLT-193',
    from: 'backlog',
    to: 'in-progress',
    actorId: 'ximena',
    timestamp: daysAgo(3),
    note: 'API aprobada en planning'
  },
  {
    id: 'move-3',
    taskId: 'PLT-201',
    from: 'in-progress',
    to: 'review',
    actorId: 'sofia',
    timestamp: daysAgo(2),
    note: 'Pasó test unitarios'
  },
  {
    id: 'move-4',
    taskId: 'PLT-188',
    from: 'in-progress',
    to: 'review',
    actorId: 'laura',
    timestamp: daysAgo(1),
    note: 'Listo para QA'
  },
  {
    id: 'move-5',
    taskId: 'PLT-204',
    from: 'backlog',
    to: 'in-progress',
    actorId: 'diego',
    timestamp: daysAgo(1),
    note: 'Sprint express'
  }
]

