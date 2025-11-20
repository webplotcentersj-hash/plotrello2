import { useEffect, useMemo, useState } from 'react'
import Board from '../components/Board'
import Header from '../components/Header'
import FiltersBar from '../components/FiltersBar'
import StatsPanel from '../components/StatsPanel'
import ActivityFeed from '../components/ActivityFeed'
import TaskEditModal from '../components/TaskEditModal'
import TaskCreateModal from '../components/TaskCreateModal'
import SprintOptimizerModal from '../components/SprintOptimizerModal'
import PlotAIChat from '../components/PlotAIChat'
import { BOARD_COLUMNS } from '../data/mockData'
import type { ActivityEvent, Task, TaskStatus } from '../types/board'
import { useAuth } from '../hooks/useAuth'
import apiService from '../services/api'
import {
  ordenToTask,
  parseTaskIdToOrdenId,
  taskToOrdenPayload,
  mapStatusToEstado
} from '../utils/dataMappers'

const PRIORITY_FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'alta', label: 'Alta' },
  { id: 'media', label: 'Media' },
  { id: 'baja', label: 'Baja' }
] as const

type PriorityFilter = (typeof PRIORITY_FILTERS)[number]['id']

type BoardPageProps = {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  activity: ActivityEvent[]
  setActivity: React.Dispatch<React.SetStateAction<ActivityEvent[]>>
  teamMembers: any[]
  onNavigateToStats: () => void
  onNavigateToChat?: () => void
  onLogout?: () => void
  onReloadData?: () => Promise<void>
  isSyncing?: boolean
  syncError?: string | null
}

const BoardPage = ({
  tasks,
  setTasks,
  activity,
  setActivity,
  teamMembers,
  onNavigateToStats,
  onNavigateToChat,
  onLogout,
  onReloadData,
  isSyncing,
  syncError
}: BoardPageProps) => {
  const { isAdmin } = useAuth()
  const [ownerFilter, setOwnerFilter] = useState<string>('todos')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFocus, setStatusFocus] = useState<TaskStatus[]>([])
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isOptimizerModalOpen, setIsOptimizerModalOpen] = useState(false)
  const [isChatAIOpen, setIsChatAIOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (actionError || actionSuccess) {
      const timer = setTimeout(() => {
        setActionError(null)
        setActionSuccess(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [actionError, actionSuccess])

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

  const handleMoveTask = async (taskId: string, destination: TaskStatus) => {
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

    const ordenId = parseTaskIdToOrdenId(taskId)
    if (ordenId) {
      const usuarioId = Number(localStorage.getItem('usuario_id')) || 0
      const response = await apiService.moveOrden(
        ordenId,
        mapStatusToEstado(destination),
        usuarioId
      )
      if (!response.success) {
        setActionError(response.error || 'No se pudo actualizar la orden en Supabase.')
      } else {
        setActionSuccess('Orden actualizada en Supabase.')
        if (onReloadData) {
          await onReloadData()
        }
      }
    }
  }

  const toggleStatusFocus = (status: TaskStatus) => {
    setStatusFocus((prev) =>
      prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]
    )
  }

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task)
  }

  const handleSaveTask = async (updatedTask: Task) => {
    setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
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

    const ordenId = parseTaskIdToOrdenId(updatedTask.id)
    if (ordenId) {
      const response = await apiService.updateOrden(ordenId, taskToOrdenPayload(updatedTask))
      if (response.success && response.data) {
        const syncedTask = ordenToTask(response.data)
        setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? syncedTask : task)))
        setActionSuccess('Cambios guardados en Supabase.')
        if (onReloadData) await onReloadData()
      } else {
        setActionError(response.error || 'No se pudo guardar la orden en Supabase.')
      }
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    setTaskToEdit(null)

    const ordenId = parseTaskIdToOrdenId(taskId)
    if (ordenId) {
      const response = await apiService.deleteOrden(ordenId)
      if (!response.success) {
        setActionError(response.error || 'No se pudo eliminar la orden en Supabase.')
      } else if (onReloadData) {
        await onReloadData()
      }
    }
  }

  const handleCreateTask = async (newTaskData: Omit<Task, 'id'>) => {
    try {
      const response = await apiService.createOrden(taskToOrdenPayload(newTaskData))
      if (response.success && response.data) {
        const createdTask = ordenToTask(response.data)
        setTasks((prev) => [createdTask, ...prev])
        setActivity((prev) => [
          {
            id: `create-${Date.now()}`,
            taskId: createdTask.id,
            from: createdTask.status,
            to: createdTask.status,
            actorId: createdTask.ownerId,
            timestamp: new Date().toISOString(),
            note: `Nueva orden creada: ${createdTask.opNumber}`
          },
          ...prev
        ])
        setActionSuccess('Orden creada en Supabase.')
        if (onReloadData) await onReloadData()
      } else {
        setActionError(response.error || 'No se pudo crear la orden en Supabase.')
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Error inesperado al crear la orden.')
    }
  }

  const handleApplyOptimizations = (suggestions: Array<{
    type: 'reassign' | 'move' | 'priority'
    taskId: string
    taskTitle: string
    currentValue: string
    suggestedValue: string
    reason: string
    impact: 'high' | 'medium' | 'low'
  }>) => {
    setTasks((prev) =>
      prev.map((task) => {
        const suggestion = suggestions.find((s) => s.taskId === task.id)
        if (!suggestion) return task

        let updatedTask = { ...task }

        if (suggestion.type === 'reassign') {
          const newOwner = teamMembers.find((m) => m.name === suggestion.suggestedValue)
          if (newOwner) {
            updatedTask.ownerId = newOwner.id
          }
        } else if (suggestion.type === 'move') {
          const newStatus = BOARD_COLUMNS.find((col) => col.label === suggestion.suggestedValue)
          if (newStatus) {
            updatedTask.status = newStatus.id
            updatedTask.assignedSector = newStatus.label
          }
        } else if (suggestion.type === 'priority') {
          updatedTask.priority = suggestion.suggestedValue as any
        }

        updatedTask.updatedAt = new Date().toISOString()

        setActivity((prev) => [
          {
            id: `optimize-${Date.now()}-${task.id}`,
            taskId: task.id,
            from: task.status,
            to: updatedTask.status,
            actorId: updatedTask.ownerId,
            timestamp: new Date().toISOString(),
            note: `Optimización aplicada: ${suggestion.reason}`
          },
          ...prev
        ])

        return updatedTask
      })
    )
    setIsOptimizerModalOpen(false)
  }

  return (
    <div className="trello-plot-app">
      {(isSyncing || syncError || actionError || actionSuccess) && (
        <div className="sync-banner-container" style={{ marginBottom: '12px' }}>
          {isSyncing && (
            <div
              className="sync-banner"
              style={{ background: '#1f2937', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}
            >
              Sincronizando con Supabase...
            </div>
          )}
          {(syncError || actionError) && (
            <div
              className="sync-banner"
              style={{
                background: '#7f1d1d',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '8px',
                marginTop: '8px'
              }}
            >
              {actionError || syncError}
            </div>
          )}
          {actionSuccess && !actionError && (
            <div
              className="sync-banner"
              style={{
                background: '#065f46',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '8px',
                marginTop: '8px'
              }}
            >
              {actionSuccess}
            </div>
          )}
        </div>
      )}
      <Header
        teamMembers={teamMembers}
        activity={activity}
        onAddNewOrder={() => setIsCreateModalOpen(true)}
        onOptimizeSprint={() => setIsOptimizerModalOpen(true)}
        onNavigateToStats={onNavigateToStats}
        onNavigateToChat={onNavigateToChat}
        onOpenChatAI={() => setIsChatAIOpen(true)}
        onLogout={onLogout}
        isAdmin={isAdmin}
      />
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

      {isCreateModalOpen && (
        <TaskCreateModal
          teamMembers={teamMembers}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateTask}
        />
      )}

      {isOptimizerModalOpen && (
        <SprintOptimizerModal
          tasks={tasks}
          teamMembers={teamMembers}
          onClose={() => setIsOptimizerModalOpen(false)}
          onApplyOptimization={handleApplyOptimizations}
        />
      )}

      {isChatAIOpen && (
        <PlotAIChat
          tasks={tasks}
          teamMembers={teamMembers}
          activity={activity}
          onClose={() => setIsChatAIOpen(false)}
        />
      )}
    </div>
  )
}

export default BoardPage

