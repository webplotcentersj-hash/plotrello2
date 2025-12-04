import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts'
import apiService from '../services/api'
import { useAuth } from '../hooks/useAuth'
import './ImpresorasPage.css'

type ImpresoraOcupacion = {
  id: number
  nombre: string
  modelo: string | null
  estado_impresora: string
  capacidad_maxima_horas_dia: number
  horas_usadas_hoy: number
  horas_usadas_semana: number
  porcentaje_ocupacion_hoy: number
  porcentaje_ocupacion_semana: number
  trabajos_activos: number
}

const ImpresorasPage = () => {
  const navigate = useNavigate()
  const { usuario, loading: authLoading } = useAuth()
  const [impresoras, setImpresoras] = useState<ImpresoraOcupacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const response = await apiService.getImpresorasOcupacion()
      if (response.success && response.data) {
        setImpresoras(response.data as ImpresoraOcupacion[])
      } else {
        setError(response.error || 'No se pudieron cargar los datos de impresoras')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      void loadData()
    }
  }, [authLoading])

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      void loadData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getColorByPorcentaje = (porcentaje: number): string => {
    if (porcentaje >= 90) return '#ef4444' // Rojo - Muy ocupada
    if (porcentaje >= 70) return '#f97316' // Naranja - Ocupada
    if (porcentaje >= 50) return '#eab308' // Amarillo - Moderada
    if (porcentaje >= 30) return '#3b82f6' // Azul - Poco ocupada
    return '#22c55e' // Verde - Disponible
  }

  const chartData = impresoras.map((imp) => ({
    nombre: imp.nombre,
    'Hoy': parseFloat(imp.porcentaje_ocupacion_hoy.toFixed(2)),
    'Esta Semana': parseFloat(imp.porcentaje_ocupacion_semana.toFixed(2)),
    color: getColorByPorcentaje(imp.porcentaje_ocupacion_hoy)
  }))

  if (authLoading || loading) {
    return (
      <div className="impresoras-page">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="impresoras-page">
      <header className="impresoras-header">
        <div className="impresoras-header-content">
          <div className="impresoras-header-brand">
            <img
              src="https://trello.plotcenter.com.ar/Group%20187.png"
              alt="Plot Center Logo"
              className="impresoras-logo"
            />
            <button className="back-button" onClick={() => navigate('/')}>
              ← Volver al Tablero
            </button>
          </div>
          <div className="impresoras-header-title">
            <h1>Ocupación de Impresoras</h1>
            <button
              className="refresh-button"
              onClick={() => void loadData()}
              disabled={refreshing}
            >
              {refreshing ? '🔄 Actualizando...' : '🔄 Actualizar'}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="impresoras-container">
        {/* Gráfico de barras comparativo */}
        <div className="impresoras-card full-width">
          <h3>Porcentaje de Ocupación</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 100]} label={{ value: 'Porcentaje (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                  labelFormatter={(label) => `Impresora: ${label}`}
                />
                <Legend />
                <Bar dataKey="Hoy" fill="#3b82f6" name="Hoy" />
                <Bar dataKey="Esta Semana" fill="#8b5cf6" name="Esta Semana" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              No hay datos de impresoras disponibles
            </div>
          )}
        </div>

        {/* Tarjetas individuales de impresoras */}
        <div className="impresoras-grid">
          {impresoras.map((impresora) => (
            <div key={impresora.id} className="impresora-card">
              <div className="impresora-card-header">
                <h4>{impresora.nombre}</h4>
                <span
                  className="estado-badge"
                  style={{
                    backgroundColor: getColorByPorcentaje(impresora.porcentaje_ocupacion_hoy)
                  }}
                >
                  {impresora.estado_impresora}
                </span>
              </div>

              {impresora.modelo && (
                <p className="impresora-modelo">Modelo: {impresora.modelo}</p>
              )}

              <div className="impresora-stats">
                <div className="stat-item">
                  <div className="stat-label">Ocupación Hoy</div>
                  <div className="stat-value">
                    <div
                      className="progress-bar"
                      style={{
                        width: '100%',
                        height: '24px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, impresora.porcentaje_ocupacion_hoy)}%`,
                          height: '100%',
                          backgroundColor: getColorByPorcentaje(impresora.porcentaje_ocupacion_hoy),
                          transition: 'width 0.3s ease'
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: impresora.porcentaje_ocupacion_hoy > 50 ? '#fff' : '#000',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        {impresora.porcentaje_ocupacion_hoy.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="stat-detail">
                    {impresora.horas_usadas_hoy.toFixed(2)}h / {impresora.capacidad_maxima_horas_dia}h
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-label">Ocupación Esta Semana</div>
                  <div className="stat-value">
                    <div
                      className="progress-bar"
                      style={{
                        width: '100%',
                        height: '24px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, impresora.porcentaje_ocupacion_semana)}%`,
                          height: '100%',
                          backgroundColor: getColorByPorcentaje(impresora.porcentaje_ocupacion_semana),
                          transition: 'width 0.3s ease'
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: impresora.porcentaje_ocupacion_semana > 50 ? '#fff' : '#000',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        {impresora.porcentaje_ocupacion_semana.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="stat-detail">
                    {impresora.horas_usadas_semana.toFixed(2)}h / {(impresora.capacidad_maxima_horas_dia * 7).toFixed(2)}h
                  </div>
                </div>

                <div className="stat-item">
                  <div className="stat-label">Trabajos Activos</div>
                  <div className="stat-value-large">{impresora.trabajos_activos}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {impresoras.length === 0 && !error && (
          <div className="no-data-message">
            <p>No hay impresoras registradas en el sistema.</p>
            <p>Contacta al administrador para agregar impresoras.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImpresorasPage




