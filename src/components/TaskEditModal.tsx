import { useState, useEffect, useRef } from 'react'
import type { Task, TeamMember } from '../types/board'
import type { MaterialRecord, SectorRecord } from '../types/api'
import { uploadAttachmentAndGetUrl } from '../utils/storage'
import './TaskEditModal.css'

type TaskEditModalProps = {
  task: Task | null
  teamMembers: TeamMember[]
  sectores: SectorRecord[]
  materiales: MaterialRecord[]
  onClose: () => void
  onSave: (updatedTask: Task) => void
  onDelete?: (taskId: string) => void
}

type LocalAttachment = {
  id: string
  name: string
  previewUrl: string
  remoteUrl?: string
  uploading: boolean
}

const COMPLEXITY_OPTIONS = ['Baja', 'Media', 'Alta']
const PRIORITY_OPTIONS = ['Alta', 'Media', 'Baja']

const TaskEditModal = ({
  task,
  teamMembers,
  sectores,
  materiales,
  onClose,
  onSave,
  onDelete
}: TaskEditModalProps) => {
  const [formData, setFormData] = useState<Partial<Task>>({})
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [materials, setMaterials] = useState<Array<{ name: string; quantity: number }>>([])
  const [materialSearch, setMaterialSearch] = useState('')
  const [sectorSearch, setSectorSearch] = useState('')
  const [attachments, setAttachments] = useState<LocalAttachment[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [complexity, setComplexity] = useState<string>('Baja')
  const [estimatedTime, setEstimatedTime] = useState<string>('00:00')
  const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState(false)
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false)
  const attachmentsRef = useRef<LocalAttachment[]>([])
  const hasPendingUploads = attachments.some((attachment) => attachment.uploading)

  useEffect(() => {
    if (task) {
      setFormData({
        opNumber: task.opNumber,
        title: task.title,
        summary: task.summary || '',
        priority: task.priority,
        ownerId: task.ownerId,
        dueDate: task.dueDate,
        assignedSector: task.assignedSector,
        photoUrl: task.photoUrl
      })
      setSelectedSectors(task.assignedSector ? [task.assignedSector] : [])
      setMaterials(
        task.materials.map((m) => ({
          name: m,
          quantity: 1
        }))
      )
      setAttachments(
        task.photoUrl
          ? [
              {
                id: 'existing-photo',
                name: task.photoUrl.split('/').pop() || 'Adjunto',
                previewUrl: task.photoUrl,
                remoteUrl: task.photoUrl,
                uploading: false
              }
            ]
          : []
      )
      if (task.dueDate) {
        const date = new Date(task.dueDate)
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        setEstimatedTime(`${hours}:${minutes}`)
      }
    }
  }, [task])

  if (!task) return null

  const handleSave = () => {
    if (hasPendingUploads) {
      alert('Espera a que termine la subida de archivos antes de guardar.')
      return
    }

    const updated: Task = {
      ...task,
      ...formData,
      materials: materials.map((m) => m.name),
      assignedSector: selectedSectors[0] || task.assignedSector,
      updatedAt: new Date().toISOString()
    } as Task
    onSave(updated)
    onClose()
  }

  const addMaterial = (nombre: string) => {
    if (nombre.length < 2) return
    if (materials.some((m) => m.name.toLowerCase() === nombre.toLowerCase())) return
    setMaterials([...materials, { name: nombre, quantity: 1 }])
  }

  const handleAddMaterial = () => {
    if (materialSearch.trim().length === 0) return
    addMaterial(materialSearch.trim())
    setMaterialSearch('')
    setIsMaterialDropdownOpen(false)
  }

  const handleSelectMaterial = (material: MaterialRecord) => {
    const label = material.descripcion || material.codigo
    if (!label) return
    addMaterial(label)
    setMaterialSearch('')
    setIsMaterialDropdownOpen(false)
  }

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }

  const handleAddSector = (sector: string) => {
    if (!selectedSectors.includes(sector)) {
      setSelectedSectors([...selectedSectors, sector])
    }
    setSectorSearch('')
    setIsSectorDropdownOpen(false)
  }

  const handleRemoveSector = (sector: string) => {
    setSelectedSectors(selectedSectors.filter((s) => s !== sector))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return

    setUploadError(null)

    for (const file of Array.from(files)) {
      const id = crypto.randomUUID()
      const previewUrl = URL.createObjectURL(file)
      setAttachments((prev) => [...prev, { id, name: file.name, previewUrl, uploading: true }])

      try {
        const remoteUrl = await uploadAttachmentAndGetUrl(file, `capturas/${task?.id ?? 'sin-id'}`)
        setAttachments((prev) =>
          prev.map((attachment) =>
            attachment.id === id ? { ...attachment, remoteUrl, uploading: false } : attachment
          )
        )
      } catch (error) {
        console.error('Error subiendo archivo', error)
        setUploadError('No se pudo subir el archivo. Intenta nuevamente.')
        setAttachments((prev) => prev.filter((attachment) => attachment.id !== id))
        if (previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl)
        }
      }
    }

    event.target.value = ''
  }

  const handleRemoveFile = (attachmentId: string) => {
    setAttachments((prev) => {
      const toRemove = prev.find((item) => item.id === attachmentId)
      if (toRemove?.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(toRemove.previewUrl)
      }
      return prev.filter((item) => item.id !== attachmentId)
    })
  }

  useEffect(() => {
    attachmentsRef.current = attachments
    const firstReady = attachments.find((attachment) => attachment.remoteUrl && !attachment.uploading)
    if (firstReady?.remoteUrl) {
      setFormData((prev) => ({ ...prev, photoUrl: firstReady.remoteUrl }))
    } else if (attachments.length === 0) {
      setFormData((prev) => ({ ...prev, photoUrl: '' }))
    }
  }, [attachments])

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((item) => {
        if (item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl)
        }
      })
    }
  }, [])

  const normalizedSectorQuery = sectorSearch.trim().toLowerCase()
  const filteredSectors = sectores
    .filter((sector) => !selectedSectors.includes(sector.nombre))
    .filter((sector) =>
      normalizedSectorQuery ? sector.nombre.toLowerCase().includes(normalizedSectorQuery) : true
    )
    .slice(0, normalizedSectorQuery ? 12 : 7)

  const normalizedMaterialQuery = materialSearch.trim().toLowerCase()
  const filteredMaterials = materiales
    .filter((material) => {
      if (!normalizedMaterialQuery) return true
      const descripcion = material.descripcion?.toLowerCase() ?? ''
      const codigo = material.codigo?.toLowerCase() ?? ''
      return descripcion.includes(normalizedMaterialQuery) || codigo.includes(normalizedMaterialQuery)
    })
    .slice(0, normalizedMaterialQuery ? 15 : 10)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Editando OP #{formData.opNumber || task.opNumber}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>N° OP</label>
              <input
                type="text"
                value={formData.opNumber || ''}
                onChange={(e) => setFormData({ ...formData, opNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Cliente</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha Entrega</label>
              <input
                type="date"
                value={
                  formData.dueDate
                    ? new Date(formData.dueDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) => {
                  const dateStr = e.target.value
                  const timeStr = estimatedTime || '00:00'
                  const [hours, minutes] = timeStr.split(':')
                  const fullDate = new Date(dateStr)
                  fullDate.setHours(parseInt(hours), parseInt(minutes))
                  setFormData({
                    ...formData,
                    dueDate: fullDate.toISOString()
                  })
                }}
              />
            </div>

            <div className="form-group">
              <label>Hora Estimada</label>
              <input
                type="time"
                value={estimatedTime}
                onChange={(e) => {
                  const timeStr = e.target.value
                  setEstimatedTime(timeStr)
                  if (formData.dueDate) {
                    const date = new Date(formData.dueDate)
                    const [hours, minutes] = timeStr.split(':')
                    date.setHours(parseInt(hours), parseInt(minutes))
                    setFormData({ ...formData, dueDate: date.toISOString() })
                  }
                }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Operario</label>
              <select
                value={formData.ownerId || ''}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              >
                <option value="">Otro</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Complejidad</label>
              <select value={complexity} onChange={(e) => setComplexity(e.target.value)}>
                {COMPLEXITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Prioridad</label>
              <select
                value={formData.priority || 'media'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt.toLowerCase()}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Sectores</label>
            <input
              type="text"
              placeholder="Buscar o seleccionar sector..."
              value={sectorSearch}
              onChange={(e) => setSectorSearch(e.target.value)}
              onFocus={() => setIsSectorDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsSectorDropdownOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredSectors.length > 0) {
                  handleAddSector(filteredSectors[0].nombre)
                }
              }}
            />
            {isSectorDropdownOpen && filteredSectors.length > 0 && (
              <div className="dropdown-list">
                {filteredSectors.map((sector) => (
                  <div
                    key={sector.id}
                    className="dropdown-item"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      handleAddSector(sector.nombre)
                    }}
                  >
                    {sector.nombre}
                  </div>
                ))}
              </div>
            )}
            <div className="selected-tags">
              {selectedSectors.map((sector) => (
                <span key={sector} className="tag selected">
                  {sector}
                  <button type="button" onClick={() => handleRemoveSector(sector)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              rows={4}
              value={formData.summary || ''}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Sin descripción."
            />
          </div>

          <div className="form-group">
            <label>Materiales</label>
            <input
              type="text"
              placeholder="Buscar o seleccionar material..."
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
              onFocus={() => setIsMaterialDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsMaterialDropdownOpen(false), 120)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (filteredMaterials.length > 0) {
                    handleSelectMaterial(filteredMaterials[0])
                  } else {
                    handleAddMaterial()
                  }
                }
              }}
            />
            {isMaterialDropdownOpen && filteredMaterials.length > 0 && (
              <div className="dropdown-list">
                {filteredMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="dropdown-item"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      handleSelectMaterial(material)
                    }}
                  >
                    <div>
                      <strong>{material.descripcion}</strong>
                      {material.codigo && (
                        <div className="dropdown-subtext">{material.codigo}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {materials.length > 0 && (
              <div className="materials-list">
                {materials.map((material, index) => (
                  <div key={index} className="material-item">
                    <span>{material.name}</span>
                    <div className="material-controls">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={material.quantity}
                        onChange={(e) => {
                          const newMaterials = [...materials]
                          newMaterials[index].quantity = parseFloat(e.target.value) || 0
                          setMaterials(newMaterials)
                        }}
                      />
                      <button type="button" onClick={() => handleRemoveMaterial(index)}>
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Archivos Adjuntos</label>
            {attachments.length > 0 && (
              <div className="attached-files">
                {attachments.map((file) => (
                  <div key={file.id} className="file-item">
                    <div className="file-preview">
                      {file.remoteUrl || file.previewUrl ? (
                        <img src={file.remoteUrl ?? file.previewUrl} alt={file.name} />
                      ) : (
                        <span>{file.name}</span>
                      )}
                      {file.uploading && <span className="upload-pill">Subiendo...</span>}
                    </div>
                    <button
                      type="button"
                      className="delete-file"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploadError && <p className="upload-error">{uploadError}</p>}
            <div className="upload-section">
              <label className="upload-button">
                Seleccionar archivo
                <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
              </label>
              <span className="upload-hint">
                {hasPendingUploads
                  ? 'Subiendo archivo...'
                  : attachments.length === 0
                    ? 'Ningún archivo seleccionado'
                    : `${attachments.length} archivo(s) listo(s)`}
              </span>
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          {onDelete && (
            <button type="button" className="btn-delete" onClick={() => onDelete(task.id)}>
              Eliminar
            </button>
          )}
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn-save" onClick={handleSave} disabled={hasPendingUploads}>
            Guardar Cambios
          </button>
        </footer>
      </div>
    </div>
  )
}

export default TaskEditModal

