import { useMemo, useState } from 'react'
import Board from './components/Board'
import Header from './components/Header'
import FiltersBar from './components/FiltersBar'
import StatsPanel from './components/StatsPanel'
import ActivityFeed from './components/ActivityFeed'
import TaskEditModal from './components/TaskEditModal'
import { BOARD_COLUMNS, initialActivity, initialTasks, teamMembers } from './data/mockData'
import type { ActivityEvent, Task, TaskStatus } from './types/board'
import './app.css'

const PRIORITY_FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'alta', label: 'Alta' },
  { id: 'media', label: 'Media' },
  { id: 'baja', label: 'Baja' }
] as const

type PriorityFilter = (typeof PRIORITY_FILTERS)[number]['id']

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activity, setActivity] = useState<ActivityEvent[]>(initialActivity)
  const [ownerFilter, setOwnerFilter] = useState<string>('todos')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFocus, setStatusFocus] = useState<TaskStatus[]>([])
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesOwner = ownerFilter === 'todos' || task.ownerId === ownerFilter
      const matchesPriority = priorityFilter === 'todas' || task.priority === priorityFilter
      const matchesStatus = statusFocus.length === 0 || statusFocus.includes(task.status)
      const matchesSearch =
        task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.summary.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesOwner && matchesPriority && matchesStatus && matchesSearch
    })
  }, [tasks, ownerFilter, priorityFilter, statusFocus, searchQuery])

  const handleMoveTask = (taskId: string, destination: TaskStatus) => {
    const destinationColumn = BOARD_COLUMNS.find((column) => column.id === destination)

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task
        return {
          ...task,
          status: destination,
           assignedSector: destinationColumn?.label ?? task.assignedSector,
          updatedAt: new Date().toISOString(),
          progress: destination === 'almacen-entrega' ? 100 : task.progress
        }
      })
    )

    const taskSnapshot = tasks.find((task) => task.id === taskId)
    if (!taskSnapshot || taskSnapshot.status === destination) return

    setActivity((prev) => [
      {
        id: `move-${Date.now()}`,
        taskId,
        from: taskSnapshot.status,
        to: destination,
        actorId: taskSnapshot.ownerId,
        timestamp: new Date().toISOString(),
        note: `Movimiento rápido hacia ${destination}`
      },
      ...prev
    ])
  }

  const toggleStatusFocus = (status: TaskStatus) => {
    setStatusFocus((prev) =>
      prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]
    )
  }

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task)
  }

  const handleSaveTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    )
    setActivity((prev) => [
      {
        id: `edit-${Date.now()}`,
        taskId: updatedTask.id,
        from: updatedTask.status,
        to: updatedTask.status,
        actorId: updatedTask.ownerId,
        timestamp: new Date().toISOString(),
        note: 'Tarea actualizada'
      },
      ...prev
    ])
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    setTaskToEdit(null)
  }

  return (
    <div className="trello-plot-app">
      <Header teamMembers={teamMembers} activity={activity} />
      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        ownerFilter={ownerFilter}
        onOwnerChange={setOwnerFilter}
        statusFocus={statusFocus}
        onStatusToggle={toggleStatusFocus}
        onStatusReset={() => setStatusFocus([])}
        columns={BOARD_COLUMNS}
        priorityFilter={priorityFilter}
        onPriorityChange={(value) => setPriorityFilter(value as PriorityFilter)}
        priorityFilters={PRIORITY_FILTERS}
        teamMembers={teamMembers}
      />

      <main className="app-layout">
        <section className="board-panel">
          <Board
            columns={BOARD_COLUMNS}
            tasks={filteredTasks}
            allTasks={tasks}
            onMoveTask={handleMoveTask}
            members={teamMembers}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        </section>

        <aside className="insights-panel">
          <StatsPanel tasks={tasks} activity={activity} teamMembers={teamMembers} />
          <ActivityFeed activity={activity} teamMembers={teamMembers} />
        </aside>
      </main>

      {taskToEdit && (
        <TaskEditModal
          task={taskToEdit}
          teamMembers={teamMembers}
          onClose={() => setTaskToEdit(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  )
}

export default App

