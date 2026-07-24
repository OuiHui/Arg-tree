import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  createEmptyTree,
  createId,
  seedWorkspace,
  seedTree,
  autoLayoutTree,
  type Stance,
  type TreeState,
  type WorkspaceState,
} from './argtree'
import { ReactFlowProvider } from '@xyflow/react'
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
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)

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
      const spreadX =
        sideOffset + (branchCount > 0 ? (stance === 'support' ? -120 * branchCount : 120 * branchCount) : 0)

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

  const addConnection = (sourceNodeId: string, targetNodeId: string) => {
    if (sourceNodeId === targetNodeId) return

    updateSelectedTree((currentTree) => {
      const sourceNode = currentTree.nodes[sourceNodeId]
      const targetNode = currentTree.nodes[targetNodeId]
      if (!sourceNode || !targetNode) return currentTree

      if (
        sourceNode.childIds.includes(targetNodeId) ||
        sourceNode.connectionIds.includes(targetNodeId)
      ) {
        return currentTree
      }

      return {
        ...currentTree,
        nodes: {
          ...currentTree.nodes,
          [sourceNodeId]: {
            ...sourceNode,
            connectionIds: [...sourceNode.connectionIds, targetNodeId],
          },
        },
      }
    })
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
  }


  const handleSelectNode = (nodeId: string) => {
    setSelectedEdgeId(null)
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      selectedNodeId: nodeId,
    }))
  }

  const deleteEdge = useCallback(
    (edgeIdToDelete: string) => {
      updateSelectedTree((currentTree) => {
        const nextNodes = { ...currentTree.nodes }

        for (const key of Object.keys(nextNodes)) {
          const n = nextNodes[key]
          const childEdgeId = (cid: string) => `${key}-${cid}`
          const connEdgeId = (cid: string) => `${key}-c-${cid}`

          const updatedChildren = n.childIds.filter((cid) => childEdgeId(cid) !== edgeIdToDelete)
          const updatedConnections = n.connectionIds.filter((cid) => connEdgeId(cid) !== edgeIdToDelete)

          if (updatedChildren.length !== n.childIds.length || updatedConnections.length !== n.connectionIds.length) {
            nextNodes[key] = {
              ...n,
              childIds: updatedChildren,
              connectionIds: updatedConnections,
            }
          }
        }

        return {
          ...currentTree,
          nodes: nextNodes,
        }
      })

      if (selectedEdgeId === edgeIdToDelete) {
        setSelectedEdgeId(null)
      }
    },
    [selectedEdgeId],
  )

  const deleteNode = useCallback(
    (nodeIdToDelete: string) => {
      if (nodeIdToDelete === selectedTree.rootId) {
        return
      }

      updateSelectedTree((currentTree) => {
        const targetNode = currentTree.nodes[nodeIdToDelete]
        if (!targetNode) return currentTree

        const nextNodes = { ...currentTree.nodes }
        const nextPositions = { ...currentTree.positions }

        delete nextNodes[nodeIdToDelete]
        delete nextPositions[nodeIdToDelete]

        let parentId: string | null = null

        for (const key of Object.keys(nextNodes)) {
          const n = nextNodes[key]
          let updatedChildren = n.childIds
          if (n.childIds.includes(nodeIdToDelete)) {
            parentId = key
            updatedChildren = n.childIds.filter((cid) => cid !== nodeIdToDelete)
          }
          const updatedConnections = n.connectionIds.filter((cid) => cid !== nodeIdToDelete)

          if (updatedChildren !== n.childIds || updatedConnections.length !== n.connectionIds.length) {
            nextNodes[key] = {
              ...n,
              childIds: updatedChildren,
              connectionIds: updatedConnections,
            }
          }
        }

        const nextSelectedId =
          currentTree.selectedNodeId === nodeIdToDelete
            ? parentId ?? currentTree.rootId
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

        if (isInputActive) return

        if (selectedEdgeId) {
          event.preventDefault()
          deleteEdge(selectedEdgeId)
        } else if (selectedTree.selectedNodeId && selectedTree.selectedNodeId !== selectedTree.rootId) {
          event.preventDefault()
          deleteNode(selectedTree.selectedNodeId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteEdge, deleteNode, selectedEdgeId, selectedTree.selectedNodeId, selectedTree.rootId])


  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Connecting to MongoDB database...</p>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
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
        onAddConnection={addConnection}
        definitionsCollapsed={definitionsCollapsed}
        onToggleDefinitionsCollapsed={() => setDefinitionsCollapsed((current) => !current)}
        onAutoLayout={handleAutoLayout}
        onUpdateNodePosition={updateNodePosition}
        selectedEdgeId={selectedEdgeId}
        onSelectEdge={setSelectedEdgeId}
        onDeleteEdge={deleteEdge}
      />
      </main>
    </ReactFlowProvider>
  )
}

export default App
