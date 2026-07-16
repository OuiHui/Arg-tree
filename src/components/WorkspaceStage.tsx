import { type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent, type RefObject } from 'react'
import { type EdgePath, type Stance, type TreeState, palette } from '../argtree'

type WorkspaceStageProps = {
  selectedTree: TreeState
  editingNodeId: string | null
  onEditNode: (nodeId: string) => void
  onStopEditingNode: () => void
  onUpdateNodeText: (nodeId: string, text: string) => void
  newDefinitionTerm: string
  onNewDefinitionTermChange: (value: string) => void
  newDefinitionDescription: string
  onNewDefinitionDescriptionChange: (value: string) => void
  onAddDefinition: () => void
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
  pan: { x: number; y: number }
  edgePaths: EdgePath[]
}

export function WorkspaceStage({
  selectedTree,
  editingNodeId,
  onEditNode,
  onStopEditingNode,
  onUpdateNodeText,
  newDefinitionTerm,
  onNewDefinitionTermChange,
  newDefinitionDescription,
  onNewDefinitionDescriptionChange,
  onAddDefinition,
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
  pan,
  edgePaths,
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
          onPointerDown={(event) => onCanvasPointerDown(event)}
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
            <svg className="tree-links" viewBox="-2400 -1800 4800 3600" aria-hidden="true">
              <defs>
                <marker
                  id="argtree-arrow"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="6"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M 0 0 L 12 6 L 0 12 z" fill="currentColor" />
                </marker>
              </defs>
              {edgePaths.map((edge) => (
                <path
                  key={edge.id}
                  d={edge.d}
                  stroke={edge.color}
                  strokeWidth="3.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray={edge.dashed ? '10 10' : undefined}
                  markerEnd={edge.dashed ? undefined : 'url(#argtree-arrow)'}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>

            {Object.values(selectedTree.nodes).map((node) => {
              const position = selectedTree.positions[node.id] ?? { x: 0, y: 0 }
              const isRoot = node.id === selectedTree.rootId
              const isSelected = node.id === selectedTree.selectedNodeId
              const isEditing = editingNodeId === node.id

              return (
                <div
                  key={node.id}
                  className={isSelected ? 'canvas-node selected' : 'canvas-node'}
                  style={{
                    left: '50%',
                    top: '50%',
                    '--node-accent': palette[node.stance],
                    transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
                  } as CSSProperties}
                  onPointerDown={(event) => {
                    event.stopPropagation()
                    onCanvasPointerDown(event, node.id)
                  }}
                  onClick={() => onSelectNode(node.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="node-header">
                    <span className="node-badge">{isRoot ? 'Claim' : node.stance}</span>
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
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation()
                        onAddBranchFromNode(node.id, 'support')
                      }}
                    >
                      Support +
                    </button>
                    <button
                      type="button"
                      className="node-branch-button attack"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation()
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
                <h3>{definition.term}</h3>
                <p>{definition.description}</p>
              </article>
            ))}
          </div>
        </div>
      </aside>
    </section>
  )
}