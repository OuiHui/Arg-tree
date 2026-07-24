import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  BaseEdge,
  getSmoothStepPath,
  applyNodeChanges,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  type NodeTypes,
  type EdgeProps,
  type EdgeTypes,
  type NodeChange,
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

function CustomArgumentEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath(props)
  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      style={{
        ...props.style,
        fill: 'none',
        strokeWidth: 4,
      }}
      markerEnd={props.markerEnd}
    />
  )
}

const edgeTypes: EdgeTypes = {
  smoothstep: CustomArgumentEdge,
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
    initialWidth: 300,
    initialHeight: 180,
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
      const edgeId = `edge-${parentNode.id}-${childId}`
      const isSelected = selectedEdgeId === edgeId

      edges.push({
        id: edgeId,
        source: parentNode.id,
        target: childId,
        type: 'smoothstep',
        style: { stroke: isSelected ? '#ffffff' : color, strokeWidth: 4 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isSelected ? '#ffffff' : color, width: 14, height: 14 },
      })
    })

    parentNode.connectionIds.forEach((connId) => {
      const edgeId = `conn-${parentNode.id}-${connId}`
      const isSelected = selectedEdgeId === edgeId
      edges.push({
        id: edgeId,
        source: parentNode.id,
        target: connId,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: isSelected ? '#ffffff' : '#a7b0c0',
          strokeWidth: 3,
          strokeDasharray: '6 6',
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: isSelected ? '#ffffff' : '#a7b0c0', width: 12, height: 12 },
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
  const [nodes, setNodes] = useState<Node[]>(() =>
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

  useEffect(() => {
    const updatedNodes = buildNodes(
      selectedTree,
      editingNodeId,
      onSelectNode,
      onEditNode,
      onStopEditingNode,
      onUpdateNodeText,
      onDeleteNode,
      onAddBranchFromNode,
    )

    setNodes((prevNodes) => {
      const prevMap = new Map(prevNodes.map((n) => [n.id, n]))
      return updatedNodes.map((n) => {
        const prev = prevMap.get(n.id)
        if (prev) {
          return {
            ...prev,
            ...n,
            position: n.position,
            data: n.data,
            measured: prev.measured ?? n.measured,
          }
        }
        return n
      })
    })
  }, [
    selectedTree,
    editingNodeId,
    onSelectNode,
    onEditNode,
    onStopEditingNode,
    onUpdateNodeText,
    onDeleteNode,
    onAddBranchFromNode,
  ])

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  const edges = useMemo(
    () => buildEdges(selectedTree, selectedEdgeId),
    [selectedTree, selectedEdgeId],
  )

  const handleNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      onUpdateNodePosition(node.id, node.position.x, node.position.y)
    },
    [onUpdateNodePosition],
  )

  const handleConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) return
      onAddConnection(params.source, params.target)
    },
    [onAddConnection],
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
            edgeTypes={edgeTypes}
            onNodesChange={handleNodesChange}
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