import { type DroppableProvided } from '@hello-pangea/dnd'
import type { ColumnConfig, Task, TeamMember } from '../types/board'
import TaskCard from './TaskCard'

type ColumnProps = {
  column: ColumnConfig
  tasks: Task[]
  members: TeamMember[]
  totalColumnTasks: number
  droppableProvided: DroppableProvided
  isActive: boolean
}

const Column = ({
  column,
  tasks,
  members,
  totalColumnTasks,
  droppableProvided,
  isActive
}: ColumnProps) => {
  return (
    <div className={`board-column ${isActive ? 'column-active' : ''}`}>
      <header>
        <div>
          <p className="column-eyebrow">{column.label}</p>
          <h3>{column.description}</h3>
        </div>
        <span className="column-pill" style={{ background: column.accent }}>
          {totalColumnTasks}
        </span>
      </header>

      <div className="column-body" ref={droppableProvided.innerRef} {...droppableProvided.droppableProps}>
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            owner={members.find((member) => member.id === task.ownerId)}
          />
        ))}
        {droppableProvided.placeholder}

        {tasks.length === 0 && <div className="column-empty">Aún no hay tarjetas aquí</div>}
      </div>
    </div>
  )
}

export default Column

