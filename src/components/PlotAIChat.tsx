import { useState, useRef, useEffect, useMemo } from 'react'
import type { Task, TeamMember, ActivityEvent } from '../types/board'
import { generateContent, getSystemContext } from '../services/plotAIService'
import { buildAgenticContext } from '../utils/agentInsights'
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
  const agenticContext = useMemo(() => buildAgenticContext(tasks, activity, teamMembers), [tasks, activity, teamMembers])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  const handleSendMessage = async (forcedInput?: string) => {
    const messageText = forcedInput ?? input
    const filesToSend = forcedInput ? [] : uploadedFiles

    if (!messageText.trim() && filesToSend.length === 0) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      attachments:
        filesToSend.length > 0
          ? await Promise.all(
              filesToSend.map(async (file) => ({
                name: file.name,
                type: file.type,
                content: await analyzeFile(file)
              }))
            )
          : undefined
    }

    setMessages((prev) => [...prev, userMessage])
    if (!forcedInput) {
      setInput('')
      setUploadedFiles([])
    }
    setIsLoading(true)

    try {
      const systemContext = getSystemContext(tasks, activity, teamMembers)
      const hasImages = userMessage.attachments?.some((att) => att.type.startsWith('image/'))
      
      // Usar gemini-2.5-flash (o gemini-pro-vision si hay imágenes)
      const modelName = hasImages ? 'gemini-2.5-flash' : 'gemini-2.5-flash'

      // Mantener historial de conversación (últimos 5 mensajes)
      const recentMessages = messages.slice(-5)
      const conversationHistory = recentMessages
        .map((msg) => `${msg.role === 'user' ? 'Usuario' : 'PlotAI'}: ${msg.content}`)
        .join('\n\n')

      const userPrompt = `PREGUNTA DEL USUARIO:\n${userMessage.content}`

      const response = await generateContent({
        model: modelName,
        contents: userPrompt,
        systemContext,
        conversationHistory,
        attachments: userMessage.attachments,
        agenticContext
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error en PlotAI:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error 
          ? `Error: ${error.message}`
          : 'Lo siento, hubo un error al procesar tu mensaje. Por favor, verifica tu API key de Gemini o intenta nuevamente.',
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

  const handleSuggestedAction = (prompt: string) => {
    handleSendMessage(prompt)
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

        <div className="plotai-intel-panel">
          <div className="intel-section">
            <div className="intel-header">
              <span className="intel-label alert">Alertas críticas</span>
            </div>
            <div className="intel-list">
              {(agenticContext.alerts.length > 0 ? agenticContext.alerts : ['Sin alertas críticas detectadas']).map(
                (alert, idx) => (
                  <div key={`alert-${idx}`} className="intel-pill">
                    {alert}
                  </div>
                )
              )}
            </div>
          </div>
          <div className="intel-section">
            <div className="intel-header">
              <span className="intel-label opportunity">Oportunidades</span>
            </div>
            <div className="intel-list">
              {(agenticContext.opportunities.length > 0
                ? agenticContext.opportunities
                : ['Sin oportunidades destacadas']).map((item, idx) => (
                <div key={`opp-${idx}`} className="intel-pill">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="intel-section">
            <div className="intel-header">
              <span className="intel-label actions">Acciones agénticas</span>
            </div>
            <div className="intel-actions">
              {agenticContext.suggestedActions.map((action) => (
                <button
                  key={action.id}
                  className="agent-action"
                  onClick={() => handleSuggestedAction(action.prompt)}
                  disabled={isLoading}
                >
                  <strong>{action.label}</strong>
                  <span>{action.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

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
              onClick={() => handleSendMessage()}
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

