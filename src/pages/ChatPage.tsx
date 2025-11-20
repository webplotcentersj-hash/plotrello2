import { useState, useRef, useEffect } from 'react'
import type { TeamMember } from '../types/board'
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

const ChatPage = ({ onBack, teamMembers }: { onBack: () => void; teamMembers: TeamMember[] }) => {
  const resolvedMembers =
    teamMembers.length > 0
      ? teamMembers
      : [
          {
            id: 'user1',
            name: 'Usuario',
            role: 'Miembro',
            avatar: 'U',
            productivity: 0
          }
        ]
  const [currentChannel, setCurrentChannel] = useState<string>('general')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [currentUser] = useState<TeamMember>(resolvedMembers[0])
  const [isShaking, setIsShaking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Cargar mensajes iniciales del canal
    const initialMessages: ChatMessage[] = [
      {
        id: '1',
        userId: resolvedMembers[0]?.id || 'user1',
        userName: resolvedMembers[0]?.name || 'Sistema',
        userAvatar: resolvedMembers[0]?.avatar || 'S',
        content: `¡Bienvenido al canal ${CHANNELS.find((c) => c.id === currentChannel)?.name}! 👋`,
        timestamp: new Date(Date.now() - 3600000),
        channel: currentChannel
      }
    ]
    setMessages(initialMessages)
  }, [currentChannel])

  const handleSendMessage = () => {
    if (!input.trim()) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: input.trim(),
      timestamp: new Date(),
      channel: currentChannel
    }

    setMessages((prev) => [...prev, newMessage])
    setInput('')
    
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    // Simular respuesta automática después de 2 segundos
    setTimeout(() => {
      const randomMember = resolvedMembers[Math.floor(Math.random() * resolvedMembers.length)]
      if (randomMember && Math.random() > 0.7) {
        const responses = [
          'Entendido 👍',
          'Perfecto, lo reviso',
          'Gracias por la info',
          'De acuerdo',
          'Voy a verificar eso'
        ]
        const autoMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          userId: randomMember.id,
          userName: randomMember.name,
          userAvatar: randomMember.avatar,
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date(),
          channel: currentChannel
        }
        setMessages((prev) => [...prev, autoMessage])
      }
    }, 2000)
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
  const handleSendBuzz = (targetUserId?: string) => {
    // Buscar un usuario diferente al actual
    const availableUsers = resolvedMembers.filter((m) => m.id !== currentUser.id)
    if (availableUsers.length === 0) return

    const targetUser = targetUserId 
      ? resolvedMembers.find((m) => m.id === targetUserId && m.id !== currentUser.id)
      : availableUsers[Math.floor(Math.random() * availableUsers.length)]

    if (!targetUser) return

    const buzzMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: `🔔 Zumbido enviado a ${targetUser.name}`,
      timestamp: new Date(),
      channel: currentChannel,
      type: 'buzz'
    }

    setMessages((prev) => [...prev, buzzMessage])

    // Simular que el zumbido llega al usuario (en producción esto sería una notificación real)
    setTimeout(() => {
      // Mostrar notificación de zumbido recibido desde la perspectiva del destinatario
      const receivedBuzz: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: targetUser.id,
        userName: targetUser.name,
        userAvatar: targetUser.avatar,
        content: `🔔 ${currentUser.name} te envió un zumbido`,
        timestamp: new Date(),
        channel: currentChannel,
        type: 'buzz'
      }
      setMessages((prev) => [...prev, receivedBuzz])
    }, 500)
  }

  // Función para enviar alerta con sirena
  const handleSendAlert = (targetUserId?: string) => {
    // Buscar un usuario diferente al actual
    const availableUsers = resolvedMembers.filter((m) => m.id !== currentUser.id)
    if (availableUsers.length === 0) return

    const targetUser = targetUserId 
      ? resolvedMembers.find((m) => m.id === targetUserId && m.id !== currentUser.id)
      : availableUsers[Math.floor(Math.random() * availableUsers.length)]

    if (!targetUser) return

    // Reproducir sonido de sirena
    playAlertSound()

    const alertMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: `🚨 Alerta enviada a ${targetUser.name}`,
      timestamp: new Date(),
      channel: currentChannel,
      type: 'alert'
    }

    setMessages((prev) => [...prev, alertMessage])

    // Simular que la alerta llega al usuario
    setTimeout(() => {
      // Mostrar notificación de alerta recibida desde la perspectiva del destinatario
      const receivedAlert: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: targetUser.id,
        userName: targetUser.name,
        userAvatar: targetUser.avatar,
        content: `🚨 ${currentUser.name} te envió una ALERTA`,
        timestamp: new Date(),
        channel: currentChannel,
        type: 'alert'
      }
      setMessages((prev) => [...prev, receivedAlert])
    }, 500)
  }

  // Efecto para detectar zumbidos y alertas recibidos
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && (lastMessage.type === 'buzz' || lastMessage.type === 'alert')) {
      // Solo activar si el mensaje indica que fue recibido (contiene "te envió")
      if (lastMessage.content.includes('te envió')) {
        triggerShake()
        if (lastMessage.type === 'alert') {
          playAlertSound()
        }
      }
    }
  }, [messages])

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
            {channelMessages.length === 0 ? (
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

