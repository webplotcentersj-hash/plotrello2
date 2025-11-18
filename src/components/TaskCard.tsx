import { Draggable } from '@hello-pangea/dnd'
import clsx from 'clsx'
import type { Task, TeamMember } from '../types/board'
import './TaskCard.css'

type TaskCardProps = {
  task: Task
  index: number
  owner?: TeamMember
}

const formatDate = (value: string) => {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short'
  }).format(new Date(value))
}

const TaskCard = ({ task, index, owner }: TaskCardProps) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <article
          className={clsx('task-card', `priority-${task.priority}`, {
            'is-dragging': snapshot.isDragging
          })}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <header className="task-head">
            <span className="task-id">{task.id}</span>
            <span className="task-priority">{task.priority}</span>
          </header>

          <h4>{task.title}</h4>
          <p>{task.summary}</p>

          <div className="task-tags">
            {task.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="task-progress">
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${task.progress}%` }} />
            </div>
            <span>{task.progress}%</span>
          </div>

          <footer>
            <div className="owner-chip">
              <div className="owner-avatar">{owner?.avatar ?? 'TP'}</div>
              <div>
                <strong>{owner?.name ?? 'Sin asignar'}</strong>
                <small>{owner?.role ?? '—'}</small>
              </div>
            </div>
            <div className="due-date">
              <span>Entrega</span>
              <strong>{formatDate(task.dueDate)}</strong>
            </div>
          </footer>
        </article>
      )}
    </Draggable>
  )
}

export default TaskCard

