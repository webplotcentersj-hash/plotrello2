import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import BoardPage from './pages/BoardPage'
import StatisticsPage from './pages/StatisticsPage'
import { initialActivity, initialTasks, teamMembers } from './data/mockData'
import type { ActivityEvent, Task } from './types/board'
import './app.css'

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activity, setActivity] = useState<ActivityEvent[]>(initialActivity)

  return (
    <BrowserRouter>
      <AppRoutes tasks={tasks} setTasks={setTasks} activity={activity} setActivity={setActivity} />
    </BrowserRouter>
  )
}

function AppRoutes({
  tasks,
  setTasks,
  activity,
  setActivity
}: {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  activity: ActivityEvent[]
  setActivity: React.Dispatch<React.SetStateAction<ActivityEvent[]>>
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
    </Routes>
  )
}

export default App
