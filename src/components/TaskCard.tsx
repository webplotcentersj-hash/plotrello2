import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import clsx from 'clsx'
import type { Task, TeamMember } from '../types/board'
import './TaskCard.css'

type TaskCardProps = {
  task: Task
  index: number
  owner?: TeamMember
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
}

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).format(new Date(value))

const formatFullDateTime = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))

const formatCompactDateTime = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))

const stripEmailDomain = (value?: string | null) => {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const atIndex = trimmed.indexOf('@')
  return atIndex > 0 ? trimmed.slice(0, atIndex) : trimmed
}

const TaskCard = ({ task, index, owner, onEdit, onDelete }: TaskCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const workerName =
    stripEmailDomain(task.workingUser) ?? stripEmailDomain(owner?.name) ?? owner?.name
  const workerDisplay = workerName ?? 'Sin asignar'
  const isWorkerAssigned = Boolean(workerName)
  const creatorDisplay = stripEmailDomain(task.createdBy) ?? task.createdBy ?? 'Sistema'
  
  // Detectar si hay modificaciones (updatedAt es más reciente que createdAt)
  const hasModifications = new Date(task.updatedAt).getTime() > new Date(task.createdAt).getTime() + 1000 // +1 segundo para evitar falsos positivos

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <article
          className={clsx('task-card', `priority-${task.priority}`, {
            'is-dragging': snapshot.isDragging,
            'is-collapsed': !isExpanded
          })}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {task.priority === 'alta' && (
            <div className="priority-led-indicator" title="Prioridad Alta"></div>
          )}
          <div className="task-actions">
            {onEdit && (
              <button
                type="button"
                className="task-action-btn task-edit"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(task)
                }}
                title="Editar"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="task-action-btn task-delete"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('¿Estás seguro de eliminar esta tarea?')) {
                    onDelete(task.id)
                  }
                }}
                title="Eliminar"
              >
                🗑️
              </button>
            )}
          </div>
          {task.photoUrl && (
            <div className="task-photo">
              <img src={task.photoUrl} alt={`Trabajo ${task.title}`} loading="lazy" />
            </div>
          )}

          <div className="task-meta">
            <div className="task-op-line">
              <span className="task-op">#{task.opNumber}</span>
              <span className="task-date">{formatShortDate(task.dueDate)}</span>
              {hasModifications && (
                <span className="task-notification-bell" title="Hay modificaciones recientes">🔔</span>
              )}
            </div>
            <h4>{task.title}</h4>
            {task.dniCuit && (
              <div className="task-dni-cuit">
                <span className="dni-cuit-label">DNI/CUIT:</span>
                <span className="dni-cuit-value">{task.dniCuit}</span>
              </div>
            )}
            <div className="task-people">
              <div className="people-chip creator-chip">
                <span className="people-label">Creó:</span>
                <strong className="people-name">{creatorDisplay}</strong>
              </div>
              <div className={clsx('people-chip', 'worker-chip', { 'is-unassigned': !isWorkerAssigned })}>
                <span className="people-label">Trabaja:</span>
                <strong className="people-name">{workerDisplay}</strong>
              </div>
            </div>
          </div>

          <div className="task-body">
            <p className="task-description">{task.summary}</p>

            {(task.clientPhone ||
              task.clientEmail ||
              task.clientAddress ||
              task.whatsappUrl ||
              task.locationUrl ||
              task.driveUrl) && (
              <div className="task-contact">
                <span className="section-label">Contacto cliente:</span>
                <div className="task-contact-links">
                  {task.clientPhone && (
                    <div className="contact-item">
                      <span className="contact-label">Teléfono</span>
                      <span className="contact-value">{task.clientPhone}</span>
                    </div>
                  )}
                  {(task.whatsappUrl || task.clientPhone) && (
                    <a
                      className="contact-pill whatsapp"
                      href={
                        task.whatsappUrl ||
                        `https://wa.me/${encodeURIComponent(
                          task.clientPhone!.replace(/[^0-9]/g, '')
                        )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      🟢 WhatsApp
                    </a>
                  )}
                  {task.clientEmail && (
                    <a
                      className="contact-pill email"
                      href={`mailto:${task.clientEmail}`}
                    >
                      ✉️ Mail
                    </a>
                  )}
                  {task.clientAddress && (
                    <div className="contact-item">
                      <span className="contact-label">Dirección</span>
                      <span className="contact-value">{task.clientAddress}</span>
                    </div>
                  )}
                  {task.locationUrl && (
                    <a
                      className="contact-pill location"
                      href={task.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📍 Ubicación
                    </a>
                  )}
                  {task.driveUrl && (
                    <a
                      className="contact-pill drive"
                      href={task.driveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📂 Drive
                    </a>
                  )}
                </div>
              </div>
            )}

            {task.materials.length > 0 && (
              <div className="task-materials">
                <span className="section-label">Materiales:</span>
                <ul>
                  {task.materials.map((material) => (
                    <li key={material}>{material}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="task-sector">
              <span className="section-label">Sector asignado:</span>
              <span className="sector-pill">{task.assignedSector}</span>
            </div>

            {task.tags.length > 0 && (
              <div className="task-tags">
                {task.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            )}

            <div className="task-progress">
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${task.progress}%` }} />
              </div>
              <span>{task.progress}%</span>
            </div>

            <div className="task-timings">
              <div>
                <span>Creado</span>
                <strong>{formatFullDateTime(task.createdAt)}</strong>
              </div>
              <div>
                <span>Entrega</span>
                <strong>{formatShortDate(task.dueDate)}</strong>
              </div>
            </div>

            <footer>
              <div className="owner-chip">
                <div className="owner-avatar">{owner?.avatar ?? 'TP'}</div>
                <div>
                  <strong>{owner?.name ?? 'Sin asignar'}</strong>
                  <small>{owner?.role ?? 'Trabajador no asignado'}</small>
                </div>
              </div>
              <div className="footer-right">
                <div className="due-date">
                  <span>Último movimiento</span>
                  <strong>{formatCompactDateTime(task.updatedAt)}</strong>
                </div>
              </div>
            </footer>
          </div>

          <button
            type="button"
            className="task-toggle"
            onClick={(event) => {
              event.stopPropagation()
              setIsExpanded((prev) => !prev)
            }}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
          </button>
        </article>
      )}
    </Draggable>
  )
}

export default TaskCard

