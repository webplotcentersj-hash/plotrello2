import { useState, useRef, useEffect } from 'react'
import type { TeamMember } from '../types/board'
import { useAuth } from '../hooks/useAuth'
import { apiService } from '../services/api'
import { supabase } from '../services/supabaseClient'
import './ChatPage.css'

type ChatMessage = {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: Date
  channel: string
  type?: 'message' | 'buzz' | 'alert'
}

type Channel = {
  id: string
  name: string
  description: string
  unread?: number
}

const CHANNELS: Channel[] = [
  { id: 'general', name: '# general', description: 'Canal general del equipo' },
  { id: 'produccion', name: '# producción', description: 'Coordinación de producción' },
  { id: 'diseno', name: '# diseño', description: 'Diseño gráfico y creativo' },
  { id: 'imprenta', name: '# imprenta', description: 'Área de imprenta' },
  { id: 'instalaciones', name: '# instalaciones', description: 'Equipo de instalaciones' },
  { id: 'random', name: '# random', description: 'Conversaciones casuales' }
]

const chatChannelToRoom: Record<string, number> = {
  general: 1,
  'taller-grafico': 2,
  mostrador: 3,
  produccion: 1,
  diseno: 2,
  imprenta: 3,
  instalaciones: 1,
  random: 1
}

// Mapeo de canales a room_id (usando los mismos IDs que la API)
const getRoomIdForChannel = (channel: string): number => {
  return chatChannelToRoom[channel] ?? 1
}

const ChatPage = ({ onBack, teamMembers }: { onBack: () => void; teamMembers: TeamMember[] }) => {
  const { usuario } = useAuth()
  const resolvedMembers =
    teamMembers.length > 0
      ? teamMembers
      : [
          {
            id: usuario?.id.toString() || 'user1',
            name: usuario?.nombre || 'Usuario',
            role: 'Miembro',
            avatar: (usuario?.nombre || 'U').charAt(0).toUpperCase(),
            productivity: 0
          }
        ]
  const [currentChannel, setCurrentChannel] = useState<string>('general')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const realtimeSubscriptionRef = useRef<any>(null)
  const currentUser = resolvedMembers[0]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cargar mensajes reales del canal
  useEffect(() => {
    const loadMessages = async () => {
      if (!usuario?.id) return
      
      setIsLoadingMessages(true)
      try {
        const response = await apiService.getMensajesChat(currentChannel, 100)
        if (response.success && response.data) {
          const chatMessages: ChatMessage[] = response.data.map((msg) => ({
            id: msg.id.toString(),
            userId: msg.usuario_id.toString(),
            userName: msg.nombre_usuario || 'Usuario',
            userAvatar: (msg.nombre_usuario || 'U').charAt(0).toUpperCase(),
            content: msg.contenido,
            timestamp: new Date(msg.timestamp),
            channel: msg.canal || currentChannel,
            type: msg.tipo || 'message'
          }))
          setMessages(chatMessages)
        }
      } catch (error) {
        console.error('Error cargando mensajes:', error)
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadMessages()
  }, [currentChannel, usuario?.id])

  // Suscripción a Supabase Realtime para mensajes nuevos
  useEffect(() => {
    if (!supabase || !usuario?.id) return

    const roomId = getRoomIdForChannel(currentChannel)

    // Limpiar suscripción anterior
    if (realtimeSubscriptionRef.current && supabase) {
      supabase.removeChannel(realtimeSubscriptionRef.current)
    }

    // Crear nueva suscripción
    if (!supabase) return
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const newMsg = payload.new as any
          // Evitar duplicados: verificar si el mensaje ya existe
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id.toString())
            if (exists) return prev

            const chatMessage: ChatMessage = {
              id: newMsg.id.toString(),
              userId: newMsg.id_usuario.toString(),
              userName: newMsg.nombre_usuario || 'Usuario',
              userAvatar: (newMsg.nombre_usuario || 'U').charAt(0).toUpperCase(),
              content: newMsg.mensaje,
              timestamp: new Date(newMsg.timestamp),
              channel: currentChannel,
              type: newMsg.mensaje?.includes('zumbido') || newMsg.mensaje?.includes('Zumbido') ? 'buzz' : newMsg.mensaje?.includes('Atención') || newMsg.mensaje?.includes('ALERTA') ? 'alert' : 'message'
            }
            return [...prev, chatMessage]
          })
        }
      )
      .subscribe()

    realtimeSubscriptionRef.current = channel

    return () => {
      if (realtimeSubscriptionRef.current && supabase) {
        supabase.removeChannel(realtimeSubscriptionRef.current)
      }
    }
  }, [currentChannel, usuario?.id])

  const handleSendMessage = async () => {
    if (!input.trim() || !usuario?.id) return

    const content = input.trim()
    setInput('')
    
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      const response = await apiService.enviarMensajeChat({
        canal: currentChannel,
        contenido: content,
        usuario_id: usuario.id,
        tipo: 'message'
      })

      if (!response.success) {
        console.error('Error enviando mensaje:', response.error)
        // Revertir el input si falla
        setInput(content)
      }
      // El mensaje se agregará automáticamente vía Realtime
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      setInput(content)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Función para reproducir sonido de sirena
  const playAlertSound = () => {
    try {
      // Crear un audio context para generar el sonido de sirena
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configurar frecuencia de sirena (alternando entre dos tonos)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3)

      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.4)
    } catch (error) {
      console.error('Error al reproducir sonido:', error)
    }
  }

  // Función para activar animación de shake
  const triggerShake = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 500)
  }

  // Función para enviar zumbido
  const handleSendBuzz = async (targetUserId?: string) => {
    if (!usuario?.id) return

    // Buscar un usuario diferente al actual
    const availableUsers = resolvedMembers.filter((m) => m.id !== currentUser.id)
    if (availableUsers.length === 0) return

    const targetUser = targetUserId 
      ? resolvedMembers.find((m) => m.id === targetUserId && m.id !== currentUser.id)
      : availableUsers[Math.floor(Math.random() * availableUsers.length)]

    if (!targetUser) return

    try {
      const targetUserIdNum = parseInt(targetUser.id)
      if (isNaN(targetUserIdNum)) return

      await apiService.enviarZumbido(targetUserIdNum, usuario.id, currentChannel)
      // El mensaje se agregará automáticamente vía Realtime
    } catch (error) {
      console.error('Error enviando zumbido:', error)
    }
  }

  // Función para enviar alerta con sirena
  const handleSendAlert = async (targetUserId?: string) => {
    if (!usuario?.id) return

    // Buscar un usuario diferente al actual
    const availableUsers = resolvedMembers.filter((m) => m.id !== currentUser.id)
    if (availableUsers.length === 0) return

    const targetUser = targetUserId 
      ? resolvedMembers.find((m) => m.id === targetUserId && m.id !== currentUser.id)
      : availableUsers[Math.floor(Math.random() * availableUsers.length)]

    if (!targetUser) return

    // Reproducir sonido de sirena
    playAlertSound()

    try {
      const targetUserIdNum = parseInt(targetUser.id)
      if (isNaN(targetUserIdNum)) return

      await apiService.enviarAlerta(targetUserIdNum, usuario.id, currentChannel)
      // El mensaje se agregará automáticamente vía Realtime
    } catch (error) {
      console.error('Error enviando alerta:', error)
    }
  }

  // Efecto para detectar zumbidos y alertas recibidos
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && (lastMessage.type === 'buzz' || lastMessage.type === 'alert')) {
      // Activar si el mensaje es para el usuario actual (no es del usuario actual)
      if (lastMessage.userId !== currentUser.id) {
        triggerShake()
        if (lastMessage.type === 'alert') {
          playAlertSound()
        }
      }
    }
  }, [messages, currentUser.id])

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  const shouldShowAvatar = (currentIndex: number) => {
    if (currentIndex === 0) return true
    const currentMsg = messages[currentIndex]
    const previousMsg = messages[currentIndex - 1]
    return (
      currentMsg.userId !== previousMsg.userId ||
      currentMsg.timestamp.getTime() - previousMsg.timestamp.getTime() > 300000 // 5 minutos
    )
  }

  const channelMessages = messages.filter((msg) => msg.channel === currentChannel)

  return (
    <div className={`chat-page ${isShaking ? 'shaking' : ''}`}>
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img 
              src="https://trello.plotcenter.com.ar/Group%20187.png" 
              alt="Plot Center Logo" 
              className="sidebar-logo"
            />
            <h2>Plot Chat</h2>
          </div>
          <button className="back-button-small" onClick={onBack} title="Volver al tablero">
            ←
          </button>
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <span>CANALES</span>
          </div>
          <div className="channels-list">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                className={`channel-item ${currentChannel === channel.id ? 'active' : ''}`}
                onClick={() => setCurrentChannel(channel.id)}
              >
                <span className="channel-name">{channel.name}</span>
                {channel.unread && channel.unread > 0 && (
                  <span className="unread-badge">{channel.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <div className="section-header">
            <span>MIEMBROS EN LÍNEA ({resolvedMembers.length})</span>
          </div>
          <div className="members-list">
            {resolvedMembers.map((member) => (
              <div key={member.id} className="member-item">
                <div className="member-avatar">
                  <span>{member.avatar}</span>
                  <span className="online-indicator"></span>
                </div>
                <div className="member-info">
                  <span className="member-name">{member.name}</span>
                  <span className="member-role">{member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <div className="channel-info">
            <h3>{CHANNELS.find((c) => c.id === currentChannel)?.name}</h3>
            <p>{CHANNELS.find((c) => c.id === currentChannel)?.description}</p>
          </div>
          <div className="header-actions">
            <button className="header-action-btn" title="Información del canal">
              ℹ️
            </button>
            <button className="header-action-btn" title="Notificaciones">
              🔔
            </button>
            <button className="header-action-btn" title="Más opciones">
              ⋮
            </button>
          </div>
        </div>

        <div className="messages-container">
          <div className="messages-list">
            {isLoadingMessages ? (
              <div className="empty-state">
                <p>Cargando mensajes...</p>
              </div>
            ) : channelMessages.length === 0 ? (
              <div className="empty-state">
                <p>No hay mensajes en este canal todavía.</p>
                <p className="empty-hint">Sé el primero en escribir algo 👋</p>
              </div>
            ) : (
              channelMessages.map((message, index) => {
                const showAvatar = shouldShowAvatar(index)
                const isCurrentUser = message.userId === currentUser.id

                return (
                  <div
                    key={message.id}
                    className={`message-wrapper ${isCurrentUser ? 'own-message' : ''} ${message.type === 'buzz' ? 'buzz-message' : ''} ${message.type === 'alert' ? 'alert-message' : ''}`}
                  >
                    {showAvatar && (
                      <div className="message-avatar">
                        <span>{message.userAvatar}</span>
                      </div>
                    )}
                    {!showAvatar && <div className="message-spacer"></div>}
                    <div className="message-content">
                      {showAvatar && (
                        <div className="message-header">
                          <span className="message-author">{message.userName}</span>
                          <span className="message-time">{formatMessageTime(message.timestamp)}</span>
                        </div>
                      )}
                      <div className={`message-text ${message.type === 'buzz' ? 'buzz-text' : ''} ${message.type === 'alert' ? 'alert-text' : ''}`}>
                        {message.content}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="chat-input-area">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = `${e.target.scrollHeight}px`
              }}
              onKeyPress={handleKeyPress}
              placeholder={`Mensaje en ${CHANNELS.find((c) => c.id === currentChannel)?.name}`}
              rows={1}
              className="chat-input"
            />
            <div className="input-actions">
              <button
                className="input-action-btn buzz-btn"
                onClick={() => handleSendBuzz()}
                title="Enviar zumbido"
              >
                🔔
              </button>
              <button
                className="input-action-btn alert-btn"
                onClick={() => handleSendAlert()}
                title="Enviar alerta con sirena"
              >
                🚨
              </button>
              <button className="input-action-btn" title="Adjuntar archivo">
                📎
              </button>
              <button className="input-action-btn" title="Emoji">
                😊
              </button>
              <button
                className="send-button"
                onClick={handleSendMessage}
                disabled={!input.trim()}
                title="Enviar (Enter)"
              >
                ➤
              </button>
            </div>
          </div>
          <div className="input-hint">
            <span>Presiona Enter para enviar, Shift+Enter para nueva línea</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPage

