import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../services/supabaseClient'
import apiService from '../services/api'
import { ordenToTask } from '../utils/dataMappers'
import type { Task } from '../types/board'
import type { OrdenTrabajo } from '../types/api'
import { BOARD_COLUMNS } from '../data/mockData'
import './DashboardPantallasPage.css'

const DashboardPantallasPage = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Cargar tareas iniciales
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiService.getOrdenes()
        
        if (response.success && response.data) {
          const mappedTasks = response.data.map(ordenToTask)
          setTasks(mappedTasks)
          setLastUpdate(new Date())
        } else {
          setError(response.error || 'Error al cargar tareas')
        }
      } catch (err) {
        console.error('Error cargando tareas:', err)
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    loadTasks()
  }, [])

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    if (!supabase) {
      console.warn('⚠️ Supabase no disponible para Realtime')
      return
    }

    const channel = supabase
      .channel('dashboard-pantallas-ordenes')
      .on<OrdenTrabajo>(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'ordenes_trabajo' 
        },
        (payload) => {
          console.log('🔄 Cambio en tiempo real:', payload.eventType)
          
          if (payload.eventType === 'DELETE') {
            setTasks((prev) => 
              prev.filter((t) => t.id !== payload.old.id?.toString())
            )
          } else if (payload.new) {
            const newTask = ordenToTask(payload.new as OrdenTrabajo)
            setTasks((prev) => {
              const existingIndex = prev.findIndex((t) => t.id === newTask.id)
              if (existingIndex >= 0) {
                const updated = [...prev]
                updated[existingIndex] = newTask
                return updated
              }
              return [...prev, newTask]
            })
          }
          setLastUpdate(new Date())
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Dashboard: Realtime conectado')
        }
      })

    return () => {
      void channel.unsubscribe()
    }
  }, [])

  // Organizar tareas por columna
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    
    BOARD_COLUMNS.forEach((col) => {
      grouped[col.id] = []
    })

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })

    // Ordenar por prioridad (alta primero) y luego por fecha
    Object.keys(grouped).forEach((colId) => {
      grouped[colId].sort((a, b) => {
        if (a.priority === 'alta' && b.priority !== 'alta') return -1
        if (a.priority !== 'alta' && b.priority === 'alta') return 1
        const dateA = new Date(a.updatedAt || a.createdAt).getTime()
        const dateB = new Date(b.updatedAt || b.createdAt).getTime()
        return dateB - dateA
      })
    })

    return grouped
  }, [tasks])

  // Contar tareas de prioridad alta
  const highPriorityCount = useMemo(() => {
    return tasks.filter((t) => t.priority === 'alta').length
  }, [tasks])

  if (loading) {
    return (
      <div className="dashboard-pantallas-loading">
        <div className="loading-spinner"></div>
        <p>Cargando flujo de trabajo...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-pantallas-error">
        <h2>⚠️ Error</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="dashboard-pantallas">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="title-icon">📊</span>
            Flujo de Trabajo en Tiempo Real
          </h1>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">Total OP:</span>
              <span className="stat-value">{tasks.length}</span>
            </div>
            {highPriorityCount > 0 && (
              <div className="stat-item priority-alert">
                <span className="priority-led"></span>
                <span className="stat-label">Prioridad Alta:</span>
                <span className="stat-value">{highPriorityCount}</span>
              </div>
            )}
            <div className="stat-item">
              <span className="stat-label">Última actualización:</span>
              <span className="stat-value">
                {lastUpdate.toLocaleTimeString('es-AR')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="columns-container">
          {BOARD_COLUMNS.map((column) => {
            const columnTasks = tasksByColumn[column.id] || []
            const highPriorityInColumn = columnTasks.filter(
              (t) => t.priority === 'alta'
            ).length

            return (
              <div key={column.id} className="dashboard-column">
                <div className="column-header">
                  <h2 className="column-title" style={{ color: column.accent }}>
                    {column.label}
                  </h2>
                  <div className="column-badge">
                    {columnTasks.length}
                    {highPriorityInColumn > 0 && (
                      <span className="priority-indicator">
                        {' '}
                        <span className="priority-dot"></span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="column-content">
                  {columnTasks.length === 0 ? (
                    <div className="empty-column">
                      <span className="empty-icon">📭</span>
                      <p>Sin tareas</p>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`task-card ${task.priority === 'alta' ? 'high-priority' : ''}`}
                      >
                        {task.priority === 'alta' && (
                          <div className="priority-led-red"></div>
                        )}
                        <div className="task-header">
                          <span className="task-op">OP: {task.opNumber}</span>
                          {task.priority === 'alta' && (
                            <span className="priority-badge">URGENTE</span>
                          )}
                        </div>
                        <div className="task-client">{task.title}</div>
                        {task.dniCuit && (
                          <div className="task-dni">DNI/CUIT: {task.dniCuit}</div>
                        )}
                        {task.summary && (
                          <div className="task-summary">{task.summary}</div>
                        )}
                        <div className="task-footer">
                          {task.assignedSector && (
                            <span className="task-sector">
                              📍 {task.assignedSector}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="task-date">
                              📅 {new Date(task.dueDate).toLocaleDateString('es-AR')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <footer className="dashboard-footer">
        <p>
          Actualización automática en tiempo real •{' '}
          {new Date().toLocaleString('es-AR')}
        </p>
      </footer>
    </div>
  )
}

export default DashboardPantallasPage

