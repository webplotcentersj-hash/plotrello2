import { useEffect, useState } from 'react'
import type { Task, TeamMember, TaskStatus } from '../types/board'
import type { MaterialRecord, SectorRecord } from '../types/api'
import './TaskEditModal.css'

type TaskCreateModalProps = {
  teamMembers: TeamMember[]
  sectores: SectorRecord[]
  materiales: MaterialRecord[]
  onClose: () => void
  onCreate: (newTask: Omit<Task, 'id'>) => void
}

const COMPLEXITY_OPTIONS = ['Baja', 'Media', 'Alta']
const PRIORITY_OPTIONS = ['Normal', 'Alta', 'Media', 'Baja']

const TaskCreateModal = ({ teamMembers, sectores, materiales, onClose, onCreate }: TaskCreateModalProps) => {
  const [opNumber, setOpNumber] = useState('')
  const [cliente, setCliente] = useState('')
  const [fechaEntrega, setFechaEntrega] = useState('')
  const [horaEstimada, setHoraEstimada] = useState('')
  const [selectedSector, setSelectedSector] = useState<string>('')
  const [sectorSearch, setSectorSearch] = useState('')
  const [operario, setOperario] = useState<string>('')
  const [complejidad, setComplejidad] = useState<string>('Media')
  const [prioridad, setPrioridad] = useState<string>('Normal')
  const [descripcion, setDescripcion] = useState('')
  const [materials, setMaterials] = useState<Array<{ name: string; quantity: number }>>([])
  const [materialSearch, setMaterialSearch] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<string[]>([])

  useEffect(() => {
    if (!selectedSector && sectores.length > 0) {
      setSelectedSector(sectores[0].nombre)
    }
  }, [sectores, selectedSector])

  useEffect(() => {
    if (!operario && teamMembers.length > 0) {
      setOperario(teamMembers[0].id)
    }
  }, [teamMembers, operario])

  const handleCreate = () => {
    if (!opNumber || !cliente || !selectedSector) {
      alert('Por favor completa los campos obligatorios: N° OP, Cliente y Sector')
      return
    }

    const dueDate = fechaEntrega
      ? horaEstimada
        ? new Date(`${fechaEntrega}T${horaEstimada}`).toISOString()
        : new Date(`${fechaEntrega}T00:00`).toISOString()
      : new Date().toISOString()

    const newTask: Omit<Task, 'id'> = {
      opNumber,
      title: cliente,
      summary: descripcion || 'Sin descripción.',
      status: 'diseno-grafico' as TaskStatus,
      priority: (prioridad.toLowerCase() === 'normal' ? 'media' : prioridad.toLowerCase()) as any,
      ownerId: operario || teamMembers[0]?.id || '',
      createdBy: 'Usuario actual',
      tags: [],
      materials: materials.map((m) => m.name),
      assignedSector: selectedSector,
      photoUrl: attachedFiles[0] || '',
      storyPoints: 0,
      progress: 0,
      createdAt: new Date().toISOString(),
      dueDate,
      updatedAt: new Date().toISOString(),
      impact: 'media'
    }

    onCreate(newTask)
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
    setSelectedSector(sector)
    setSectorSearch('')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const url = reader.result as string
          setAttachedFiles([...attachedFiles, url])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index))
  }

  const filteredSectors =
    sectorSearch.length >= 1
      ? sectores.filter(
          (sector) =>
            sector.nombre.toLowerCase().includes(sectorSearch.toLowerCase()) &&
            sector.nombre !== selectedSector
        )
      : sectores.filter((sector) => sector.nombre !== selectedSector).slice(0, 8)

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
          <h2>Agregar Nueva Orden</h2>
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
                value={opNumber}
                onChange={(e) => setOpNumber(e.target.value)}
                placeholder=""
              />
            </div>

            <div className="form-group">
              <label>Cliente</label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder=""
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Fecha Entrega</label>
              <input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                placeholder="dd/mm/aaaa"
              />
            </div>

            <div className="form-group">
              <label>Hora Estimada</label>
              <input
                type="time"
                value={horaEstimada}
                onChange={(e) => setHoraEstimada(e.target.value)}
                placeholder="--:--"
              />
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
            {selectedSector && (
              <div className="selected-tags">
                <span className="tag selected">
                  {selectedSector}
                  <button type="button" onClick={() => setSelectedSector('')}>
                    ×
                  </button>
                </span>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Operario</label>
              <select value={operario} onChange={(e) => setOperario(e.target.value)}>
                <option value="">Seleccionar...</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Complejidad</label>
              <select value={complejidad} onChange={(e) => setComplejidad(e.target.value)}>
                {COMPLEXITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Prioridad</label>
              <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder=""
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
            <label>Archivos (imágenes o PDF)</label>
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
                Elegir archivos
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleFileUpload}
                  hidden
                />
              </label>
              <span className="upload-hint">
                {attachedFiles.length === 0 ? 'Ningún archivo seleccionado' : `${attachedFiles.length} archivo(s) seleccionado(s)`}
              </span>
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn-create" onClick={handleCreate}>
            Agregar Orden
          </button>
        </footer>
      </div>
    </div>
  )
}

export default TaskCreateModal

