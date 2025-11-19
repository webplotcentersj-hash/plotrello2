import { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Task, TeamMember, ActivityEvent } from '../types/board'
import { BOARD_COLUMNS } from '../data/mockData'
import './PlotAIChat.css'

type PlotAIChatProps = {
  tasks: Task[]
  activity: ActivityEvent[]
  teamMembers: TeamMember[]
  onClose: () => void
}

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  attachments?: Array<{ name: string; type: string; content: string }>
}

const PlotAIChat = ({ tasks, activity, teamMembers, onClose }: PlotAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy PlotAI, tu asistente inteligente para el sistema Trello Plot. Puedo ayudarte a:\n\n- Analizar el estado de las tareas y órdenes\n- Identificar cuellos de botella y problemas\n- Generar reportes y estadísticas\n- Analizar archivos que subas\n- Responder preguntas sobre el sistema\n- Sugerir optimizaciones\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
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

  const analyzeFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64 = (e.target?.result as string).split(',')[1]
          resolve(`[IMAGEN_BASE64:${base64}:${file.name}]`)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      } else if (file.type === 'application/pdf') {
        // Para PDFs, leemos como texto si es posible
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          resolve(`[PDF: ${file.name}, Tamaño: ${file.size} bytes, Contenido parcial: ${content.substring(0, 1000)}]`)
        }
        reader.onerror = () => {
          resolve(`[PDF: ${file.name}, Tamaño: ${file.size} bytes - No se pudo leer el contenido]`)
        }
        reader.readAsText(file)
      } else if (file.type.startsWith('text/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve(e.target?.result as string)
        }
        reader.onerror = reject
        reader.readAsText(file)
      } else {
        resolve(`[Archivo: ${file.name}, Tipo: ${file.type}, Tamaño: ${file.size} bytes]`)
      }
    })
  }

  const handleSendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return
    if (!genAI) {
      alert('API key de Gemini no configurada. Por favor, configura VITE_GEMINI_API_KEY en tu archivo .env')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: uploadedFiles.length > 0 ? await Promise.all(
        uploadedFiles.map(async (file) => ({
          name: file.name,
          type: file.type,
          content: await analyzeFile(file)
        }))
      ) : undefined
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const systemContext = getSystemContext()
      const hasImages = userMessage.attachments?.some((att) => att.type.startsWith('image/'))
      
      // Usar gemini-pro-vision si hay imágenes, sino gemini-pro
      const modelName = hasImages ? 'gemini-pro-vision' : 'gemini-pro'
      const model = genAI.getGenerativeModel({ model: modelName })

      let prompt = `Eres PlotAI, un asistente inteligente AGÉNTICO especializado en gestión de producción gráfica e imprenta. Tienes acceso completo al sistema y puedes:

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

      // Mantener historial de conversación (últimos 5 mensajes)
      const recentMessages = messages.slice(-5)
      const conversationHistory = recentMessages
        .map((msg) => `${msg.role === 'user' ? 'Usuario' : 'PlotAI'}: ${msg.content}`)
        .join('\n\n')

      if (hasImages && userMessage.attachments) {
        // Para imágenes, usar la API de visión
        const imageAttachments = userMessage.attachments.filter((att) => att.type.startsWith('image/'))
        const textAttachments = userMessage.attachments.filter((att) => !att.type.startsWith('image/'))
        
        const imageParts = imageAttachments
          .map((att) => {
            const base64Match = att.content.match(/\[IMAGEN_BASE64:(.+?):(.+?)\]/)
            if (base64Match) {
              return {
                inlineData: {
                  data: base64Match[1],
                  mimeType: att.type
                }
              }
            }
            return null
          })
          .filter((part): part is { inlineData: { data: string; mimeType: string } } => part !== null)

        if (textAttachments.length > 0) {
          prompt += `\nARCHIVOS DE TEXTO ADJUNTOS:\n`
          textAttachments.forEach((att, idx) => {
            prompt += `\nArchivo ${idx + 1}: ${att.name} (${att.type})\n`
            prompt += `Contenido:\n${att.content}\n`
          })
        }

        prompt += `\nPREGUNTA DEL USUARIO:\n${userMessage.content}\n\n`
        if (conversationHistory) {
          prompt += `HISTORIAL DE CONVERSACIÓN:\n${conversationHistory}\n\n`
        }
        prompt += `PlotAI: Analiza las imágenes adjuntas en el contexto del sistema de producción gráfica y responde de manera útil y contextualizada.`

        const result = await model.generateContent([prompt, ...imageParts])
        const response = await result.response
        const text = response.text()

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: text,
          timestamp: new Date()
        }

        setMessages((prev) => [...prev, assistantMessage])
      } else {
        // Para texto sin imágenes
        if (userMessage.attachments && userMessage.attachments.length > 0) {
          prompt += `\nARCHIVOS ADJUNTOS:\n`
          userMessage.attachments.forEach((att, idx) => {
            prompt += `\nArchivo ${idx + 1}: ${att.name} (${att.type})\n`
            prompt += `Contenido:\n${att.content}\n`
          })
          prompt += `\nPor favor, analiza estos archivos en el contexto del sistema de producción gráfica.\n`
        }

        prompt += `\nPREGUNTA DEL USUARIO:\n${userMessage.content}\n\n`
        if (conversationHistory) {
          prompt += `HISTORIAL DE CONVERSACIÓN:\n${conversationHistory}\n\n`
        }
        prompt += `PlotAI: Responde de manera útil y contextualizada.`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: text,
          timestamp: new Date()
        }

        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error en PlotAI:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, verifica tu API key de Gemini o intenta nuevamente.',
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setUploadedFiles([])
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="plotai-overlay" onClick={onClose}>
      <div className="plotai-chat" onClick={(e) => e.stopPropagation()}>
        <header className="plotai-header">
          <div className="plotai-header-content">
            <div>
              <h2>🤖 PlotAI</h2>
              <p>Asistente Inteligente con Capacidad Agéntica</p>
            </div>
            <button className="plotai-close" onClick={onClose}>
              ×
            </button>
          </div>
        </header>

        <div className="plotai-messages">
          {messages.map((message) => (
            <div key={message.id} className={`plotai-message ${message.role}`}>
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="message-attachments">
                    {message.attachments.map((att, idx) => (
                      <div key={idx} className="attachment-item">
                        📎 {att.name}
                      </div>
                    ))}
                  </div>
                )}
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
            <div className="plotai-message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="plotai-input-area">
          {uploadedFiles.length > 0 && (
            <div className="uploaded-files">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="file-chip">
                  <span>📎 {file.name}</span>
                  <button onClick={() => removeFile(index)}>×</button>
                </div>
              ))}
            </div>
          )}
          <div className="input-container">
            <button
              className="attach-button"
              onClick={() => fileInputRef.current?.click()}
              title="Adjuntar archivo"
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
              rows={1}
              className="plotai-textarea"
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlotAIChat

