import type { ColumnConfig, TeamMember, TaskStatus } from '../types/board'
import './FiltersBar.css'

type FiltersBarProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  ownerFilter: string
  onOwnerChange: (value: string) => void
  statusFocus: TaskStatus[]
  onStatusToggle: (status: TaskStatus) => void
  onStatusReset: () => void
  columns: ColumnConfig[]
  priorityFilter: string
  onPriorityChange: (value: string) => void
  priorityFilters: ReadonlyArray<{ id: string; label: string }>
  teamMembers: TeamMember[]
}

const FiltersBar = ({
  searchQuery,
  onSearchChange,
  ownerFilter,
  onOwnerChange,
  statusFocus,
  onStatusToggle,
  onStatusReset,
  columns,
  priorityFilter,
  onPriorityChange,
  priorityFilters,
  teamMembers
}: FiltersBarProps) => {
  return (
    <section className="filters-bar">
      <div className="search-filter">
        <input
          type="text"
          placeholder="Buscar por ID, título o tags…"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="filter-grid">
        <div className="filter-control">
          <label>Responsable</label>
          <select value={ownerFilter} onChange={(event) => onOwnerChange(event.target.value)}>
            <option value="todos">Todo el equipo</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-control">
          <label>Prioridad</label>
          <div className="priority-group">
            {priorityFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={filter.id === priorityFilter ? 'active' : ''}
                onClick={() => onPriorityChange(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="status-chips">
        {columns.map((column) => (
          <button
            key={column.id}
            type="button"
            className={statusFocus.includes(column.id) ? 'chip active' : 'chip'}
            onClick={() => onStatusToggle(column.id)}
          >
            <span className="chip-dot" style={{ background: column.accent }} />
            {column.label}
          </button>
        ))}
        <button type="button" className="chip reset" onClick={onStatusReset}>
          Limpiar foco
        </button>
      </div>
    </section>
  )
}

export default FiltersBar

