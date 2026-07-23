import { type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent, type RefObject } from 'react'
import { computeDragEdgePath, type BranchDragState, type EdgePath, type Stance, type TreeState, palette } from '../argtree'

type WorkspaceStageProps = {
  selectedTree: TreeState
  editingNodeId: string | null
  onEditNode: (nodeId: string) => void
  onStopEditingNode: () => void
  onUpdateNodeText: (nodeId: string, text: string) => void
  onDeleteNode: (nodeId: string) => void
  newDefinitionTerm: string
  onNewDefinitionTermChange: (value: string) => void
  newDefinitionDescription: string
  onNewDefinitionDescriptionChange: (value: string) => void
  onAddDefinition: () => void
  onDeleteDefinition: (definitionId: string) => void
  onSelectNode: (nodeId: string) => void
  onAddBranchFromNode: (parentNodeId: string, stance: Stance) => void
  onCanvasPointerDown: (event: ReactPointerEvent<HTMLElement>, nodeId?: string) => void
  onCanvasPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
  onCanvasPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
  onCanvasWheel: (event: ReactWheelEvent<HTMLDivElement>) => void
  canvasRef: RefObject<HTMLDivElement | null>
  definitionsCollapsed: boolean
  onToggleDefinitionsCollapsed: () => void
  zoom: number
  onZoomChange: (updater: (current: number) => number) => void
  onResetView: () => void
  onAutoLayout: () => void
  pan: { x: number; y: number }
  edgePaths: EdgePath[]
  activeBranchDrag: BranchDragState | null
  onBranchDragStart: (event: ReactPointerEvent<HTMLElement>, stance: Stance, sourceNodeId?: string) => void
  wasDraggingRef: RefObject<boolean>
  selectedEdgeId: string | null
  onSelectEdge: (edgeId: string | null) => void
  onDeleteEdge: (edgeId: string) => void
}

export function WorkspaceStage({
  selectedTree,
  editingNodeId,
  onEditNode,
  onStopEditingNode,
  onUpdateNodeText,
  onDeleteNode,
  newDefinitionTerm,
  onNewDefinitionTermChange,
  newDefinitionDescription,
  onNewDefinitionDescriptionChange,
  onAddDefinition,
  onDeleteDefinition,
  onSelectNode,
  onAddBranchFromNode,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onCanvasWheel,
  canvasRef,
  definitionsCollapsed,
  onToggleDefinitionsCollapsed,
  zoom,
  onZoomChange,
  onResetView,
  onAutoLayout,
  pan,
  edgePaths,
  activeBranchDrag,
  onBranchDragStart,
  wasDraggingRef,
  selectedEdgeId,
  onSelectEdge,
  onDeleteEdge,
}: WorkspaceStageProps) {
  return (
    <section className="workspace-stage">
      <section className="tree-panel">
        <div className="tree-toolbar">
          <div>
            <span className="panel-label">Argument tree</span>
            <h2>{selectedTree.title}</h2>
          </div>

          <div className="zoom-group">
            <div className="toolbar-drag-group">
              <span className="drag-hint">Drag branch:</span>
              <button
                type="button"
                className="node-branch-button support toolbar-drag-button"
                onPointerDown={(event) => {
                  event.stopPropagation()
                  onBranchDragStart(event, 'support')
                }}
                title="Drag and drop onto a node to add a Support branch"
              >
                Support +
              </button>
              <button
                type="button"
                className="node-branch-button attack toolbar-drag-button"
                onPointerDown={(event) => {
                  event.stopPropagation()
                  onBranchDragStart(event, 'attack')
                }}
                title="Drag and drop onto a node to add an Attack branch"
              >
                Attack +
              </button>
            </div>

            <button type="button" className="secondary" onClick={onAutoLayout} title="Auto-arrange tree layout">
              Auto-arrange tree
            </button>
            <button type="button" className="secondary zoom-button" onClick={() => onZoomChange((current) => Math.min(1.8, Math.max(0.45, current - 0.1)))}>
              -
            </button>
            <button type="button" className="secondary zoom-button" onClick={() => onZoomChange((current) => Math.min(1.8, Math.max(0.45, current + 0.1)))}>
              +
            </button>
            <button type="button" className="secondary" onClick={onResetView}>
              Reset view
            </button>
          </div>
        </div>

        <div
          ref={canvasRef}
          className="tree-canvas"
          onWheel={onCanvasWheel}
          onPointerDown={(event) => {
            onSelectEdge(null)
            onCanvasPointerDown(event)
          }}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onPointerLeave={onCanvasPointerUp}
        >
          <div
            className="tree-canvas-stage"
            style={{
              transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <svg className="tree-links" viewBox="-3000 -3000 6000 6000" aria-hidden="true">
              <defs>
                <marker
                  id="argtree-arrow-claim"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="6"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M 0 1 L 11 6 L 0 11 L 3 6 z" fill="#7ea7ff" stroke="#07101d" strokeWidth="0.5" />
                </marker>
                <marker
                  id="argtree-arrow-support"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="6"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M 0 1 L 11 6 L 0 11 L 3 6 z" fill="#58d39b" stroke="#07101d" strokeWidth="0.5" />
                </marker>
                <marker
                  id="argtree-arrow-attack"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="6"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M 0 1 L 11 6 L 0 11 L 3 6 z" fill="#ff7a73" stroke="#07101d" strokeWidth="0.5" />
                </marker>
                <marker
                  id="argtree-arrow-connection"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="6"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M 0 1 L 11 6 L 0 11 L 3 6 z" fill="#a7b0c0" stroke="#07101d" strokeWidth="0.5" />
                </marker>
              </defs>
              {edgePaths.map((edge) => {
                const isSelectedEdge = edge.id === selectedEdgeId
                return (
                  <g key={edge.id}>
                    {/* Wide transparent hit path for edge clicking */}
                    <path
                      d={edge.d}
                      stroke="transparent"
                      strokeWidth="20"
                      fill="none"
                      style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                      onPointerDown={(event) => {
                        event.stopPropagation()
                        onSelectEdge(edge.id)
                      }}
                    />
                    {isSelectedEdge && (
                      <path
                        d={edge.d}
                        stroke="#ffffff"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity={0.8}
                      />
                    )}
                    <path
                      d={edge.d}
                      stroke={isSelectedEdge ? '#ffffff' : edge.color}
                      strokeWidth={isSelectedEdge ? '4.5' : '3.5'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      strokeDasharray={edge.dashed ? '10 10' : undefined}
                      markerEnd={edge.markerId ? `url(#${edge.markerId})` : undefined}
                    />
                  </g>
                )
              })}
              {activeBranchDrag && (
                <path
                  d={computeDragEdgePath(activeBranchDrag.startPoint, activeBranchDrag.currentPoint)}
                  stroke={palette[activeBranchDrag.stance]}
                  strokeWidth="3.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  fill="none"
                  markerEnd={`url(#argtree-arrow-${activeBranchDrag.stance})`}
                />
              )}
            </svg>

            {edgePaths
              .filter((edge) => edge.id === selectedEdgeId)
              .map((edge) => (
                <div
                  key={`edge-del-${edge.id}`}
                  className="edge-delete-badge"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translate(${edge.midPoint.x}px, ${edge.midPoint.y}px)`,
                  } as CSSProperties}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation()
                    onDeleteEdge(edge.id)
                  }}
                  title="Delete connection"
                >
                  <button type="button" className="edge-delete-button" aria-label="Delete connection">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              ))}

            {Object.values(selectedTree.nodes).map((node) => {
              const position = selectedTree.positions[node.id] ?? { x: 0, y: 0 }
              const isRoot = node.id === selectedTree.rootId
              const isSelected = node.id === selectedTree.selectedNodeId
              const isEditing = editingNodeId === node.id
              const isDropTarget = activeBranchDrag?.dropTargetId === node.id

              let nodeClass = isSelected ? 'canvas-node selected' : 'canvas-node'
              if (isDropTarget && activeBranchDrag) {
                nodeClass += ` drop-target drop-target-${activeBranchDrag.stance}`
              }

              return (
                <div
                  key={node.id}
                  className={nodeClass}
                  style={{
                    left: '50%',
                    top: '50%',
                    '--node-accent': palette[node.stance],
                    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
                  } as CSSProperties}
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    if (!isEditing) {
                      event.preventDefault()
                    }
                    onCanvasPointerDown(event, node.id)
                  }}
                  onDragStart={(event) => event.preventDefault()}
                  onClick={() => onSelectNode(node.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="node-header">
                    <span className="node-badge">{isRoot ? 'Claim' : node.stance}</span>
                    <div className="node-header-controls">
                      <button
                        type="button"
                        className="node-edit-button"
                        onPointerDown={(event) => {
                          event.stopPropagation()
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          if (isEditing) {
                            onStopEditingNode()
                            return
                          }
                          onEditNode(node.id)
                        }}
                      >
                        {isEditing ? 'Done' : 'Edit'}
                      </button>
                      {!isRoot && (
                        <button
                          type="button"
                          className="node-delete-button"
                          title="Delete argument"
                          aria-label="Delete argument"
                          onPointerDown={(event) => {
                            event.stopPropagation()
                          }}
                          onClick={(event) => {
                            event.stopPropagation()
                            onDeleteNode(node.id)
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <textarea
                      className="node-text-editor"
                      value={node.text}
                      onChange={(event) => onUpdateNodeText(node.id, event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      autoFocus
                      rows={4}
                    />
                  ) : (
                    <p>{node.text}</p>
                  )}
                  <div className="node-actions">
                    <button
                      type="button"
                      className="node-branch-button support"
                      onPointerDown={(event) => {
                        event.stopPropagation()
                        onBranchDragStart(event, 'support', node.id)
                      }}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (wasDraggingRef.current) return
                        onAddBranchFromNode(node.id, 'support')
                      }}
                    >
                      Support +
                    </button>
                    <button
                      type="button"
                      className="node-branch-button attack"
                      onPointerDown={(event) => {
                        event.stopPropagation()
                        onBranchDragStart(event, 'attack', node.id)
                      }}
                      onClick={(event) => {
                        event.stopPropagation()
                        if (wasDraggingRef.current) return
                        onAddBranchFromNode(node.id, 'attack')
                      }}
                    >
                      Attack +
                    </button>
                  </div>
                  {node.connectionIds.length > 0 && (
                    <span className="node-footnote">{node.connectionIds.length} cross-link(s)</span>
                  )}
                </div>
              )
            })}

            {activeBranchDrag && (
              <div
                className={`drag-preview-badge stance-${activeBranchDrag.stance}`}
                style={{
                  left: '50%',
                  top: '50%',
                  '--node-accent': palette[activeBranchDrag.stance],
                  transform: `translate(-50%, -50%) translate(${activeBranchDrag.currentPoint.x}px, ${activeBranchDrag.currentPoint.y}px)`,
                } as CSSProperties}
              >
                + {activeBranchDrag.stance === 'support' ? 'Support' : 'Attack'}
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className={definitionsCollapsed ? 'panel drawer right-drawer collapsed' : 'panel drawer right-drawer open'}>
        <div className="panel-header">
          <div>
            <span className="panel-label">Definitions</span>
            <h2>Terms and context</h2>
          </div>
          <button
            type="button"
            className="secondary drawer-toggle"
            onClick={onToggleDefinitionsCollapsed}
            aria-expanded={!definitionsCollapsed}
            aria-label={definitionsCollapsed ? 'Expand definitions panel' : 'Collapse definitions panel'}
          >
            {definitionsCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>

        <div className="panel-body">
          <div className="stack">
            <label className="field">
              <span>Term</span>
              <input
                value={newDefinitionTerm}
                onChange={(event) => onNewDefinitionTermChange(event.target.value)}
                placeholder="Enter a term, concept, or background point"
              />
            </label>
            <label className="field">
              <span>Description</span>
              <textarea
                value={newDefinitionDescription}
                onChange={(event) => onNewDefinitionDescriptionChange(event.target.value)}
                placeholder="Explain what the term means or why the background matters."
                rows={4}
              />
            </label>
            <button type="button" className="secondary" onClick={onAddDefinition}>
              Add definition
            </button>
          </div>

          <div className="definition-list">
            {selectedTree.definitions.map((definition) => (
              <article key={definition.id} className="definition-card">
                <div className="definition-card-header">
                  <h3>{definition.term}</h3>
                  <button
                    type="button"
                    className="definition-delete-button"
                    title="Delete definition"
                    aria-label="Delete definition"
                    onClick={() => onDeleteDefinition(definition.id)}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                <p>{definition.description}</p>
              </article>
            ))}
          </div>
        </div>
      </aside>
    </section>
  )
}