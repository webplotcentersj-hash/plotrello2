import { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Task, TeamMember, ActivityEvent } from '../types/board'
import { BOARD_COLUMNS } from '../data/mockData'
import './ChatAI.css'

type ChatAIProps = {
  tasks: Task[]
  teamMembers: TeamMember[]
  activity: ActivityEvent[]
  onClose: () => void
}

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments?: Array<{ name: string; type: string; content: string }>
}

const ChatAI = ({ tasks, teamMembers, activity, onClose }: ChatAIProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy PlotAI, tu asistente inteligente para el sistema Trello Plot. Puedo ayudarte a:\n\n- Analizar tareas y órdenes de trabajo\n- Consultar estadísticas y métricas\n- Identificar cuellos de botella\n- Analizar archivos que subas\n- Responder preguntas sobre el estado del proyecto\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
  const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getSystemContext = () => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === 'almacen-entrega').length
    const inProgressTasks = tasks.filter((t) => 
      !['diseno-grafico', 'almacen-entrega'].includes(t.status)
    ).length

    const statusDistribution = tasks.reduce((acc, task) => {
      const column = BOARD_COLUMNS.find((col) => col.id === task.status)
      const statusName = column?.label || task.status
      acc[statusName] = (acc[statusName] || 0) + 1
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
      const task = tasks.find((t) => t.id === event.taskId)
      const fromCol = BOARD_COLUMNS.find((col) => col.id === event.from)
      const toCol = BOARD_COLUMNS.find((col) => col.id === event.to)
      return {
        op: task?.opNumber || 'N/A',
        from: fromCol?.label || event.from,
        to: toCol?.label || event.to,
        timestamp: event.timestamp
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

  const analyzeFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          
          if (file.type.startsWith('image/')) {
            // Para imágenes, convertir a base64
            resolve(`[Imagen: ${file.name}, Tipo: ${file.type}, Tamaño: ${file.size} bytes]`)
          } else if (file.type === 'application/pdf' || file.type.includes('text')) {
            // Para PDFs y textos, intentar leer el contenido
            if (file.type.includes('text')) {
              resolve(content)
            } else {
              resolve(`[PDF: ${file.name}, Tamaño: ${file.size} bytes]`)
            }
          } else {
            resolve(`[Archivo: ${file.name}, Tipo: ${file.type}, Tamaño: ${file.size} bytes]`)
          }
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file)
      } else if (file.type.includes('text')) {
        reader.readAsText(file)
      } else {
        reader.readAsDataURL(file)
      }
    })
  }

  const handleSend = async () => {
    if (!input.trim() && attachedFiles.length === 0) return
    if (!genAI) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: '❌ Error: API key de Gemini no configurada. Por favor, configura VITE_GEMINI_API_KEY en tu archivo .env',
          timestamp: new Date()
        }
      ])
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? await Promise.all(
        attachedFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          content: await analyzeFile(file)
        }))
      ) : undefined
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setAttachedFiles([])
    setIsLoading(true)

    try {
      const systemContext = getSystemContext()
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

      // Construir el contexto del sistema
      const systemPrompt = `Eres PlotAI, un asistente inteligente especializado en gestión de proyectos de producción gráfica e imprenta. Tienes acceso completo al sistema Trello Plot.

CONTEXTO DEL SISTEMA:
- Total de tareas: ${systemContext.totalTasks}
- Tareas completadas: ${systemContext.completedTasks}
- Tareas en progreso: ${systemContext.inProgressTasks}

DISTRIBUCIÓN POR ESTADO:
${Object.entries(systemContext.statusDistribution).map(([status, count]) => `- ${status}: ${count} tareas`).join('\n')}

CARGA DE TRABAJO POR MIEMBRO:
${systemContext.workloadByMember.map((w) => `- ${w.name}: ${w.taskCount} tareas (${w.highPriority} alta prioridad)`).join('\n')}

MIEMBROS DEL EQUIPO:
${systemContext.teamMembers.map((m) => `- ${m.name} (${m.role})`).join('\n')}

COLUMNAS DEL TABLERO:
${systemContext.columns.map((c) => `- ${c.label} (${c.id}): ${c.description}`).join('\n')}

ACTIVIDAD RECIENTE:
${systemContext.recentActivity.map((a) => `- OP ${a.op}: ${a.from} → ${a.to} (${new Date(a.timestamp).toLocaleString('es-AR')})`).join('\n')}

CAPACIDADES AGÉNTICAS:
Puedes realizar las siguientes acciones:
1. Consultar información sobre tareas específicas (por OP, cliente, estado, etc.)
2. Analizar estadísticas y métricas del sistema
3. Identificar cuellos de botella y problemas
4. Analizar archivos que el usuario suba
5. Sugerir optimizaciones y mejoras
6. Responder preguntas sobre el estado del proyecto

INSTRUCCIONES:
- Sé conciso pero completo en tus respuestas
- Usa datos específicos del sistema cuando sea relevante
- Si el usuario sube archivos, analízalos y proporciona insights relevantes
- Proporciona recomendaciones accionables cuando sea apropiado
- Responde siempre en español

${userMessage.attachments && userMessage.attachments.length > 0 ? `\nARCHIVOS ADJUNTOS:\n${userMessage.attachments.map((att, i) => `Archivo ${i + 1}: ${att.name}\nTipo: ${att.type}\nContenido:\n${att.content.substring(0, 5000)}`).join('\n\n')}` : ''}

Pregunta del usuario: ${userMessage.content}`

      const result = await model.generateContent(systemPrompt)
      const response = await result.response
      const text = response.text()

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: text,
          timestamp: new Date()
        }
      ])
    } catch (error) {
      console.error('Error en chat:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ Error al procesar tu mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          timestamp: new Date()
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-ai-overlay" onClick={onClose}>
      <div className="chat-ai-container" onClick={(e) => e.stopPropagation()}>
        <header className="chat-ai-header">
          <div className="chat-ai-title">
            <h2>🤖 PlotAI</h2>
            <span className="chat-ai-subtitle">Asistente Inteligente con Capacidades Agénticas</span>
          </div>
          <button className="chat-ai-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="chat-ai-messages">
          {messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.role}`}>
              <div className="message-content">
                {message.attachments && message.attachments.length > 0 && (
                  <div className="message-attachments">
                    {message.attachments.map((att, idx) => (
                      <div key={idx} className="attachment-badge">
                        📎 {att.name}
                      </div>
                    ))}
                  </div>
                )}
                <div className="message-text">{message.content}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-message assistant">
              <div className="message-content">
                <div className="message-text">
                  <span className="typing-indicator">●</span>
                  <span className="typing-indicator">●</span>
                  <span className="typing-indicator">●</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {attachedFiles.length > 0 && (
          <div className="chat-ai-attachments">
            {attachedFiles.map((file, index) => (
              <div key={index} className="attachment-item">
                <span>📎 {file.name}</span>
                <button onClick={() => removeFile(index)}>×</button>
              </div>
            ))}
          </div>
        )}

        <div className="chat-ai-input-container">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,application/pdf,.txt,.doc,.docx"
          />
          <button
            className="chat-ai-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Adjuntar archivo"
          >
            📎
          </button>
          <textarea
            className="chat-ai-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={1}
          />
          <button
            className="chat-ai-send-btn"
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
          >
            {isLoading ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatAI

