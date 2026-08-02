import { useState } from 'react'
import type { DefinitionEntry } from '../argtree'

type DefinitionsDrawerProps = {
  definitions: DefinitionEntry[]
  isCollapsed: boolean
  onToggleCollapsed: () => void
  onAddDefinition: (term: string, description: string) => void
  onDeleteDefinition: (definitionId: string) => void
}

export function DefinitionsDrawer({
  definitions,
  isCollapsed,
  onToggleCollapsed,
  onAddDefinition,
  onDeleteDefinition,
}: DefinitionsDrawerProps) {
  const [term, setTerm] = useState('')
  const [description, setDescription] = useState('')

  const handleAdd = () => {
    if (!term.trim() || !description.trim()) return
    onAddDefinition(term, description)
    setTerm('')
    setDescription('')
  }

  return (
    <aside className={`definitions-drawer ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="drawer-header">
        <div className="drawer-title-group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <h2>Definitions &amp; Context</h2>
        </div>

        <button
          type="button"
          className="drawer-toggle-btn"
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? 'Expand definitions' : 'Collapse definitions'}
          title={isCollapsed ? 'Expand definitions' : 'Collapse definitions'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <div className="drawer-body">
          <div className="definition-form">
            <div className="form-group">
              <label htmlFor="def-term">Term / Concept</label>
              <input
                id="def-term"
                type="text"
                className="input-text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Key term or premise..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="def-desc">Explanation</label>
              <textarea
                id="def-desc"
                className="input-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what this concept means..."
                rows={3}
              />
            </div>

            <button type="button" className="btn btn-secondary w-full" onClick={handleAdd}>
              Add Definition
            </button>
          </div>

          <div className="definition-cards-list">
            {definitions.map((def) => (
              <div key={def.id} className="definition-card">
                <div className="definition-card-header">
                  <h3>{def.term}</h3>
                  <button
                    type="button"
                    className="btn-icon-delete"
                    onClick={() => onDeleteDefinition(def.id)}
                    title="Delete definition"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <p>{def.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
