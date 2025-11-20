import { GoogleGenAI } from '@google/genai'
import type { Task, TeamMember, ActivityEvent } from '../types/board'
import { BOARD_COLUMNS } from '../data/mockData'

// El nuevo SDK de Google GenAI puede usar la API key desde variable de entorno
// o se puede pasar en el constructor si es necesario
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

// Inicializar el cliente de Google GenAI
// El constructor puede recibir { apiKey } o usar la variable de entorno automáticamente
let ai: GoogleGenAI | null = null
try {
  if (GEMINI_API_KEY) {
    // Intentar con API key explícita primero
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  } else {
    // Si no hay API key, intentar sin parámetros (usará variable de entorno si existe)
    ai = new GoogleGenAI({})
  }
} catch (error) {
  console.warn('No se pudo inicializar GoogleGenAI:', error)
  ai = null
}

export interface SystemContext {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  statusDistribution: Record<string, number>
  workloadByMember: Array<{
    name: string
    taskCount: number
    highPriority: number
  }>
  recentActivity: Array<{
    user: string
    movement: string
    time: string
  }>
  teamMembers: Array<{ name: string; role: string }>
  columns: Array<{ id: string; label: string; description: string }>
}

export function getSystemContext(
  tasks: Task[],
  activity: ActivityEvent[],
  teamMembers: TeamMember[]
): SystemContext {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'almacen-entrega').length
  const inProgressTasks = tasks.filter((t) => 
    !['diseno-grafico', 'almacen-entrega'].includes(t.status)
  ).length

  const statusDistribution = tasks.reduce((acc, task) => {
    const column = BOARD_COLUMNS.find((col) => col.id === task.status)
    const label = column?.label || task.status
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const workloadByMember = teamMembers.map((member) => {
    const memberTasks = tasks.filter((task) => task.ownerId === member.id)
    return {
      name: member.name,
      taskCount: memberTasks.length,
      highPriority: memberTasks.filter((t) => t.priority === 'alta').length
    }
  })

  const recentActivity = activity.slice(0, 10).map((event) => {
    const member = teamMembers.find((m) => m.id === event.actorId)
    const fromCol = BOARD_COLUMNS.find((col) => col.id === event.from)
    const toCol = BOARD_COLUMNS.find((col) => col.id === event.to)
    return {
      user: member?.name || 'Desconocido',
      movement: `${fromCol?.label || event.from} → ${toCol?.label || event.to}`,
      time: new Date(event.timestamp).toLocaleString('es-AR')
    }
  })

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    statusDistribution,
    workloadByMember,
    recentActivity,
    teamMembers: teamMembers.map((m) => ({ name: m.name, role: m.role })),
    columns: BOARD_COLUMNS.map((col) => ({ id: col.id, label: col.label, description: col.description }))
  }
}

export interface GenerateContentOptions {
  model?: string
  contents: string
  systemContext?: SystemContext
  conversationHistory?: string
  attachments?: Array<{ name: string; type: string; content: string }>
}

export async function generateContent(options: GenerateContentOptions): Promise<string> {
  if (!ai) {
    throw new Error('API key de Gemini no configurada. Por favor, configura VITE_GEMINI_API_KEY en tu archivo .env')
  }

  const {
    model = 'gemini-2.5-flash',
    contents,
    systemContext,
    conversationHistory,
    attachments
  } = options

  try {
    // Construir el prompt completo
    let prompt = contents

    if (systemContext) {
      const contextText = `Eres PlotAI, un asistente inteligente AGÉNTICO especializado en gestión de producción gráfica e imprenta. Tienes acceso completo al sistema y puedes:

CAPACIDADES AGÉNTICAS:
- Analizar datos en tiempo real del sistema
- Identificar patrones y tendencias
- Detectar problemas y cuellos de botella
- Sugerir acciones concretas y optimizaciones
- Aprender del contexto histórico y actual
- Analizar archivos (imágenes, PDFs, documentos)
- Generar reportes y insights profundos

CONTEXTO DEL SISTEMA (DATOS EN TIEMPO REAL):
- Total de tareas: ${systemContext.totalTasks}
- Tareas completadas: ${systemContext.completedTasks}
- Tareas en progreso: ${systemContext.inProgressTasks}

DISTRIBUCIÓN POR ESTADO:
${Object.entries(systemContext.statusDistribution).map(([status, count]) => `- ${status}: ${count} tareas`).join('\n')}

CARGA DE TRABAJO POR PERSONA:
${systemContext.workloadByMember.map((w) => `- ${w.name}: ${w.taskCount} tareas (${w.highPriority} alta prioridad)`).join('\n')}

ACTIVIDAD RECIENTE:
${systemContext.recentActivity.map((a) => `- ${a.user}: ${a.movement} (${a.time})`).join('\n')}

MIEMBROS DEL EQUIPO:
${systemContext.teamMembers.map((m) => `- ${m.name} (${m.role})`).join('\n')}

COLUMNAS DEL TABLERO:
${systemContext.columns.map((c) => `- ${c.label} (${c.id}): ${c.description}`).join('\n')}

INSTRUCCIONES AGÉNTICAS:
- Responde en español de manera clara, profesional y accionable
- Analiza los datos proporcionados y extrae insights profundos
- Identifica problemas proactivamente (cuellos de botella, sobrecargas, retrasos)
- Sugiere acciones concretas y priorizadas
- Si hay archivos adjuntos, analízalos en detalle y relaciona con el contexto del sistema
- Aprende de los patrones que observas en los datos
- Sé proactivo: no solo respondas, también anticipa problemas y oportunidades
- Proporciona métricas, comparaciones y análisis cuantitativos cuando sea relevante

`
      prompt = contextText + prompt
    }

    if (attachments && attachments.length > 0) {
      const hasImages = attachments.some((att) => att.type.startsWith('image/'))
      
      if (hasImages) {
        // Para imágenes, necesitamos procesarlas de manera especial
        // El nuevo SDK puede manejar imágenes de forma diferente
        const imageAttachments = attachments.filter((att) => att.type.startsWith('image/'))
        const textAttachments = attachments.filter((att) => !att.type.startsWith('image/'))
        
        if (textAttachments.length > 0) {
          prompt += `\nARCHIVOS DE TEXTO ADJUNTOS:\n`
          textAttachments.forEach((att, idx) => {
            prompt += `\nArchivo ${idx + 1}: ${att.name} (${att.type})\n`
            prompt += `Contenido:\n${att.content}\n`
          })
        }

        // Para imágenes, agregamos información sobre ellas al prompt
        prompt += `\nIMÁGENES ADJUNTAS:\n`
        imageAttachments.forEach((att, idx) => {
          prompt += `\nImagen ${idx + 1}: ${att.name}\n`
          // El contenido de la imagen está en base64, lo incluimos en el prompt
          prompt += `Datos de imagen: ${att.content}\n`
        })
      } else {
        // Solo archivos de texto
        prompt += `\nARCHIVOS ADJUNTOS:\n`
        attachments.forEach((att, idx) => {
          prompt += `\nArchivo ${idx + 1}: ${att.name} (${att.type})\n`
          prompt += `Contenido:\n${att.content}\n`
        })
        prompt += `\nPor favor, analiza estos archivos en el contexto del sistema de producción gráfica.\n`
      }
    }

    if (conversationHistory) {
      prompt += `\nHISTORIAL DE CONVERSACIÓN:\n${conversationHistory}\n\n`
    }

    prompt += `\nPlotAI: Responde de manera útil y contextualizada.`

    // Usar el nuevo SDK
    const response = await ai.models.generateContent({
      model,
      contents: prompt
    })

    // El nuevo SDK devuelve response.text directamente
    return response.text || ''
  } catch (error) {
    console.error('Error generando contenido con PlotAI:', error)
    throw new Error(
      error instanceof Error 
        ? `Error al generar contenido: ${error.message}`
        : 'Error desconocido al generar contenido'
    )
  }
}

