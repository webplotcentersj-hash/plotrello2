import type { ActivityEvent, TeamMember } from '../types/board'
import './Header.css'

type HeaderProps = {
  teamMembers: TeamMember[]
  activity: ActivityEvent[]
}

const Header = ({ teamMembers, activity }: HeaderProps) => {
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
      <div>
        <p className="header-eyebrow">Trello Plot · Inteligencia visual para squads</p>
        <div className="header-line">
          <h1>
            Tablero táctico rápido <span>con estadísticas accionables</span>
          </h1>
          <div className="header-actions">
            <button className="ghost-button">Exportar métricas</button>
            <button className="brand-button">Optimizar sprint</button>
          </div>
        </div>
        <p className="header-subtitle">
          Seguimiento tipo Trello con analítica de movimientos y foco humano. Todo con el color
          eb671b como protagonista.
        </p>
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

