import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import BoardPage from './pages/BoardPage'
import StatisticsPage from './pages/StatisticsPage'
import ChatPage from './pages/ChatPage'
import Login from './components/Login'
import EnvDebug from './components/EnvDebug'
import { initialActivity, initialTasks, teamMembers } from './data/mockData'
import type { ActivityEvent, Task } from './types/board'
import { useAuth } from './hooks/useAuth'
import './app.css'
import apiService from './services/api'
import { historialToActivity, ordenToTask } from './utils/dataMappers'

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activity, setActivity] = useState<ActivityEvent[]>(initialActivity)
  const { usuario, loading, setUsuario } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      setIsAuthenticated(!!usuario)
    }
  }, [usuario, loading])

  // Debug: Mostrar variables de entorno
  useEffect(() => {
    console.log('🔍 Variables de Entorno:')
    console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ NO CONFIGURADA')
    console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA')
    console.log('VITE_SUPABASE_SCHEMA:', import.meta.env.VITE_SUPABASE_SCHEMA || 'NO CONFIGURADA')
    console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'NO CONFIGURADA')
    
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('⚠️ Supabase no está configurado. La app usará datos mock o fallback.')
    }
  }, [])

  const handleLogin = (usuarioData: any) => {
    setUsuario(usuarioData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('usuario')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('usuario_id')
    setUsuario(null)
    setIsAuthenticated(false)
    setTasks(initialTasks)
    setActivity(initialActivity)
  }

  const loadRemoteData = useCallback(async () => {
    setDataLoading(true)
    setDataError(null)
    try {
      const [ordenesResp, historialResp] = await Promise.all([
        apiService.getOrdenes(),
        apiService.getHistorialMovimientos({ limit: 100 })
      ])

      if (ordenesResp.success && ordenesResp.data) {
        setTasks(
          ordenesResp.data.map((orden) => ordenToTask(orden))
        )
      } else {
        setDataError(ordenesResp.error || 'No se pudieron cargar las órdenes')
      }

      if (historialResp.success && historialResp.data) {
        setActivity(historialResp.data.map((registro) => historialToActivity(registro)))
      } else {
        setDataError((prev) => prev ?? historialResp.error ?? 'No se pudo cargar el historial')
      }
    } catch (error) {
      console.error('Error cargando datos desde Supabase:', error)
      setDataError('No se pudieron sincronizar los datos con Supabase.')
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      void loadRemoteData()
    }
  }, [isAuthenticated, loadRemoteData])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0b0d17 0%, #1a1d2e 100%)',
        color: '#fff'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTopColor: '#eb671b',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}></div>
        <p>Cargando...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <>
      <EnvDebug />
      <BrowserRouter>
        <AppRoutes 
          tasks={tasks} 
          setTasks={setTasks} 
          activity={activity} 
          setActivity={setActivity}
          onLogout={handleLogout}
          onReloadData={loadRemoteData}
          isSyncing={dataLoading}
          syncError={dataError}
        />
      </BrowserRouter>
    </>
  )
}

function AppRoutes({
  tasks,
  setTasks,
  activity,
  setActivity,
  onLogout,
  onReloadData,
  isSyncing,
  syncError
}: {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  activity: ActivityEvent[]
  setActivity: React.Dispatch<React.SetStateAction<ActivityEvent[]>>
  onLogout: () => void
  onReloadData: () => Promise<void>
  isSyncing: boolean
  syncError: string | null
}) {
  const navigate = useNavigate()

  return (
    <Routes>
      <Route
        path="/"
        element={
          <BoardPage
            tasks={tasks}
            setTasks={setTasks}
            activity={activity}
            setActivity={setActivity}
            teamMembers={teamMembers}
            onNavigateToStats={() => navigate('/statistics')}
            onNavigateToChat={() => navigate('/chat')}
            onLogout={onLogout}
            onReloadData={onReloadData}
            isSyncing={isSyncing}
            syncError={syncError}
          />
        }
      />
      <Route
        path="/statistics"
        element={
          <StatisticsPage
            tasks={tasks}
            activity={activity}
            teamMembers={teamMembers}
            onBack={() => navigate('/')}
          />
        }
      />
      <Route
        path="/chat"
        element={<ChatPage onBack={() => navigate('/')} />}
      />
    </Routes>
  )
}

export default App
