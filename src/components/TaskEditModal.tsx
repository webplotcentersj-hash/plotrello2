import { useState, useEffect } from 'react'
import type { Task, TeamMember } from '../types/board'
import type { MaterialRecord, SectorRecord } from '../types/api'
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
  const [attachedFiles, setAttachedFiles] = useState<string[]>([])
  const [complexity, setComplexity] = useState<string>('Baja')
  const [estimatedTime, setEstimatedTime] = useState<string>('00:00')

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
      setAttachedFiles(task.photoUrl ? [task.photoUrl] : [])
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
    if (materialSearch.length >= 2) {
      addMaterial(materialSearch)
      setMaterialSearch('')
    }
  }

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }

  const handleAddSector = (sector: string) => {
    if (!selectedSectors.includes(sector)) {
      setSelectedSectors([...selectedSectors, sector])
    }
    setSectorSearch('')
  }

  const handleRemoveSector = (sector: string) => {
    setSelectedSectors(selectedSectors.filter((s) => s !== sector))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const url = reader.result as string
        setAttachedFiles([...attachedFiles, url])
        setFormData({ ...formData, photoUrl: url })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = attachedFiles.filter((_, i) => i !== index)
    setAttachedFiles(newFiles)
    if (newFiles.length > 0) {
      setFormData({ ...formData, photoUrl: newFiles[0] })
    } else {
      setFormData({ ...formData, photoUrl: '' })
    }
  }

  const filteredSectors =
    sectorSearch.length >= 1
      ? sectores.filter(
          (sector) =>
            sector.nombre.toLowerCase().includes(sectorSearch.toLowerCase()) &&
            !selectedSectors.includes(sector.nombre)
        )
      : sectores.filter((sector) => !selectedSectors.includes(sector.nombre)).slice(0, 8)

  const filteredMaterials =
    materialSearch.length >= 2
      ? materiales
          .filter((material) => {
            const query = materialSearch.toLowerCase()
            return (
              material.descripcion?.toLowerCase().includes(query) ||
              material.codigo?.toLowerCase().includes(query)
            )
          })
          .slice(0, 12)
      : []

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
              placeholder="Buscar sectores (mínimo 2 caracteres)..."
              value={sectorSearch}
              onChange={(e) => setSectorSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredSectors.length > 0) {
                  handleAddSector(filteredSectors[0].nombre)
                }
              }}
            />
            {filteredSectors.length > 0 && (
              <div className="dropdown-list">
                {filteredSectors.map((sector) => (
                  <div
                    key={sector.id}
                    className="dropdown-item"
                    onClick={() => handleAddSector(sector.nombre)}
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
              placeholder="Buscar material (mínimo 2 caracteres)..."
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && materialSearch.length >= 2) {
                  handleAddMaterial()
                }
              }}
            />
            {materialSearch.length >= 2 && filteredMaterials.length > 0 && (
              <div className="dropdown-list">
                {filteredMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="dropdown-item"
                    onClick={() => {
                      addMaterial(material.descripcion)
                      setMaterialSearch('')
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
            {attachedFiles.length > 0 && (
              <div className="attached-files">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <span>{file.split('/').pop() || `Archivo ${index + 1}`}</span>
                    <button type="button" className="delete-file" onClick={() => handleRemoveFile(index)}>
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="upload-section">
              <label className="upload-button">
                Seleccionar archivo
                <input type="file" accept="image/*" onChange={handleFileUpload} hidden />
              </label>
              <span className="upload-hint">Ningún archivo seleccionado</span>
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
          <button type="button" className="btn-save" onClick={handleSave}>
            Guardar Cambios
          </button>
        </footer>
      </div>
    </div>
  )
}

export default TaskEditModal

