import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { BOARD_COLUMNS } from '../data/mockData'
import type { ActivityEvent, Task, TeamMember } from '../types/board'
import './StatisticsPage.css'

type StatisticsPageProps = {
  tasks: Task[]
  activity: ActivityEvent[]
  teamMembers: TeamMember[]
  onBack: () => void
}

const COLORS = {
  'Almacén de Entrega': '#fbbf24',
  'Entregado o Instalado': '#4b5563',
  'Imprenta (Área de Impresión)': '#ef4444',
  'Mostrador': '#3b82f6',
  'Pendiente': '#9ca3af',
  'Taller Gráfico': '#dc2626',
  'En Espera': '#60a5fa',
  'Finalizado en Taller': '#22c55e',
  'Instalaciones': '#f97316',
  'Taller de Imprenta': '#86efac'
}

const StatisticsPage = ({ tasks, activity, teamMembers, onBack }: StatisticsPageProps) => {
  // 1. Órdenes por Estado (Donut Chart)
  const ordersByStatus = useMemo(() => {
    const statusCounts: Record<string, number> = {}
    tasks.forEach((task) => {
      const column = BOARD_COLUMNS.find((col) => col.id === task.status)
      const label = column?.label || task.status
      statusCounts[label] = (statusCounts[label] || 0) + 1
    })
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: COLORS[name as keyof typeof COLORS] || '#6b7280'
    }))
  }, [tasks])

  // 2. Top 5 Clientes
  const topClients = useMemo(() => {
    const clientCounts: Record<string, number> = {}
    tasks.forEach((task) => {
      const client = task.title
      clientCounts[client] = (clientCounts[client] || 0) + 1
    })
    return Object.entries(clientCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        color: `hsl(${30 + index * 15}, 70%, ${60 - index * 5}%)`
      }))
  }, [tasks])

  // 3. Distribución por Sector
  const distributionBySector = useMemo(() => {
    const sectorCounts: Record<string, number> = {}
    tasks.forEach((task) => {
      const sector = task.assignedSector || 'Sin sector'
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1
    })
    return Object.entries(sectorCounts).map(([name, value], index) => ({
      name,
      value,
      color: index === 0 ? '#3b82f6' : '#22c55e'
    }))
  }, [tasks])

  // 4. Carga de Trabajo por Operario
  const workloadByOperator = useMemo(() => {
    const operatorCounts: Record<string, number> = {}
    tasks.forEach((task) => {
      const member = teamMembers.find((m) => m.id === task.ownerId)
      const operatorName = member?.name || 'Otro'
      operatorCounts[operatorName] = (operatorCounts[operatorName] || 0) + 1
    })
    return Object.entries(operatorCounts).map(([name, value]) => ({
      name,
      Órdenes: value
    }))
  }, [tasks, teamMembers])

  // 5. Movimientos por Usuario
  const movementsByUser = useMemo(() => {
    const userMovements: Record<string, number> = {}
    activity.forEach((event) => {
      const member = teamMembers.find((m) => m.id === event.actorId)
      const userName = member?.name || event.actorId
      userMovements[userName] = (userMovements[userName] || 0) + 1
    })
    return Object.entries(userMovements)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        Movimientos: value
      }))
  }, [activity, teamMembers])

  // 6. Tiempo Promedio de Reacción por Usuario
  const reactionTimeByUser = useMemo(() => {
    const userReactionTimes: Record<string, { total: number; count: number }> = {}
    
    activity.forEach((event) => {
      const member = teamMembers.find((m) => m.id === event.actorId)
      const userName = member?.name || event.actorId
      
      if (!userReactionTimes[userName]) {
        userReactionTimes[userName] = { total: 0, count: 0 }
      }
      
      // Calcular tiempo de reacción (simulado basado en timestamp)
      const eventTime = new Date(event.timestamp).getTime()
      const now = Date.now()
      const hoursDiff = (now - eventTime) / (1000 * 60 * 60)
      
      userReactionTimes[userName].total += hoursDiff
      userReactionTimes[userName].count += 1
    })
    
    return Object.entries(userReactionTimes)
      .map(([name, data]) => ({
        name,
        'Tiempo Promedio (horas)': data.count > 0 ? data.total / data.count : 0
      }))
      .sort((a, b) => b['Tiempo Promedio (horas)'] - a['Tiempo Promedio (horas)'])
  }, [activity, teamMembers])

  // 7. Tiempo Promedio por Estado (Bottleneck Detection)
  const avgTimeByStatus = useMemo(() => {
    const statusTimes: Record<string, { total: number; count: number }> = {}
    
    tasks.forEach((task) => {
      const column = BOARD_COLUMNS.find((col) => col.id === task.status)
      const statusName = column?.label || task.status
      
      if (!statusTimes[statusName]) {
        statusTimes[statusName] = { total: 0, count: 0 }
      }
      
      const updatedTime = new Date(task.updatedAt).getTime()
      const now = Date.now()
      const daysDiff = (now - updatedTime) / (1000 * 60 * 60 * 24)
      
      statusTimes[statusName].total += daysDiff
      statusTimes[statusName].count += 1
    })
    
    return Object.entries(statusTimes)
      .map(([name, data]) => ({
        name,
        'Tiempo Promedio (días)': data.count > 0 ? data.total / data.count : 0
      }))
      .sort((a, b) => b['Tiempo Promedio (días)'] - a['Tiempo Promedio (días)'])
  }, [tasks])

  // 8. Registro de Actividad Cronológico
  const chronologicalActivity = useMemo(() => {
    return [...activity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50)
      .map((event) => {
        const member = teamMembers.find((m) => m.id === event.actorId)
        const fromColumn = BOARD_COLUMNS.find((col) => col.id === event.from)
        const toColumn = BOARD_COLUMNS.find((col) => col.id === event.to)
        
        return {
          fechaHora: new Date(event.timestamp).toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          usuario: member?.name || '',
          opNumber: `#${tasks.find((t) => t.id === event.taskId)?.opNumber || 'N/A'}`,
          movimiento: `${fromColumn?.label || event.from} → ${toColumn?.label || event.to}`
        }
      })
  }, [activity, teamMembers, tasks])

  // 9. Fichas Estancadas (> 3 días en el mismo estado)
  const stalledTasks = useMemo(() => {
    const now = Date.now()
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000
    
    return tasks
      .filter((task) => {
        const updatedTime = new Date(task.updatedAt).getTime()
        return now - updatedTime > threeDaysInMs
      })
      .map((task) => {
        const column = BOARD_COLUMNS.find((col) => col.id === task.status)
        const daysStalled = Math.floor((now - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          opNumber: task.opNumber,
          client: task.title,
          sector: task.assignedSector,
          status: column?.label || task.status,
          daysStalled
        }
      })
      .sort((a, b) => b.daysStalled - a.daysStalled)
  }, [tasks])

  return (
    <div className="statistics-page">
      <header className="stats-header">
        <div className="stats-header-content">
          <button className="back-button" onClick={onBack}>
            ← Volver al Tablero
          </button>
          <h1>Estadísticas y Reportes</h1>
        </div>
      </header>

      <div className="stats-container">
        {/* Primera fila: Gráficos circulares */}
        <div className="stats-row">
          <div className="stat-card">
            <h3>Órdenes por Estado</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="stat-card">
            <h3>Top 5 Clientes (por N° de trabajos)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topClients}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topClients.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="stat-card">
            <h3>Distribución por Sector</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionBySector}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionBySector.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segunda fila: Gráficos de barras */}
        <div className="stats-row">
          <div className="stat-card">
            <h3>Carga de Trabajo por Operario</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workloadByOperator}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Órdenes" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stat-card">
            <h3>Movimientos por Usuario</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={movementsByUser}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Movimientos" fill="#a855f7" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="stat-card">
            <h3>Tiempo Promedio de Reacción por Usuario</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reactionTimeByUser}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Tiempo Promedio (horas)" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tercera fila: Tiempo promedio por estado */}
        <div className="stats-row">
          <div className="stat-card full-width">
            <h3>Tiempo Promedio por Estado (Detección de Cuellos de Botella)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={avgTimeByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Tiempo Promedio (días)" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cuarta fila: Tablas */}
        <div className="stats-row">
          <div className="stat-card full-width">
            <h3>Registro de Actividad Cronológico</h3>
            <div className="table-container">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>FECHA Y HORA</th>
                    <th>USUARIO</th>
                    <th>N° OP</th>
                    <th>MOVIMIENTO</th>
                  </tr>
                </thead>
                <tbody>
                  {chronologicalActivity.map((item, index) => (
                    <tr key={index}>
                      <td>{item.fechaHora}</td>
                      <td>{item.usuario || '-'}</td>
                      <td>{item.opNumber}</td>
                      <td>{item.movimiento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quinta fila: Fichas estancadas */}
        <div className="stats-row">
          <div className="stat-card full-width">
            <h3 className="stalled-title">Informe de Fichas Estancadas (&gt; 3 días en el mismo estado)</h3>
            <div className="stalled-list">
              {stalledTasks.length === 0 ? (
                <p className="no-stalled">✅ No hay fichas estancadas</p>
              ) : (
                <ul>
                  {stalledTasks.map((task, index) => (
                    <li key={index}>
                      <strong>OP #{task.opNumber}</strong> ({task.client}
                      {task.sector && ` - ${task.sector}`}) - Atascada en{' '}
                      <strong>{task.status}</strong> por <strong>{task.daysStalled} días</strong>.
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatisticsPage

