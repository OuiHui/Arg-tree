import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  createEmptyTree,
  createId,
  seedWorkspace,
  seedTree,
  autoLayoutTree,
  type Stance,
  type TreeState,
  type WorkspaceState,
} from '../argtree'
import {
  fetchWorkspaceApi,
  createTreeApi,
  updateTreeApi,
  deleteTreeApi,
  updateSelectedTreeIdApi,
} from '../api'

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(seedWorkspace)
  const [isLoading, setIsLoading] = useState(true)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [definitionsCollapsed, setDefinitionsCollapsed] = useState(false)
  const [isNewTreeModalOpen, setIsNewTreeModalOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    fetchWorkspaceApi()
      .then((fetchedWorkspace) => {
        if (!isMounted) return
        const updatedTrees = { ...fetchedWorkspace.trees }
        Object.keys(updatedTrees).forEach((id) => {
          const tree = updatedTrees[id]
          const positions = tree.positions || {}
          const hasCrampedNodes = Object.values(positions).some((p) => p.y > 0 && p.y < 280)
          if (hasCrampedNodes) {
            updatedTrees[id] = {
              ...tree,
              positions: autoLayoutTree(tree),
            }
          }
        })

        setWorkspace({
          ...fetchedWorkspace,
          trees: updatedTrees,
        })
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load workspace from database:', err)
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
        console.error(`Failed to sync tree ${selectedTree.id} to database:`, err)
      })
    }, 400)

    return () => clearTimeout(timer)
  }, [selectedTree, isLoading])

  const updateSelectedTree = useCallback((updater: (tree: TreeState) => TreeState) => {
    setWorkspace((current) => {
      const activeTree = current.trees[current.selectedTreeId] ?? Object.values(current.trees)[0]
      if (!activeTree) return current
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
  }, [])

  const handleSelectTreeId = useCallback((treeId: string) => {
    setWorkspace((current) => ({ ...current, selectedTreeId: treeId }))
    updateSelectedTreeIdApi(treeId).catch((err) => {
      console.error('Failed to update active tree ID in database:', err)
    })
  }, [])

  const handleEditNode = useCallback((nodeId: string) => {
    setSelectedEdgeId(null)
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      selectedNodeId: nodeId,
    }))
    setEditingNodeId(nodeId)
  }, [updateSelectedTree])

  const updateNodeText = useCallback((nodeId: string, text: string) => {
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
  }, [updateSelectedTree])

  const addBranchFromNode = useCallback((parentNodeId: string, stance: Stance) => {
    const id = createId()
    const text = stance === 'support' ? 'New supporting point' : 'New counterargument'

    updateSelectedTree((currentTree) => {
      const parent = currentTree.nodes[parentNodeId]
      if (!parent) return currentTree

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
            y: parentPosition.y + 320,
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
  }, [updateSelectedTree])

  const addConnection = useCallback((sourceNodeId: string, targetNodeId: string) => {
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
  }, [updateSelectedTree])

  const handleAutoLayout = useCallback(() => {
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      positions: autoLayoutTree(currentTree),
    }))
  }, [updateSelectedTree])

  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      positions: {
        ...currentTree.positions,
        [nodeId]: { x, y },
      },
    }))
  }, [updateSelectedTree])

  const addDefinition = useCallback((term: string, description: string) => {
    const cleanTerm = term.trim()
    const cleanDesc = description.trim()
    if (!cleanTerm || !cleanDesc) return

    const id = createId()

    updateSelectedTree((currentTree) => ({
      ...currentTree,
      definitions: [...currentTree.definitions, { id, term: cleanTerm, description: cleanDesc }],
    }))
  }, [updateSelectedTree])

  const createTree = useCallback((titleInput: string, claimInput: string) => {
    const title = titleInput.trim() || 'Untitled tree'
    const rootText = claimInput.trim() || 'Write the central claim for this argument tree.'
    const tree = createEmptyTree(title, rootText)

    setWorkspace((current) => ({
      selectedTreeId: tree.id,
      trees: {
        ...current.trees,
        [tree.id]: tree,
      },
    }))

    createTreeApi(tree).catch((err) => {
      console.error('Failed to create tree in database:', err)
    })

    setIsNewTreeModalOpen(false)
  }, [])

  const resetWorkspace = useCallback(() => {
    const freshTree = seedTree('Starter tree')
    setWorkspace({
      selectedTreeId: freshTree.id,
      trees: {
        [freshTree.id]: freshTree,
      },
    })
    createTreeApi(freshTree).catch((err) => {
      console.error('Failed to seed reset tree in database:', err)
    })
    setEditingNodeId(null)
  }, [])

  const handleSelectNode = useCallback((nodeId: string) => {
    setSelectedEdgeId(null)
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      selectedNodeId: nodeId,
    }))
  }, [updateSelectedTree])

  const deleteEdge = useCallback((edgeIdToDelete: string) => {
    updateSelectedTree((currentTree) => {
      const nextNodes = { ...currentTree.nodes }

      for (const key of Object.keys(nextNodes)) {
        const n = nextNodes[key]
        const childEdgeId = (cid: string) => `edge-${key}-${cid}`
        const connEdgeId = (cid: string) => `conn-${key}-${cid}`

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

    setSelectedEdgeId((prev) => (prev === edgeIdToDelete ? null : prev))
  }, [updateSelectedTree])

  const deleteNode = useCallback((nodeIdToDelete: string) => {
    if (nodeIdToDelete === selectedTree.rootId) return

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

    setEditingNodeId((prev) => (prev === nodeIdToDelete ? null : prev))
  }, [selectedTree.rootId, updateSelectedTree])

  const deleteDefinition = useCallback((definitionId: string) => {
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      definitions: currentTree.definitions.filter((def) => def.id !== definitionId),
    }))
  }, [updateSelectedTree])

  const deleteTree = useCallback((treeIdToDelete: string) => {
    deleteTreeApi(treeIdToDelete)
      .then((updatedWorkspace) => {
        setWorkspace(updatedWorkspace)
      })
      .catch((err) => {
        console.error(`Failed to delete tree ${treeIdToDelete} from database:`, err)
      })
  }, [])

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

  return {
    workspace,
    isLoading,
    selectedTree,
    treeList,
    editingNodeId,
    selectedEdgeId,
    definitionsCollapsed,
    isNewTreeModalOpen,
    setIsNewTreeModalOpen,
    setEditingNodeId,
    setSelectedEdgeId,
    setDefinitionsCollapsed,
    handleSelectTreeId,
    handleEditNode,
    updateNodeText,
    addBranchFromNode,
    addConnection,
    handleAutoLayout,
    updateNodePosition,
    addDefinition,
    createTree,
    resetWorkspace,
    handleSelectNode,
    deleteEdge,
    deleteNode,
    deleteDefinition,
    deleteTree,
  }
}
