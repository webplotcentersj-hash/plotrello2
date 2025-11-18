import { useMemo } from 'react'
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import type { ColumnConfig, Task, TaskStatus, TeamMember } from '../types/board'
import Column from './Column'
import './Board.css'

type BoardProps = {
  columns: ColumnConfig[]
  tasks: Task[]
  allTasks: Task[]
  onMoveTask: (taskId: string, destination: TaskStatus) => void
  members: TeamMember[]
}

const Board = ({ columns, tasks, allTasks, onMoveTask, members }: BoardProps) => {
  const groupedByStatus = useMemo(() => {
    return columns.reduce<Record<string, Task[]>>((acc, column) => {
      acc[column.id] = tasks.filter((task) => task.status === column.id)
      return acc
    }, {})
  }, [tasks, columns])

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }
    onMoveTask(draggableId, destination.droppableId as TaskStatus)
  }

  return (
    <div className="board-wrapper">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="columns-grid">
          {columns.map((column) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided, snapshot) => (
                <Column
                  column={column}
                  tasks={groupedByStatus[column.id] ?? []}
                  members={members}
                  totalColumnTasks={allTasks.filter((task) => task.status === column.id).length}
                  droppableProvided={provided}
                  isActive={snapshot.isDraggingOver}
                />
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

export default Board

