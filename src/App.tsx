import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import './App.css'
import {
  createEmptyTree,
  createId,
  seedWorkspace,
  seedTree,
  computeEdgePath,
  autoLayoutTree,
  type Stance,
  type TreeState,
  type WorkspaceState,
  palette,
} from './argtree'
import {
  fetchWorkspaceApi,
  createTreeApi,
  updateTreeApi,
  deleteTreeApi,
  updateSelectedTreeIdApi,
} from './api'
import { TopControls } from './components/TopControls'
import { WorkspaceStage } from './components/WorkspaceStage'

function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(seedWorkspace)
  const [isLoading, setIsLoading] = useState(true)
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

  // Fetch initial workspace state from MongoDB server
  useEffect(() => {
    let isMounted = true

    fetchWorkspaceApi()
      .then((fetchedWorkspace) => {
        if (isMounted) {
          setWorkspace(fetchedWorkspace)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load workspace from MongoDB:', err)
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const treeList = useMemo(() => Object.values(workspace.trees), [workspace.trees])
  const selectedTree = workspace.trees[workspace.selectedTreeId] ?? treeList[0] ?? seedTree('Starter tree')

  // Debounced auto-save for current selected tree changes to MongoDB
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isLoading) return
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!selectedTree) return

    const timer = setTimeout(() => {
      updateTreeApi(selectedTree).catch((err) => {
        console.error(`Failed to sync tree ${selectedTree.id} to MongoDB:`, err)
      })
    }, 400)

    return () => clearTimeout(timer)
  }, [selectedTree, isLoading])

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

  const handleSelectTreeId = (treeId: string) => {
    setWorkspace((current) => ({ ...current, selectedTreeId: treeId }))
    updateSelectedTreeIdApi(treeId).catch((err) => {
      console.error('Failed to update active tree ID in MongoDB:', err)
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
      const sideOffset = stance === 'support' ? -180 : 180
      const spreadX = sideOffset + (branchCount > 0 ? (stance === 'support' ? -120 * branchCount : 120 * branchCount) : 0)

      return {
        ...currentTree,
        selectedNodeId: id,
        positions: {
          ...currentTree.positions,
          [id]: {
            x: parentPosition.x + spreadX,
            y: parentPosition.y + 220,
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

  const handleAutoLayout = () => {
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      positions: autoLayoutTree(currentTree),
    }))
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

    createTreeApi(tree).catch((err) => {
      console.error('Failed to create tree in MongoDB:', err)
    })

    setNewTreeTitle('Untitled tree')
    setNewTreeClaim('')
    setNewDefinitionTerm('')
    setNewDefinitionDescription('')
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const resetWorkspace = () => {
    const freshTree = seedTree('Starter tree')
    setWorkspace({
      selectedTreeId: freshTree.id,
      trees: {
        [freshTree.id]: freshTree,
      },
    })
    createTreeApi(freshTree).catch((err) => {
      console.error('Failed to seed reset tree in MongoDB:', err)
    })

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

  const deleteNode = useCallback(
    (nodeIdToDelete: string) => {
      if (nodeIdToDelete === selectedTree.rootId) {
        return
      }

      updateSelectedTree((currentTree) => {
        const getDescendants = (id: string): string[] => {
          const n = currentTree.nodes[id]
          if (!n) return []
          let list = [...n.childIds]
          for (const childId of n.childIds) {
            list = [...list, ...getDescendants(childId)]
          }
          return list
        }

        const idsToRemove = new Set([nodeIdToDelete, ...getDescendants(nodeIdToDelete)])

        const nextNodes = { ...currentTree.nodes }
        const nextPositions = { ...currentTree.positions }

        for (const id of idsToRemove) {
          delete nextNodes[id]
          delete nextPositions[id]
        }

        for (const key of Object.keys(nextNodes)) {
          const n = nextNodes[key]
          const updatedChildren = n.childIds.filter((cid) => !idsToRemove.has(cid))
          const updatedConnections = n.connectionIds.filter((cid) => !idsToRemove.has(cid))

          if (updatedChildren.length !== n.childIds.length || updatedConnections.length !== n.connectionIds.length) {
            nextNodes[key] = {
              ...n,
              childIds: updatedChildren,
              connectionIds: updatedConnections,
            }
          }
        }

        const nextSelectedId = idsToRemove.has(currentTree.selectedNodeId)
          ? currentTree.rootId
          : currentTree.selectedNodeId

        return {
          ...currentTree,
          nodes: nextNodes,
          positions: nextPositions,
          selectedNodeId: nextSelectedId,
        }
      })

      if (editingNodeId === nodeIdToDelete) {
        setEditingNodeId(null)
      }
    },
    [selectedTree.rootId, editingNodeId],
  )

  const deleteDefinition = (definitionId: string) => {
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      definitions: currentTree.definitions.filter((def) => def.id !== definitionId),
    }))
  }

  const deleteTree = (treeIdToDelete: string) => {
    deleteTreeApi(treeIdToDelete)
      .then((updatedWorkspace) => {
        setWorkspace(updatedWorkspace)
      })
      .catch((err) => {
        console.error(`Failed to delete tree ${treeIdToDelete} from MongoDB:`, err)
      })
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const activeElement = document.activeElement
        const isInputActive =
          activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement

        if (!isInputActive && selectedTree.selectedNodeId && selectedTree.selectedNodeId !== selectedTree.rootId) {
          event.preventDefault()
          deleteNode(selectedTree.selectedNodeId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteNode, selectedTree.selectedNodeId, selectedTree.rootId])

  const edgePaths = Object.values(selectedTree.nodes).flatMap((node) => {
    const origin = selectedTree.positions[node.id]
    if (!origin) return []

    const childEdges = node.childIds.flatMap((childId) => {
      const target = selectedTree.positions[childId]
      const childNode = selectedTree.nodes[childId]
      if (!target || !childNode) return []

      const stance = childNode.stance
      const markerId = `argtree-arrow-${stance}`

      return [
        {
          id: `${node.id}-${childId}`,
          d: computeEdgePath(origin, target, 280, 150, false),
          color: palette[stance],
          dashed: false,
          markerId,
        },
      ]
    })

    const connectionEdges = node.connectionIds.flatMap((connectionId) => {
      const target = selectedTree.positions[connectionId]
      if (!target) return []

      return [
        {
          id: `${node.id}-c-${connectionId}`,
          d: computeEdgePath(origin, target, 280, 150, true),
          color: 'rgba(92, 100, 117, 0.7)',
          dashed: true,
          markerId: 'argtree-arrow-connection',
        },
      ]
    })

    return [...childEdges, ...connectionEdges]
  })

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Connecting to MongoDB database...</p>
      </div>
    )
  }

  return (
    <main className="app-shell">
      <TopControls
        treeList={treeList}
        selectedTreeId={workspace.selectedTreeId}
        onSelectTreeId={handleSelectTreeId}
        newTreeTitle={newTreeTitle}
        onNewTreeTitleChange={setNewTreeTitle}
        newTreeClaim={newTreeClaim}
        onNewTreeClaimChange={setNewTreeClaim}
        onCreateTree={createTree}
        onResetWorkspace={resetWorkspace}
        onDeleteTree={deleteTree}
      />

      <WorkspaceStage
        selectedTree={selectedTree}
        editingNodeId={editingNodeId}
        onEditNode={handleEditNode}
        onStopEditingNode={() => setEditingNodeId(null)}
        onUpdateNodeText={updateNodeText}
        onDeleteNode={deleteNode}
        newDefinitionTerm={newDefinitionTerm}
        onNewDefinitionTermChange={setNewDefinitionTerm}
        newDefinitionDescription={newDefinitionDescription}
        onNewDefinitionDescriptionChange={setNewDefinitionDescription}
        onAddDefinition={addDefinition}
        onDeleteDefinition={deleteDefinition}
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
        onAutoLayout={handleAutoLayout}
        pan={pan}
        edgePaths={edgePaths}
      />
    </main>
  )
}

export default App
