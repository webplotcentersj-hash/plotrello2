import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../services/supabaseClient'
import apiService from '../services/api'
import { ordenToTask } from '../utils/dataMappers'
import type { Task } from '../types/board'
import type { OrdenTrabajo } from '../types/api'
import { BOARD_COLUMNS } from '../data/mockData'
import './DashboardPantallasPage.css'

interface WeatherData {
  temp: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
}

const DashboardPantallasPage = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const newsTickerRef = useRef<HTMLDivElement>(null)

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

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

  // Cargar clima de San Juan
  useEffect(() => {
    const loadWeather = async () => {
      try {
        // OpenWeatherMap API - San Juan, Argentina
        // Nota: Necesitarás una API key de OpenWeatherMap
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY || 'demo'
        if (apiKey === 'demo') {
          // Datos mock si no hay API key
          setWeather({
            temp: 25,
            description: 'Soleado',
            icon: '☀️',
            humidity: 45,
            windSpeed: 15
          })
          return
        }

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=San Juan,AR&appid=${apiKey}&units=metric&lang=es`
        )
        
        if (response.ok) {
          const data = await response.json()
          setWeather({
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            icon: getWeatherIcon(data.weather[0].main),
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind?.speed * 3.6 || 0) // m/s a km/h
          })
        }
      } catch (err) {
        console.error('Error cargando clima:', err)
        // Datos mock en caso de error
        setWeather({
          temp: 25,
          description: 'Soleado',
          icon: '☀️',
          humidity: 45,
          windSpeed: 15
        })
      }
    }

    loadWeather()
    // Actualizar clima cada 30 minutos
    const interval = setInterval(loadWeather, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getWeatherIcon = (main: string): string => {
    const icons: Record<string, string> = {
      Clear: '☀️',
      Clouds: '☁️',
      Rain: '🌧️',
      Drizzle: '🌦️',
      Thunderstorm: '⛈️',
      Snow: '❄️',
      Mist: '🌫️',
      Fog: '🌫️'
    }
    return icons[main] || '☀️'
  }

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

  // Calcular progreso de la jornada laboral (8am - 21hs)
  const workdayProgress = useMemo(() => {
    const now = currentTime
    const startHour = 8
    const endHour = 21
    
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute
    const startTimeInMinutes = startHour * 60
    const endTimeInMinutes = endHour * 60
    
    if (currentTimeInMinutes < startTimeInMinutes) {
      return 0
    }
    if (currentTimeInMinutes > endTimeInMinutes) {
      return 100
    }
    
    const elapsed = currentTimeInMinutes - startTimeInMinutes
    const total = endTimeInMinutes - startTimeInMinutes
    return Math.round((elapsed / total) * 100)
  }, [currentTime])

  // Novedades para el ticker
  const novedades = useMemo(() => {
    const novedadesList: string[] = []
    
    if (highPriorityCount > 0) {
      novedadesList.push(`⚠️ ${highPriorityCount} orden${highPriorityCount > 1 ? 'es' : ''} con prioridad alta`)
    }
    
    if (tasks.length > 0) {
      novedadesList.push(`📋 Total de ${tasks.length} orden${tasks.length > 1 ? 'es' : ''} en producción`)
    }
    
    const today = new Date()
    const todayTasks = tasks.filter(t => {
      if (!t.dueDate) return false
      const due = new Date(t.dueDate)
      return due.toDateString() === today.toDateString()
    })
    if (todayTasks.length > 0) {
      novedadesList.push(`📅 ${todayTasks.length} orden${todayTasks.length > 1 ? 'es' : ''} con entrega hoy`)
    }
    
    novedadesList.push(`🕐 Jornada laboral: ${workdayProgress}% completada`)
    
    if (weather) {
      novedadesList.push(`🌤️ Clima San Juan: ${weather.temp}°C - ${weather.description}`)
    }
    
    return novedadesList.length > 0 ? novedadesList : ['📊 Sistema operativo en tiempo real']
  }, [tasks, highPriorityCount, workdayProgress, weather])

  // Toggle pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(err => {
        console.error('Error al entrar en pantalla completa:', err)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(err => {
        console.error('Error al salir de pantalla completa:', err)
      })
    }
  }

  // Detectar cambios en pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

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
      {/* Header con logo y controles */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-container">
            <div className="logo-text">PLOT</div>
            <div className="logo-subtitle">Centro Gráfico</div>
          </div>
        </div>
        
        <div className="header-center">
          <div className="workday-timeline">
            <div className="timeline-label">Jornada Laboral</div>
            <div className="timeline-bar">
              <div 
                className="timeline-progress" 
                style={{ width: `${workdayProgress}%` }}
              >
                <div className="timeline-marker"></div>
              </div>
            </div>
            <div className="timeline-hours">
              <span>8:00</span>
              <span className="current-time">
                {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>21:00</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          {weather && (
            <div className="weather-widget">
              <span className="weather-icon">{weather.icon}</span>
              <div className="weather-info">
                <div className="weather-temp">{weather.temp}°C</div>
                <div className="weather-desc">{weather.description}</div>
                <div className="weather-details">
                  💧 {weather.humidity}% • 💨 {weather.windSpeed} km/h
                </div>
              </div>
            </div>
          )}
          
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">OP:</span>
              <span className="stat-value">{tasks.length}</span>
            </div>
            {highPriorityCount > 0 && (
              <div className="stat-item priority-alert">
                <span className="priority-led"></span>
                <span className="stat-value">{highPriorityCount}</span>
              </div>
            )}
          </div>

          <button 
            className="fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? '⛶' : '⛶'}
          </button>
        </div>
      </header>

      {/* Ticker de novedades */}
      <div className="news-ticker-container">
        <div className="news-ticker" ref={newsTickerRef}>
          {/* Duplicar contenido para scroll continuo */}
          {[...novedades, ...novedades].map((novedad, index) => (
            <span key={index} className="ticker-item">
              {novedad} • 
            </span>
          ))}
        </div>
      </div>

      {/* Contenido principal - Grid compacto */}
      <div className="dashboard-content">
        <div className="columns-grid">
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
                        <span className="priority-dot"></span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="column-content">
                  {columnTasks.length === 0 ? (
                    <div className="empty-column">
                      <span className="empty-icon">📭</span>
                    </div>
                  ) : (
                    columnTasks.slice(0, 5).map((task) => (
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
                            <span className="priority-badge">!</span>
                          )}
                        </div>
                        <div className="task-client">{task.title}</div>
                        {task.dniCuit && (
                          <div className="task-dni">{task.dniCuit}</div>
                        )}
                      </div>
                    ))
                  )}
                  {columnTasks.length > 5 && (
                    <div className="more-tasks">+{columnTasks.length - 5} más</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <footer className="dashboard-footer">
        <p>
          Actualización: {lastUpdate.toLocaleTimeString('es-AR')} • 
          {currentTime.toLocaleString('es-AR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </footer>
    </div>
  )
}

export default DashboardPantallasPage
