import type { ActivityEvent, TeamMember } from '../types/board'
import './Header.css'

type HeaderProps = {
  teamMembers: TeamMember[]
  activity: ActivityEvent[]
  onAddNewOrder?: () => void
  onOptimizeSprint?: () => void
  onNavigateToStats?: () => void
}

const Header = ({ teamMembers, activity, onAddNewOrder, onOptimizeSprint, onNavigateToStats }: HeaderProps) => {
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
        <h1>Tablero Plot Trello</h1>
        <div className="header-actions">
          {onAddNewOrder && (
            <button className="brand-button" onClick={onAddNewOrder}>
              + Agregar Nueva Orden
            </button>
          )}
          {onNavigateToStats && (
            <button className="brand-button" onClick={onNavigateToStats}>
              📊 Estadísticas
            </button>
          )}
          {onOptimizeSprint && (
            <button className="brand-button" onClick={onOptimizeSprint}>
              Optimizar sprint
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

