import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import './App.css'
import {
  createEmptyTree,
  createId,
  STORAGE_KEY,
  readInitialState,
  seedWorkspace,
  seedTree,
  type Stance,
  type TreeState,
  type WorkspaceState,
  palette,
} from './argtree'
import { TopControls } from './components/TopControls'
import { WorkspaceStage } from './components/WorkspaceStage'

function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(readInitialState)
  const [newDefinitionTerm, setNewDefinitionTerm] = useState('')
  const [newDefinitionDescription, setNewDefinitionDescription] = useState('')
  const [newTreeTitle, setNewTreeTitle] = useState('Untitled tree')
  const [newTreeClaim, setNewTreeClaim] = useState('')
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [definitionsCollapsed, setDefinitionsCollapsed] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<
    | {
        kind: 'node'
        nodeId: string
        pointerId: number
        startX: number
        startY: number
        originX: number
        originY: number
      }
    | {
        kind: 'pan'
        pointerId: number
        startX: number
        startY: number
        originX: number
        originY: number
      }
    | null
  >(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
  }, [workspace])

  const treeList = useMemo(() => Object.values(workspace.trees), [workspace.trees])
  const selectedTree = workspace.trees[workspace.selectedTreeId] ?? treeList[0] ?? seedTree('Starter tree')

  const updateSelectedTree = (updater: (tree: TreeState) => TreeState) => {
    setWorkspace((current) => {
      const activeTree = current.trees[current.selectedTreeId] ?? Object.values(current.trees)[0]

      if (!activeTree) {
        return current
      }

      const nextTree = updater(activeTree)

      return {
        ...current,
        selectedTreeId: nextTree.id,
        trees: {
          ...current.trees,
          [activeTree.id]: nextTree,
        },
      }
    })
  }

  const handleZoomChange = (updater: (current: number) => number) => {
    setZoom((current) => clampZoom(updater(current)))
  }

  const handleSelectNode = (nodeId: string) => {
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      selectedNodeId: nodeId,
    }))
  }

  const handleEditNode = (nodeId: string) => {
    handleSelectNode(nodeId)
    setEditingNodeId(nodeId)
  }

  const updateNodeText = (nodeId: string, text: string) => {
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      nodes: {
        ...currentTree.nodes,
        [nodeId]: {
          ...currentTree.nodes[nodeId],
          text,
        },
      },
    }))
  }

  const addBranchFromNode = (parentNodeId: string, stance: Stance) => {
    const id = createId()
    const text = stance === 'support' ? 'New supporting point' : 'New counterargument'

    updateSelectedTree((currentTree) => {
      const parent = currentTree.nodes[parentNodeId]
      if (!parent) {
        return currentTree
      }

      const parentPosition = currentTree.positions[parent.id] ?? { x: 0, y: 0 }
      const branchCount = parent.childIds.length
      const direction = stance === 'attack' ? 1 : -1

      return {
        ...currentTree,
        selectedNodeId: id,
        positions: {
          ...currentTree.positions,
          [id]: {
            x: parentPosition.x + 250,
            y: parentPosition.y + direction * (120 + branchCount * 56),
          },
        },
        nodes: {
          ...currentTree.nodes,
          [id]: {
            id,
            text,
            stance,
            childIds: [],
            connectionIds: [],
          },
          [parent.id]: {
            ...parent,
            childIds: [...parent.childIds, id],
          },
        },
      }
    })

    setEditingNodeId(id)
  }

  const updateNodePosition = (nodeId: string, x: number, y: number) => {
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      positions: {
        ...currentTree.positions,
        [nodeId]: { x, y },
      },
    }))
  }

  const clampZoom = (value: number) => Math.min(1.8, Math.max(0.45, value))

  const zoomAtPoint = (nextZoom: number, clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const pointX = clientX - rect.left
    const pointY = clientY - rect.top

    setPan((currentPan) => ({
      x: pointX - ((pointX - currentPan.x) * nextZoom) / zoom,
      y: pointY - ((pointY - currentPan.y) * nextZoom) / zoom,
    }))
    setZoom(nextZoom)
  }

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const nextZoom = clampZoom(zoom + (event.deltaY > 0 ? -0.08 : 0.08))
    zoomAtPoint(nextZoom, event.clientX, event.clientY)
  }

  const addDefinition = () => {
    const term = newDefinitionTerm.trim()
    const description = newDefinitionDescription.trim()

    if (!term || !description) return

    const id = createId()

    updateSelectedTree((currentTree) => ({
      ...currentTree,
      definitions: [...currentTree.definitions, { id, term, description }],
    }))

    setNewDefinitionTerm('')
    setNewDefinitionDescription('')
  }

  const createTree = () => {
    const title = newTreeTitle.trim() || 'Untitled tree'
    const rootText = newTreeClaim.trim() || 'Write the central claim for this argument tree.'
    const tree = createEmptyTree(title, rootText)

    setWorkspace((current) => ({
      selectedTreeId: tree.id,
      trees: {
        ...current.trees,
        [tree.id]: tree,
      },
    }))
    setNewTreeTitle('Untitled tree')
    setNewTreeClaim('')
    setNewDefinitionTerm('')
    setNewDefinitionDescription('')
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const resetWorkspace = () => {
    setWorkspace(seedWorkspace())
    setNewDefinitionTerm('')
    setNewDefinitionDescription('')
    setNewTreeTitle('Untitled tree')
    setNewTreeClaim('')
    setEditingNodeId(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>, nodeId?: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.setPointerCapture(event.pointerId)

    if (nodeId) {
      const nodePosition = selectedTree.positions[nodeId] ?? { x: 0, y: 0 }
      dragStateRef.current = {
        kind: 'node',
        nodeId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: nodePosition.x,
        originY: nodePosition.y,
      }

      updateSelectedTree((currentTree) => ({
        ...currentTree,
        selectedNodeId: nodeId,
      }))

      return
    }

    dragStateRef.current = {
      kind: 'pan',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    if (dragState.kind === 'node') {
      updateNodePosition(
        dragState.nodeId,
        dragState.originX + (event.clientX - dragState.startX) / zoom,
        dragState.originY + (event.clientY - dragState.startY) / zoom,
      )
      return
    }

    setPan({
      x: dragState.originX + (event.clientX - dragState.startX),
      y: dragState.originY + (event.clientY - dragState.startY),
    })
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const canvas = canvasRef.current
    if (canvas && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    dragStateRef.current = null
  }

  const edgePaths = Object.values(selectedTree.nodes).flatMap((node) => {
    const origin = selectedTree.positions[node.id]
    if (!origin) return []

    const childEdges = node.childIds.flatMap((childId) => {
      const target = selectedTree.positions[childId]
      if (!target) return []

      const controlX = origin.x + (target.x - origin.x) * 0.36

      return [
        {
          id: `${node.id}-${childId}`,
          d: `M ${origin.x} ${origin.y} C ${controlX} ${origin.y}, ${target.x - (target.x - origin.x) * 0.18} ${target.y}, ${target.x} ${target.y}`,
          color: palette[selectedTree.nodes[childId].stance],
          dashed: false,
        },
      ]
    })

    const connectionEdges = node.connectionIds.flatMap((connectionId) => {
      const target = selectedTree.positions[connectionId]
      if (!target) return []

      const controlX = origin.x + (target.x - origin.x) * 0.4

      return [
        {
          id: `${node.id}-c-${connectionId}`,
          d: `M ${origin.x} ${origin.y} C ${controlX} ${origin.y - 90}, ${target.x - (target.x - origin.x) * 0.15} ${target.y - 40}, ${target.x} ${target.y}`,
          color: 'rgba(92, 100, 117, 0.7)',
          dashed: true,
        },
      ]
    })

    return [...childEdges, ...connectionEdges]
  })

  return (
    <main className="app-shell">
      <TopControls
        treeList={treeList}
        selectedTreeId={workspace.selectedTreeId}
        onSelectTreeId={(treeId) => setWorkspace((current) => ({ ...current, selectedTreeId: treeId }))}
        newTreeTitle={newTreeTitle}
        onNewTreeTitleChange={setNewTreeTitle}
        newTreeClaim={newTreeClaim}
        onNewTreeClaimChange={setNewTreeClaim}
        onCreateTree={createTree}
        onResetWorkspace={resetWorkspace}
      />

      <WorkspaceStage
        selectedTree={selectedTree}
        editingNodeId={editingNodeId}
        onEditNode={handleEditNode}
        onStopEditingNode={() => setEditingNodeId(null)}
        onUpdateNodeText={updateNodeText}
        newDefinitionTerm={newDefinitionTerm}
        onNewDefinitionTermChange={setNewDefinitionTerm}
        newDefinitionDescription={newDefinitionDescription}
        onNewDefinitionDescriptionChange={setNewDefinitionDescription}
        onAddDefinition={addDefinition}
        onSelectNode={handleSelectNode}
        onAddBranchFromNode={addBranchFromNode}
        onCanvasPointerDown={handlePointerDown}
        onCanvasPointerMove={handlePointerMove}
        onCanvasPointerUp={handlePointerUp}
        onCanvasWheel={handleWheel}
        canvasRef={canvasRef}
        definitionsCollapsed={definitionsCollapsed}
        onToggleDefinitionsCollapsed={() => setDefinitionsCollapsed((current) => !current)}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        onResetView={() => {
          setZoom(1)
          setPan({ x: 0, y: 0 })
        }}
        pan={pan}
        edgePaths={edgePaths}
      />
    </main>
  )
}

export default App
