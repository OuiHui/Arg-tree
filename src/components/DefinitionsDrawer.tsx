import { useState, useMemo } from 'react'
import type { DefinitionEntry, ArgumentNode } from '../argtree'
import { isDefinitionLinkedToNode } from '../utils/treeOperations'

type DefinitionsDrawerProps = {
  definitions: DefinitionEntry[]
  nodes: Record<string, ArgumentNode>
  selectedNodeId: string | null
  focusedNodeIds: Set<string> | null
  isCollapsed: boolean
  onToggleCollapsed: () => void
  onAddDefinition: (term: string, description: string, linkToNodeId?: string) => void
  onDeleteDefinition: (definitionId: string) => void
  onToggleDefinitionNodeLink: (definitionId: string, nodeId: string) => void
  onSelectNode: (nodeId: string | null) => void
}

type FilterMode = 'branch' | 'all'

export function DefinitionsDrawer({
  definitions,
  nodes,
  selectedNodeId,
  focusedNodeIds,
  isCollapsed,
  onToggleCollapsed,
  onAddDefinition,
  onDeleteDefinition,
  onToggleDefinitionNodeLink,
  onSelectNode,
}: DefinitionsDrawerProps) {
  const [term, setTerm] = useState('')
  const [description, setDescription] = useState('')
  const [linkToSelected, setLinkToSelected] = useState(true)
  const [filterMode, setFilterMode] = useState<FilterMode>('branch')
  const [confirmDeleteDefId, setConfirmDeleteDefId] = useState<string | null>(null)

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null

  // Determine active node IDs set for branch filtering
  const activeBranchNodeIds = useMemo(() => {
    if (focusedNodeIds && focusedNodeIds.size > 0) {
      return focusedNodeIds
    }
    if (selectedNodeId) {
      return new Set([selectedNodeId])
    }
    return null
  }, [focusedNodeIds, selectedNodeId])

  // Filter definitions for current active branch
  const branchDefinitions = useMemo(() => {
    if (!activeBranchNodeIds) {
      return definitions
    }
    return definitions.filter((def) => {
      for (const nodeId of activeBranchNodeIds) {
        const n = nodes[nodeId]
        if (n && isDefinitionLinkedToNode(def, n.text, n.id, n.definitionIds)) {
          return true
        }
      }
      return false
    })
  }, [definitions, nodes, activeBranchNodeIds])

  const displayedDefinitions = filterMode === 'branch' && activeBranchNodeIds ? branchDefinitions : definitions

  const handleAdd = () => {
    if (!term.trim() || !description.trim()) return
    const targetNodeId = linkToSelected && selectedNodeId ? selectedNodeId : undefined
    onAddDefinition(term, description, targetNodeId)
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
          {/* Filter Mode Tabs */}
          <div className="drawer-filter-tabs">
            <button
              type="button"
              className={`filter-tab ${filterMode === 'branch' ? 'active' : ''}`}
              onClick={() => setFilterMode('branch')}
              title="Show definitions relevant to the selected node or branch"
            >
              Branch ({activeBranchNodeIds ? branchDefinitions.length : definitions.length})
            </button>
            <button
              type="button"
              className={`filter-tab ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
              title="Show all definitions in tree"
            >
              All ({definitions.length})
            </button>
          </div>

          {/* Active selection banner */}
          {selectedNode && (
            <div className="selected-node-banner">
              <div className="banner-label">Active Branch Focus</div>
              <p className="banner-node-text">{selectedNode.text}</p>
            </div>
          )}

          {/* New Definition Form */}
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

            {selectedNodeId && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={linkToSelected}
                  onChange={(e) => setLinkToSelected(e.target.checked)}
                />
                <span>Link term to active node</span>
              </label>
            )}

            <button type="button" className="btn btn-secondary w-full" onClick={handleAdd}>
              Add Definition
            </button>
          </div>

          {/* Definitions Cards List */}
          <div className="definition-cards-list">
            {displayedDefinitions.length === 0 ? (
              <div className="drawer-empty-state">
                <p>
                  {filterMode === 'branch' && activeBranchNodeIds
                    ? 'No definitions linked to this branch.'
                    : 'No definitions added yet.'}
                </p>
                {filterMode === 'branch' && activeBranchNodeIds && (
                  <button
                    type="button"
                    className="btn-link-action"
                    onClick={() => setFilterMode('all')}
                  >
                    View all {definitions.length} definition{definitions.length === 1 ? '' : 's'}
                  </button>
                )}
              </div>
            ) : (
              displayedDefinitions.map((def) => {
                const isExplicitlyLinkedToSelected = selectedNodeId
                  ? def.nodeIds?.includes(selectedNodeId) || nodes[selectedNodeId]?.definitionIds?.includes(def.id)
                  : false

                const linkedNodeIds = def.nodeIds || []

                return (
                  <div key={def.id} className="definition-card">
                    <div className="definition-card-header">
                      <h3>{def.term}</h3>
                      {confirmDeleteDefId === def.id ? (
                        <div className="def-delete-confirm-group">
                          <button
                            type="button"
                            className="btn-node-confirm-btn"
                            onClick={() => {
                              onDeleteDefinition(def.id)
                              setConfirmDeleteDefId(null)
                            }}
                            title="Click to confirm deletion"
                            aria-label="Confirm delete definition"
                          >
                            Confirm?
                          </button>
                          <button
                            type="button"
                            className="btn-icon-delete"
                            onClick={() => setConfirmDeleteDefId(null)}
                            title="Cancel delete"
                            aria-label="Cancel delete"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-icon-delete"
                          onClick={() => setConfirmDeleteDefId(def.id)}
                          title="Delete definition"
                          aria-label="Delete definition"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <p>{def.description}</p>

                    <div className="definition-card-footer">
                      {selectedNodeId && (
                        <button
                          type="button"
                          className={`btn-link-toggle ${isExplicitlyLinkedToSelected ? 'is-linked' : ''}`}
                          onClick={() => onToggleDefinitionNodeLink(def.id, selectedNodeId)}
                          title={
                            isExplicitlyLinkedToSelected
                              ? 'Click to unlink from active node'
                              : 'Click to link to active node'
                          }
                        >
                          {isExplicitlyLinkedToSelected ? '✓ Linked to Node' : '🔗 Link to Node'}
                        </button>
                      )}

                      {linkedNodeIds.length > 0 && (
                        <div className="linked-nodes-tags">
                          <span className="linked-label">Linked:</span>
                          {linkedNodeIds.map((nid) => {
                            const n = nodes[nid]
                            if (!n) return null
                            return (
                              <span
                                key={nid}
                                className={`node-link-chip ${selectedNodeId === nid ? 'active' : ''}`}
                                onClick={() => onSelectNode(nid)}
                                title={`Click to view node: ${n.text}`}
                              >
                                {n.text.slice(0, 18)}...
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
