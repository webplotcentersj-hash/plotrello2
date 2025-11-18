import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { ActivityEvent, Task, TeamMember } from '../types/board'
import { movementByMember, statusDistribution, throughputSeries, workloadByMember } from '../utils/stats'
import './StatsPanel.css'

type StatsPanelProps = {
  tasks: Task[]
  activity: ActivityEvent[]
  teamMembers: TeamMember[]
}

const StatsPanel = ({ tasks, activity, teamMembers }: StatsPanelProps) => {
  const distribution = statusDistribution(tasks)
  const throughput = throughputSeries(activity, 7)
  const workload = workloadByMember(tasks, teamMembers)
  const movementLeaders = movementByMember(activity, teamMembers)

  const completionRate = ((distribution['done'] ?? 0) / Math.max(tasks.length, 1)) * 100
  const focusIndicator = ((distribution['in-progress'] ?? 0) / Math.max(tasks.length, 1)) * 100

  return (
    <section className="stats-panel">
      <header>
        <div>
          <p className="panel-title">Estadísticas Trello Plot</p>
          <h3>Rendimiento del squad</h3>
        </div>
        <span className="pulse">viva · realtime</span>
      </header>

      <div className="metric-cards">
        <article>
          <span>Entrega confirmada</span>
          <strong>{completionRate.toFixed(0)}%</strong>
          <small>{distribution['done'] ?? 0} tarjetas entregadas</small>
        </article>
        <article>
          <span>Foco en ejecución</span>
          <strong>{focusIndicator.toFixed(0)}%</strong>
          <small>{distribution['in-progress'] ?? 0} tarjetas en curso</small>
        </article>
      </div>

      <div className="chart-block">
        <div className="chart-head">
          <h4>Movimientos a done · últimos 7 días</h4>
          <span>{throughput.reduce((acc, item) => acc + item.total, 0)} entregas</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={throughput}>
            <defs>
              <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eb671b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#eb671b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: '#0f111c',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            />
            <Area type="monotone" dataKey="total" stroke="#eb671b" fill="url(#brandGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-block">
        <div className="chart-head">
          <h4>Carga por persona</h4>
          <span>Historias actuales</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={workload}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: '#0f111c',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            />
            <Bar dataKey="total" fill="#ff914d" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="leaders">
        <h4>Movimientos destacados</h4>
        <ul>
          {movementLeaders.slice(0, 3).map((entry) => (
            <li key={entry.member.id}>
              <div className="leader-avatar">{entry.member.avatar}</div>
              <div>
                <strong>{entry.member.name}</strong>
                <small>{entry.member.role}</small>
              </div>
              <span>{entry.moves} cambios</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default StatsPanel

