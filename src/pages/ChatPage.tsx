import { useState, useRef, useEffect } from 'react'
import type { TeamMember } from '../types/board'
import { teamMembers } from '../data/mockData'
import './ChatPage.css'

type ChatMessage = {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: Date
  channel: string
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

const ChatPage = ({ onBack }: { onBack: () => void }) => {
  const [currentChannel, setCurrentChannel] = useState<string>('general')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [currentUser] = useState<TeamMember>(teamMembers[0] || {
    id: 'user1',
    name: 'Usuario',
    role: 'Miembro',
    avatar: 'U',
    productivity: 0
  })
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
        userId: teamMembers[0]?.id || 'user1',
        userName: teamMembers[0]?.name || 'Sistema',
        userAvatar: teamMembers[0]?.avatar || 'S',
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
      const randomMember = teamMembers[Math.floor(Math.random() * teamMembers.length)]
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
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2>Plot Chat</h2>
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
            <span>MIEMBROS EN LÍNEA ({teamMembers.length})</span>
          </div>
          <div className="members-list">
            {teamMembers.map((member) => (
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
                    className={`message-wrapper ${isCurrentUser ? 'own-message' : ''}`}
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
                      <div className="message-text">{message.content}</div>
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

