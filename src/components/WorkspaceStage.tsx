import { useMemo, useCallback, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  BaseEdge,
  getBezierPath,
  applyNodeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  MarkerType,
  type NodeTypes,
  type EdgeProps,
  type EdgeTypes,
  type NodeProps,
} from '@xyflow/react'
import { type Stance, type TreeState, palette } from '../argtree'
import { ArgumentNode, type ArgumentNodeType } from './ArgumentNode'
import { DefinitionsDrawer } from './DefinitionsDrawer'
import { getBranchNodeIds, isDefinitionLinkedToNode } from '../utils/treeOperations'

type WorkspaceStageProps = {
  selectedTree: TreeState
  editingNodeId: string | null
  onEditNode: (nodeId: string) => void
  onStopEditingNode: () => void
  onUpdateNodeText: (nodeId: string, text: string) => void
  onDeleteNode: (nodeId: string) => void
  onSelectNode: (nodeId: string | null) => void
  onAddBranchFromNode: (parentNodeId: string, stance: Stance) => void
  onAddConnection: (sourceNodeId: string, targetNodeId: string) => void
  onLinkChildNode: (parentId: string, childId: string, stance: Stance) => void
  definitionsCollapsed: boolean
  onToggleDefinitionsCollapsed: () => void
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void
  selectedEdgeId: string | null
  onSelectEdge: (edgeId: string | null) => void
  onDeleteEdge: (edgeId: string) => void
  onAddDefinition: (term: string, description: string, linkToNodeId?: string) => void
  onDeleteDefinition: (definitionId: string) => void
  onToggleDefinitionNodeLink: (definitionId: string, nodeId: string) => void
}

const nodeTypes: NodeTypes = {
  argumentNode: ArgumentNode as React.ComponentType<NodeProps<ArgumentNodeType>>,
}

function CustomArgumentEdge(props: EdgeProps) {
  const [edgePath] = getBezierPath(props)
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
  focusedNodeIds: Set<string> | null,
  onSelectNode: (id: string) => void,
  onEditNode: (id: string) => void,
  onStopEditingNode: () => void,
  onUpdateNodeText: (id: string, text: string) => void,
  onDeleteNode: (id: string) => void,
  onAddBranchFromNode: (parentId: string, stance: Stance) => void,
): Node[] {
  const attachedChildIds = new Set(
    Object.values(selectedTree.nodes).flatMap((n) => n.childIds),
  )

  return Object.values(selectedTree.nodes).map((node) => {
    const isFocused = focusedNodeIds === null || focusedNodeIds.has(node.id)
    const linkedDefs = selectedTree.definitions.filter((def) =>
      isDefinitionLinkedToNode(def, node.text, node.id, node.definitionIds)
    )

    return {
      id: node.id,
      type: 'argumentNode',
      position: selectedTree.positions[node.id] || { x: 0, y: 0 },
      initialWidth: 280,
      initialHeight: 160,
      data: {
        node,
        isRoot: node.id === selectedTree.rootId,
        isOrphan: node.id !== selectedTree.rootId && !attachedChildIds.has(node.id),
        isSelected: node.id === selectedTree.selectedNodeId,
        isDimmed: !isFocused,
        isEditing: editingNodeId === node.id,
        linkedDefinitions: linkedDefs,
        onSelectNode,
        onEditNode,
        onStopEditingNode,
        onUpdateNodeText,
        onDeleteNode,
        onAddBranchFromNode,
      },
    }
  })
}

function buildEdges(
  selectedTree: TreeState,
  selectedEdgeId: string | null,
  focusedNodeIds: Set<string> | null,
): Edge[] {
  const edges: Edge[] = []
  Object.values(selectedTree.nodes).forEach((parentNode) => {
    const isParentFocused = focusedNodeIds === null || focusedNodeIds.has(parentNode.id)

    parentNode.childIds.forEach((childId) => {
      const childNode = selectedTree.nodes[childId]
      const stance = childNode ? childNode.stance : 'support'
      const color = palette[stance as Stance] ?? palette.support
      const edgeId = `edge-${parentNode.id}-${childId}`
      const isSelected = selectedEdgeId === edgeId
      const sourceHandle = stance === 'attack' ? 'attack-source' : 'support-source'
      const isChildFocused = focusedNodeIds === null || focusedNodeIds.has(childId)
      const isEdgeFocused = isParentFocused && isChildFocused

      edges.push({
        id: edgeId,
        source: parentNode.id,
        sourceHandle,
        target: childId,
        targetHandle: 'top-target',
        type: 'smoothstep',
        style: {
          stroke: isSelected ? '#ffffff' : color,
          strokeWidth: isSelected ? 4 : 3,
          opacity: isEdgeFocused ? 1 : 0.15,
          transition: 'opacity 0.25s ease',
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: isSelected ? '#ffffff' : color, width: 14, height: 14 },
      })
    })

    parentNode.connectionIds.forEach((connId) => {
      const edgeId = `conn-${parentNode.id}-${connId}`
      const isSelected = selectedEdgeId === edgeId
      const isConnTargetFocused = focusedNodeIds === null || focusedNodeIds.has(connId)
      const isConnFocused = isParentFocused && isConnTargetFocused

      edges.push({
        id: edgeId,
        source: parentNode.id,
        sourceHandle: 'bottom-source',
        target: connId,
        targetHandle: 'top-target',
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: isSelected ? '#ffffff' : '#64748b',
          strokeWidth: 2,
          strokeDasharray: '5 5',
          opacity: isConnFocused ? 1 : 0.15,
          transition: 'opacity 0.25s ease',
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
  onLinkChildNode,
  definitionsCollapsed,
  onToggleDefinitionsCollapsed,
  onUpdateNodePosition,
  selectedEdgeId,
  onSelectEdge,
  onDeleteEdge,
  onAddDefinition,
  onDeleteDefinition,
  onToggleDefinitionNodeLink,
}: WorkspaceStageProps) {
  const focusedNodeIds = useMemo(
    () => getBranchNodeIds(selectedTree, selectedTree.selectedNodeId),
    [selectedTree],
  )

  const targetNodes = useMemo(
    () =>
      buildNodes(
        selectedTree,
        editingNodeId,
        focusedNodeIds,
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
      focusedNodeIds,
      onSelectNode,
      onEditNode,
      onStopEditingNode,
      onUpdateNodeText,
      onDeleteNode,
      onAddBranchFromNode,
    ],
  )

  const [nodes, setNodes] = useState<Node[]>(targetNodes)
  const [prevTargetNodes, setPrevTargetNodes] = useState<Node[]>(targetNodes)

  if (prevTargetNodes !== targetNodes) {
    setPrevTargetNodes(targetNodes)
    setNodes(targetNodes)
  }

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [])

  const edges = useMemo(
    () => buildEdges(selectedTree, selectedEdgeId, focusedNodeIds),
    [selectedTree, selectedEdgeId, focusedNodeIds],
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

      const { source, target, sourceHandle, targetHandle } = params

      const isSourceSupport = sourceHandle?.includes('support')
      const isTargetSupport = targetHandle?.includes('support')
      const isSourceAttack = sourceHandle?.includes('attack')
      const isTargetAttack = targetHandle?.includes('attack')

      if (isSourceSupport) {
        onLinkChildNode(source, target, 'support')
      } else if (isTargetSupport) {
        onLinkChildNode(target, source, 'support')
      } else if (isSourceAttack) {
        onLinkChildNode(source, target, 'attack')
      } else if (isTargetAttack) {
        onLinkChildNode(target, source, 'attack')
      } else {
        onAddConnection(source, target)
      }
    },
    [onAddConnection, onLinkChildNode],
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
          onNodesChange={handleNodesChange}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
          onEdgeClick={handleEdgeClick}
          onEdgeDoubleClick={handleEdgeDoubleClick}
          onPaneClick={() => {
            onSelectEdge(null)
            onSelectNode(null)
          }}
          fitView
          colorMode="dark"
        >
          <Background color="#475569" gap={28} size={1} style={{ opacity: 0.15 }} />
          <Controls className="react-flow-controls-custom" />
        </ReactFlow>
      </div>

      <DefinitionsDrawer
        definitions={selectedTree.definitions}
        nodes={selectedTree.nodes}
        selectedNodeId={selectedTree.selectedNodeId}
        focusedNodeIds={focusedNodeIds}
        isCollapsed={definitionsCollapsed}
        onToggleCollapsed={onToggleDefinitionsCollapsed}
        onAddDefinition={onAddDefinition}
        onDeleteDefinition={onDeleteDefinition}
        onToggleDefinitionNodeLink={onToggleDefinitionNodeLink}
        onSelectNode={onSelectNode}
      />
    </div>
  )
}