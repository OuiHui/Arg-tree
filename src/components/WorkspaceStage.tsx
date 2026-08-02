import { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  BaseEdge,
  getSmoothStepPath,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
  type NodeTypes,
  type EdgeProps,
  type EdgeTypes,
  type NodeProps,
} from '@xyflow/react'
import { type Stance, type TreeState, palette } from '../argtree'
import { ArgumentNode, type ArgumentNodeType } from './ArgumentNode'
import { DefinitionsDrawer } from './DefinitionsDrawer'

type WorkspaceStageProps = {
  selectedTree: TreeState
  editingNodeId: string | null
  onEditNode: (nodeId: string) => void
  onStopEditingNode: () => void
  onUpdateNodeText: (nodeId: string, text: string) => void
  onDeleteNode: (nodeId: string) => void
  onSelectNode: (nodeId: string) => void
  onAddBranchFromNode: (parentNodeId: string, stance: Stance) => void
  onAddConnection: (sourceNodeId: string, targetNodeId: string) => void
  definitionsCollapsed: boolean
  onToggleDefinitionsCollapsed: () => void
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void
  selectedEdgeId: string | null
  onSelectEdge: (edgeId: string | null) => void
  onDeleteEdge: (edgeId: string) => void
  onAddDefinition: (term: string, description: string) => void
  onDeleteDefinition: (definitionId: string) => void
}

const nodeTypes: NodeTypes = {
  argumentNode: ArgumentNode as React.ComponentType<NodeProps<ArgumentNodeType>>,
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
        strokeWidth: 3,
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
    initialWidth: 280,
    initialHeight: 160,
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
        style: { stroke: isSelected ? '#ffffff' : color, strokeWidth: isSelected ? 4 : 3 },
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
          stroke: isSelected ? '#ffffff' : '#64748b',
          strokeWidth: 2,
          strokeDasharray: '5 5',
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: isSelected ? '#ffffff' : '#64748b', width: 12, height: 12 },
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
  onSelectNode,
  onAddBranchFromNode,
  onAddConnection,
  definitionsCollapsed,
  onToggleDefinitionsCollapsed,
  onUpdateNodePosition,
  selectedEdgeId,
  onSelectEdge,
  onDeleteEdge,
  onAddDefinition,
  onDeleteDefinition,
}: WorkspaceStageProps) {
  const nodes = useMemo(
    () =>
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
    [
      selectedTree,
      editingNodeId,
      onSelectNode,
      onEditNode,
      onStopEditingNode,
      onUpdateNodeText,
      onDeleteNode,
      onAddBranchFromNode,
    ],
  )

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
    <div className="workspace-container">
      <div className="canvas-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
          onEdgeClick={handleEdgeClick}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          onPaneClick={() => onSelectEdge(null)}
          fitView
          colorMode="dark"
        >
          <Background color="#475569" gap={28} size={1} style={{ opacity: 0.15 }} />
          <Controls className="react-flow-controls-custom" />
        </ReactFlow>
      </div>

      <DefinitionsDrawer
        definitions={selectedTree.definitions}
        isCollapsed={definitionsCollapsed}
        onToggleCollapsed={onToggleDefinitionsCollapsed}
        onAddDefinition={onAddDefinition}
        onDeleteDefinition={onDeleteDefinition}
      />
    </div>
  )
}