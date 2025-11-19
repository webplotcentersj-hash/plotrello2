import { useState, useEffect } from 'react'
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

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activity, setActivity] = useState<ActivityEvent[]>(initialActivity)
  const { usuario, loading, setUsuario } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (!loading) {
      setIsAuthenticated(!!usuario)
    }
  }, [usuario, loading])

  // Debug: Mostrar variables de entorno en desarrollo
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 Variables de Entorno:')
      console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || 'NO CONFIGURADA')
      console.log('VITE_GEMINI_API_KEY:', import.meta.env.VITE_GEMINI_API_KEY ? '✅ Configurada' : '❌ NO CONFIGURADA')
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
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0b0d17 0%, #1a1d2e 100%)',
        color: '#fff'
      }}>
        <p>Cargando...</p>
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
  onLogout
}: {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  activity: ActivityEvent[]
  setActivity: React.Dispatch<React.SetStateAction<ActivityEvent[]>>
  onLogout: () => void
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
