import type { ActivityEvent, TeamMember } from '../types/board'
import NotificationsDropdown from './NotificationsDropdown'
import './Header.css'

type HeaderProps = {
  teamMembers: TeamMember[]
  activity: ActivityEvent[]
  onAddNewOrder?: () => void
  onOptimizeSprint?: () => void
  onNavigateToStats?: () => void
  onNavigateToUsuarios?: () => void
  onOpenChatAI?: () => void
  onNavigateToChat?: () => void
  onLogout?: () => void
  isAdmin?: boolean
}

const Header = ({ teamMembers, activity, onAddNewOrder, onOptimizeSprint, onNavigateToStats, onNavigateToUsuarios, onOpenChatAI, onNavigateToChat, onLogout, isAdmin = false }: HeaderProps) => {
  const today = new Date()
  const movesToday = activity.filter((event) => {
    const eventDate = new Date(event.timestamp)
    return (
      eventDate.getFullYear() === today.getFullYear() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getDate() === today.getDate()
    )
  }).length

  const highPriority = teamMembers.length
  const activePeople = new Set(activity.map((event) => event.actorId)).size

  return (
    <header className="tp-header">
      <div className="header-line">
        <div className="header-brand">
          <img 
            src="https://trello.plotcenter.com.ar/Group%20187.png" 
            alt="Plot Center Logo" 
            className="header-logo"
          />
          <h1>Tablero Plot</h1>
        </div>
        <div className="header-actions">
          <NotificationsDropdown onNotificationClick={(notification) => {
            // Si es una notificación de mención del chat, navegar al chat
            if (notification.type === 'mention' && notification.description?.includes('te mencionó en')) {
              onNavigateToChat?.()
            }
          }} />
          {onAddNewOrder && (
            <button className="brand-button" onClick={onAddNewOrder}>
              + Agregar Nueva Orden
            </button>
          )}
          {onOpenChatAI && (
            <button className="brand-button ai-button" onClick={onOpenChatAI}>
              🤖 PlotAI
            </button>
          )}
          {onNavigateToChat && (
            <button className="brand-button chat-button" onClick={onNavigateToChat}>
              💬 Chat
            </button>
          )}
          {onNavigateToStats && isAdmin && (
            <button className="brand-button" onClick={onNavigateToStats}>
              📊 Estadísticas
            </button>
          )}
          {onNavigateToUsuarios && isAdmin && (
            <button className="brand-button" onClick={onNavigateToUsuarios}>
              👥 Usuarios
            </button>
          )}
          {onOptimizeSprint && (
            <button className="brand-button" onClick={onOptimizeSprint}>
              Optimizar sprint
            </button>
          )}
          <a
            href="https://tools.plotcenter.com.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className="brand-button tools-button"
          >
            🔧 Herramientas
          </a>
          {onLogout && (
            <button className="brand-button logout-button" onClick={onLogout} title="Cerrar sesión">
              🚪 Salir
            </button>
          )}
        </div>
      </div>

      <div className="header-stats">
        <div className="header-stat-card">
          <span>Movimientos hoy</span>
          <strong>{movesToday}</strong>
        </div>
        <div className="header-stat-card">
          <span>Personas activas</span>
          <strong>{activePeople}</strong>
        </div>
        <div className="header-stat-card">
          <span>Squad Trello Plot</span>
          <strong>{highPriority}</strong>
        </div>
      </div>
    </header>
  )
}

export default Header

