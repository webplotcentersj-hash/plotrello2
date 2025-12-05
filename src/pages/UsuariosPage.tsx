import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { UsuarioRecord, UserRole, SectorRecord } from '../types/api'
import apiService from '../services/api'
import { useAuth } from '../hooks/useAuth'
import './UsuariosPage.css'

const UsuariosPage = ({ onBack }: { onBack: () => void }) => {
  const { isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  const [usuarios, setUsuarios] = useState<UsuarioRecord[]>([])
  const [sectores, setSectores] = useState<SectorRecord[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    password: '',
    confirmPassword: '',
    rol: 'empleado' as UserRole,
    sector_id: '' as string | number
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/')
    }
  }, [isAdmin, loading, navigate])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    setLoadingData(true)
    setError(null)
    try {
      const [usersRes, sectorsRes] = await Promise.all([
        apiService.getUsuarios(),
        apiService.getSectores()
      ])

      if (usersRes.success && usersRes.data) {
        setUsuarios(usersRes.data)
      } else {
        setError('Error al cargar usuarios')
      }

      if (sectorsRes.success && sectorsRes.data) {
        setSectores(sectorsRes.data)
      }
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar datos del sistema')
    } finally {
      setLoadingData(false)
    }
  }

  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validaciones
    if (!formData.nombre.trim()) {
      setError('El nombre de usuario es requerido')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Si es empleado, debe tener sector
    if (formData.rol === 'empleado' && !formData.sector_id) {
      setError('Debes seleccionar un sector para el empleado')
      return
    }

    setCreating(true)
    try {
      const response = await apiService.createUsuario({
        nombre: formData.nombre.trim(),
        password: formData.password,
        rol: formData.rol,
        sector_id: formData.sector_id ? Number(formData.sector_id) : null
      })

      if (response.success) {
        setSuccess(`Usuario "${formData.nombre}" creado exitosamente`)
        setFormData({
          nombre: '',
          password: '',
          confirmPassword: '',
          rol: 'empleado',
          sector_id: ''
        })
        setShowCreateForm(false)
        await loadData()
      } else {
        setError(response.error || 'Error al crear usuario')
      }
    } catch (err) {
      console.error('Error creando usuario:', err)
      setError('Error al crear usuario. Por favor intenta nuevamente.')
    } finally {
      setCreating(false)
    }
  }

  const getSectorColor = (nombre?: string | null) => {
    if (!nombre) return '#6b7280'
    const sector = sectores.find(s => s.nombre === nombre)
    return sector?.color || '#6b7280'
  }

  if (loading) {
    return (
      <div className="usuarios-page">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="usuarios-page">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
          <button onClick={onBack} className="back-button" style={{ marginTop: '20px' }}>
            Volver al Tablero
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="usuarios-page">
      <header className="usuarios-header">
        <div className="header-content">
          <img
            src="https://trello.plotcenter.com.ar/Group%20187.png"
            alt="Plot Center Logo"
            className="usuarios-logo"
          />
          <div className="header-text">
            <h1>Gestión de Usuarios</h1>
            <p>Administra usuarios del sistema</p>
          </div>
          <button className="back-button" onClick={onBack}>
            ← Volver
          </button>
        </div>
      </header>

      <div className="usuarios-container">
        <div className="usuarios-actions">
          <button
            className="create-button"
            onClick={() => {
              setShowCreateForm(!showCreateForm)
              setError(null)
              setSuccess(null)
            }}
          >
            {showCreateForm ? '−' : '+'} Crear Nuevo Usuario
          </button>
        </div>

        {error && (
          <div className="message error-message">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="message success-message">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        {showCreateForm && (
          <div className="create-form-card">
            <h3>Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUsuario}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre de Usuario *</label>
                <input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: juan_perez"
                  required
                  disabled={creating}
                />
              </div>

              <div className="form-group">
                <label htmlFor="rol">Rol *</label>
                <select
                  id="rol"
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value as UserRole })}
                  disabled={creating}
                >
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {formData.rol === 'empleado' && (
                <div className="form-group">
                  <label htmlFor="sector">Sector *</label>
                  <select
                    id="sector"
                    value={formData.sector_id}
                    onChange={(e) => setFormData({ ...formData, sector_id: e.target.value })}
                    required
                    disabled={creating}
                  >
                    <option value="">-- Seleccionar Sector --</option>
                    {sectores.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="password">Contraseña *</label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  disabled={creating}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repite la contraseña"
                  required
                  disabled={creating}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({
                      nombre: '',
                      password: '',
                      confirmPassword: '',
                      rol: 'empleado',
                      sector_id: ''
                    })
                    setError(null)
                    setSuccess(null)
                  }}
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={creating}
                >
                  {creating ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="usuarios-list">
          <h2>Usuarios del Sistema ({usuarios.length})</h2>

          {loadingData ? (
            <div className="loading-state">
              <p>Cargando datos...</p>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="empty-state">
              <p>No hay usuarios registrados</p>
              <p className="empty-hint">Crea el primer usuario usando el botón de arriba</p>
            </div>
          ) : (
            <div className="usuarios-grid">
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="usuario-card">
                  <div className="usuario-header">
                    <div className="usuario-avatar">
                      {usuario.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="usuario-info">
                      <h3>{usuario.nombre}</h3>
                      <div className="badges-container">
                        <span
                          className={`rol-badge ${usuario.rol === 'admin' ? 'admin' : ''}`}
                        >
                          {usuario.rol === 'admin' ? 'Admin' : 'Empleado'}
                        </span>
                        {usuario.nombre_sector && (
                          <span
                            className="sector-badge"
                            style={{ backgroundColor: getSectorColor(usuario.nombre_sector) }}
                          >
                            {usuario.nombre_sector}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="usuario-id">
                    <span className="id-label">ID:</span>
                    <span className="id-value">{usuario.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UsuariosPage
