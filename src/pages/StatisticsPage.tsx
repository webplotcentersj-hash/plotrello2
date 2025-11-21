import { useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { useAuth } from '../hooks/useAuth'
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
  const { isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  // Proteger la ruta: solo administradores pueden acceder
  useEffect(() => {
    if (!loading && !isAdmin) {
      // Redirigir al tablero si no es administrador
      navigate('/')
    }
  }, [isAdmin, loading, navigate])

  // Validar que los datos sean arrays válidos
  const safeTasks = Array.isArray(tasks) ? tasks : []
  const safeActivity = Array.isArray(activity) ? activity : []
  const safeTeamMembers = Array.isArray(teamMembers) ? teamMembers : []

  // Mostrar mensaje de acceso denegado mientras se verifica
  if (loading) {
    return (
      <div className="statistics-page">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="statistics-page">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
          <p>Solo los administradores pueden ver las estadísticas.</p>
          <button onClick={onBack} className="back-button" style={{ marginTop: '20px' }}>
            Volver al Tablero
          </button>
        </div>
      </div>
    )
  }
  // 1. Órdenes por Estado (Donut Chart)
  const ordersByStatus = useMemo(() => {
    if (!safeTasks || safeTasks.length === 0) return []
    const statusCounts: Record<string, number> = {}
    safeTasks.forEach((task) => {
      if (!task || !task.status) return
      const column = BOARD_COLUMNS.find((col) => col.id === task.status)
      const label = column?.label || task.status
      statusCounts[label] = (statusCounts[label] || 0) + 1
    })
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: COLORS[name as keyof typeof COLORS] || '#6b7280'
    }))
  }, [safeTasks])

  // 2. Top 5 Clientes
  const topClients = useMemo(() => {
    if (!safeTasks || safeTasks.length === 0) return []
    const clientCounts: Record<string, number> = {}
    safeTasks.forEach((task) => {
      if (!task || !task.title) return
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
  }, [safeTasks])

  // 3. Distribución por Sector
  const distributionBySector = useMemo(() => {
    if (!safeTasks || safeTasks.length === 0) return []
    const sectorCounts: Record<string, number> = {}
    safeTasks.forEach((task) => {
      if (!task) return
      const sector = task.assignedSector || 'Sin sector'
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1
    })
    return Object.entries(sectorCounts).map(([name, value], index) => ({
      name,
      value,
      color: index === 0 ? '#3b82f6' : '#22c55e'
    }))
  }, [safeTasks])

  // 4. Carga de Trabajo por Operario
  const workloadByOperator = useMemo(() => {
    if (!safeTasks || safeTasks.length === 0) return []
    const operatorCounts: Record<string, number> = {}
    safeTasks.forEach((task) => {
      if (!task) return
      const member = safeTeamMembers.find((m) => m.id === task.ownerId)
      const operatorName = member?.name || 'Otro'
      operatorCounts[operatorName] = (operatorCounts[operatorName] || 0) + 1
    })
    return Object.entries(operatorCounts).map(([name, value]) => ({
      name,
      Órdenes: value
    }))
  }, [safeTasks, safeTeamMembers])

  // 5. Movimientos por Usuario
  const movementsByUser = useMemo(() => {
    if (!safeActivity || safeActivity.length === 0) return []
    const userMovements: Record<string, number> = {}
    safeActivity.forEach((event) => {
      if (!event || !event.actorId) return
      const member = safeTeamMembers.find((m) => m.id === event.actorId)
      const userName = member?.name || event.actorId
      userMovements[userName] = (userMovements[userName] || 0) + 1
    })
    return Object.entries(userMovements)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        Movimientos: value
      }))
  }, [safeActivity, safeTeamMembers])

  // 6. Tiempo Promedio de Reacción por Usuario
  const reactionTimeByUser = useMemo(() => {
    if (!safeActivity || safeActivity.length === 0) return []
    const userReactionTimes: Record<string, { total: number; count: number }> = {}
    
    safeActivity.forEach((event) => {
      if (!event || !event.actorId || !event.timestamp) return
      const member = safeTeamMembers.find((m) => m.id === event.actorId)
      const userName = member?.name || event.actorId
      
      if (!userReactionTimes[userName]) {
        userReactionTimes[userName] = { total: 0, count: 0 }
      }
      
      // Calcular tiempo de reacción (simulado basado en timestamp)
      try {
        const eventTime = new Date(event.timestamp).getTime()
        if (isNaN(eventTime)) return
        const now = Date.now()
        const hoursDiff = (now - eventTime) / (1000 * 60 * 60)
        
        userReactionTimes[userName].total += hoursDiff
        userReactionTimes[userName].count += 1
      } catch (error) {
        console.warn('Error procesando timestamp:', event.timestamp, error)
      }
    })
    
    return Object.entries(userReactionTimes)
      .map(([name, data]) => ({
        name,
        'Tiempo Promedio (horas)': data.count > 0 ? data.total / data.count : 0
      }))
      .sort((a, b) => b['Tiempo Promedio (horas)'] - a['Tiempo Promedio (horas)'])
  }, [safeActivity, safeTeamMembers])

  // 7. Tiempo Promedio por Estado (Bottleneck Detection)
  const avgTimeByStatus = useMemo(() => {
    if (!safeTasks || safeTasks.length === 0) return []
    const statusTimes: Record<string, { total: number; count: number }> = {}
    
    safeTasks.forEach((task) => {
      if (!task || !task.status || !task.updatedAt) return
      const column = BOARD_COLUMNS.find((col) => col.id === task.status)
      const statusName = column?.label || task.status
      
      if (!statusTimes[statusName]) {
        statusTimes[statusName] = { total: 0, count: 0 }
      }
      
      try {
        const updatedTime = new Date(task.updatedAt).getTime()
        if (isNaN(updatedTime)) return
        const now = Date.now()
        const daysDiff = (now - updatedTime) / (1000 * 60 * 60 * 24)
        
        statusTimes[statusName].total += daysDiff
        statusTimes[statusName].count += 1
      } catch (error) {
        console.warn('Error procesando updatedAt:', task.updatedAt, error)
      }
    })
    
    return Object.entries(statusTimes)
      .map(([name, data]) => ({
        name,
        'Tiempo Promedio (días)': data.count > 0 ? data.total / data.count : 0
      }))
      .sort((a, b) => b['Tiempo Promedio (días)'] - a['Tiempo Promedio (días)'])
  }, [safeTasks])

  // 8. Registro de Actividad Cronológico
  const chronologicalActivity = useMemo(() => {
    if (!safeActivity || safeActivity.length === 0) return []
    return [...safeActivity]
      .filter((event) => event && event.timestamp)
      .sort((a, b) => {
        try {
          const timeA = new Date(a.timestamp).getTime()
          const timeB = new Date(b.timestamp).getTime()
          if (isNaN(timeA) || isNaN(timeB)) return 0
          return timeB - timeA
        } catch {
          return 0
        }
      })
      .slice(0, 50)
      .map((event) => {
        const member = safeTeamMembers.find((m) => m.id === event.actorId)
        const fromColumn = BOARD_COLUMNS.find((col) => col.id === event.from)
        const toColumn = BOARD_COLUMNS.find((col) => col.id === event.to)
        
        let fechaHora = 'N/A'
        try {
          fechaHora = new Date(event.timestamp).toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        } catch (error) {
          console.warn('Error formateando fecha:', event.timestamp, error)
        }
        
        return {
          fechaHora,
          usuario: member?.name || '',
          opNumber: `#${safeTasks.find((t) => t && t.id === event.taskId)?.opNumber || 'N/A'}`,
          movimiento: `${fromColumn?.label || event.from || 'N/A'} → ${toColumn?.label || event.to || 'N/A'}`
        }
      })
  }, [safeActivity, safeTeamMembers, safeTasks])

  // 9. Fichas Estancadas (> 3 días en el mismo estado)
  const stalledTasks = useMemo(() => {
    if (!safeTasks || safeTasks.length === 0) return []
    const now = Date.now()
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000
    
    return safeTasks
      .filter((task) => {
        if (!task || !task.updatedAt) return false
        try {
          const updatedTime = new Date(task.updatedAt).getTime()
          if (isNaN(updatedTime)) return false
          return now - updatedTime > threeDaysInMs
        } catch {
          return false
        }
      })
      .map((task) => {
        const column = BOARD_COLUMNS.find((col) => col.id === task.status)
        let daysStalled = 0
        try {
          const updatedTime = new Date(task.updatedAt).getTime()
          if (!isNaN(updatedTime)) {
            daysStalled = Math.floor((now - updatedTime) / (1000 * 60 * 60 * 24))
          }
        } catch (error) {
          console.warn('Error calculando días estancados:', task.updatedAt, error)
        }
        
        return {
          opNumber: task.opNumber || 'N/A',
          client: task.title || 'Sin cliente',
          sector: task.assignedSector || 'Sin sector',
          status: column?.label || task.status || 'Sin estado',
          daysStalled
        }
      })
      .sort((a, b) => b.daysStalled - a.daysStalled)
  }, [safeTasks])

  return (
    <div className="statistics-page">
      <header className="stats-header">
        <div className="stats-header-content">
          <div className="stats-header-brand">
            <img 
              src="https://trello.plotcenter.com.ar/Group%20187.png" 
              alt="Plot Center Logo" 
              className="stats-logo"
            />
            <button className="back-button" onClick={onBack}>
              ← Volver al Tablero
            </button>
          </div>
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
            {topClients.length > 0 ? (
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
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No hay datos para mostrar
              </div>
            )}
          </div>

          <div className="stat-card">
            <h3>Distribución por Sector</h3>
            {distributionBySector.length > 0 ? (
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
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No hay datos para mostrar
              </div>
            )}
          </div>
        </div>

        {/* Segunda fila: Gráficos de barras */}
        <div className="stats-row">
          <div className="stat-card">
            <h3>Carga de Trabajo por Operario</h3>
            {workloadByOperator.length > 0 ? (
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
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No hay datos para mostrar
              </div>
            )}
          </div>

          <div className="stat-card">
            <h3>Movimientos por Usuario</h3>
            {movementsByUser.length > 0 ? (
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
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No hay datos para mostrar
              </div>
            )}
          </div>

          <div className="stat-card">
            <h3>Tiempo Promedio de Reacción por Usuario</h3>
            {reactionTimeByUser.length > 0 ? (
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
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No hay datos para mostrar
              </div>
            )}
          </div>
        </div>

        {/* Tercera fila: Tiempo promedio por estado */}
        <div className="stats-row">
          <div className="stat-card full-width">
            <h3>Tiempo Promedio por Estado (Detección de Cuellos de Botella)</h3>
            {avgTimeByStatus.length > 0 ? (
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
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No hay datos para mostrar
              </div>
            )}
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

