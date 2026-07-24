import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  type NodeTypes,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import { type Stance, type TreeState, palette } from '../argtree'
import { ArgumentNode } from './ArgumentNode'

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
  onAddConnection: (sourceNodeId: string, targetNodeId: string) => void
  definitionsCollapsed: boolean
  onToggleDefinitionsCollapsed: () => void
  onAutoLayout: () => void
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void
  selectedEdgeId: string | null
  onSelectEdge: (edgeId: string | null) => void
  onDeleteEdge: (edgeId: string) => void
}

const nodeTypes: NodeTypes = {
  argumentNode: ArgumentNode as any,
}

function buildNodes(
  selectedTree: TreeState,
  editingNodeId: string | null,
  onSelectNode: (id: string) => void,
  onEditNode: (id: string) => void,
  onStopEditingNode: () => void,
  onUpdateNodeText: (id: string, text: string) => void,
  onDeleteNode: (id: string) => void,
  onAddBranchFromNode: (parentId: string, stance: Stance) => void,
): Node[] {
  return Object.values(selectedTree.nodes).map((node) => ({
    id: node.id,
    type: 'argumentNode',
    position: selectedTree.positions[node.id] || { x: 0, y: 0 },
    data: {
      node,
      isRoot: node.id === selectedTree.rootId,
      isSelected: node.id === selectedTree.selectedNodeId,
      isEditing: editingNodeId === node.id,
      onSelectNode,
      onEditNode,
      onStopEditingNode,
      onUpdateNodeText,
      onDeleteNode,
      onAddBranchFromNode,
    },
  }))
}

function buildEdges(selectedTree: TreeState, selectedEdgeId: string | null): Edge[] {
  const edges: Edge[] = []
  Object.values(selectedTree.nodes).forEach((parentNode) => {
    parentNode.childIds.forEach((childId) => {
      const childNode = selectedTree.nodes[childId]
      const stance = childNode ? childNode.stance : 'support'
      const color = palette[stance as Stance] ?? palette.support
      const isSelected = selectedEdgeId === `edge-${parentNode.id}-${childId}`

      edges.push({
        id: `edge-${parentNode.id}-${childId}`,
        source: parentNode.id,
        target: childId,
        type: 'default',
        style: { stroke: isSelected ? '#ffffff' : color, strokeWidth: isSelected ? 4.5 : 3.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isSelected ? '#ffffff' : color, width: 16, height: 16 },
      })
    })

    parentNode.connectionIds.forEach((connId) => {
      const isSelected = selectedEdgeId === `conn-${parentNode.id}-${connId}`
      edges.push({
        id: `conn-${parentNode.id}-${connId}`,
        source: parentNode.id,
        target: connId,
        type: 'default',
        style: {
          stroke: isSelected ? '#ffffff' : '#a7b0c0',
          strokeWidth: isSelected ? 4 : 2.5,
          strokeDasharray: '6 6',
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: isSelected ? '#ffffff' : '#a7b0c0', width: 14, height: 14 },
      })
    })
  })
  return edges
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
  onAddConnection,
  definitionsCollapsed,
  onToggleDefinitionsCollapsed,
  onAutoLayout,
  onUpdateNodePosition,
  selectedEdgeId,
  onSelectEdge,
  onDeleteEdge,
}: WorkspaceStageProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges] = useEdgesState<Edge>([])

  // Sync nodes from external state — but only update positions/data, not during active drag
  useEffect(() => {
    setNodes(
      buildNodes(
        selectedTree,
        editingNodeId,
        onSelectNode,
        onEditNode,
        onStopEditingNode,
        onUpdateNodeText,
        onDeleteNode,
        onAddBranchFromNode,
      ),
    )
  }, [
    selectedTree,
    editingNodeId,
    onSelectNode,
    onEditNode,
    onStopEditingNode,
    onUpdateNodeText,
    onDeleteNode,
    onAddBranchFromNode,
    setNodes,
  ])

  // Sync edges from external state
  useEffect(() => {
    setEdges(buildEdges(selectedTree, selectedEdgeId))
  }, [selectedTree, selectedEdgeId, setEdges])

  // Only persist position back to state when drag ends, not every frame
  const handleNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      onUpdateNodePosition(node.id, node.position.x, node.position.y)
    },
    [onUpdateNodePosition],
  )

  const handleConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) return
      const isFromButton = params.sourceHandle?.startsWith('support') || params.sourceHandle?.startsWith('attack')
      if (isFromButton) {
        const stance: Stance = params.sourceHandle?.startsWith('attack') ? 'attack' : 'support'
        onAddBranchFromNode(params.source, stance)
      } else {
        onAddConnection(params.source, params.target)
      }
    },
    [onAddBranchFromNode, onAddConnection],
  )

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      onSelectEdge(edge.id)
    },
    [onSelectEdge],
  )

  const handleEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      onDeleteEdge(edge.id)
    },
    [onDeleteEdge],
  )

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
              <span className="drag-hint">Add branch:</span>
              <button
                type="button"
                className="node-branch-button support toolbar-drag-button"
                onClick={() => {
                  const targetId = selectedTree.selectedNodeId || selectedTree.rootId
                  if (targetId) onAddBranchFromNode(targetId, 'support')
                }}
                title="Click to add a Support branch to selected node"
              >
                Support +
              </button>
              <button
                type="button"
                className="node-branch-button attack toolbar-drag-button"
                onClick={() => {
                  const targetId = selectedTree.selectedNodeId || selectedTree.rootId
                  if (targetId) onAddBranchFromNode(targetId, 'attack')
                }}
                title="Click to add an Attack branch to selected node"
              >
                Attack +
              </button>
            </div>

            <button type="button" className="secondary" onClick={onAutoLayout} title="Auto-arrange tree layout">
              Auto-arrange tree
            </button>
          </div>
        </div>

        <div className="tree-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onNodeDragStop={handleNodeDragStop}
            onConnect={handleConnect}
            onEdgeClick={handleEdgeClick}
            onEdgeDoubleClick={handleEdgeDoubleClick}
            onPaneClick={() => onSelectEdge(null)}
            fitView
            colorMode="dark"
          >
            <Background color="#ffffff" gap={32} size={1} style={{ opacity: 0.08 }} />
            <Controls style={{ borderRadius: 12, background: 'rgba(12, 17, 29, 0.9)', border: '1px solid rgba(255, 255, 255, 0.15)' }} />
          </ReactFlow>
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