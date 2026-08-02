import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  createEmptyTree,
  seedWorkspace,
  seedTree,
  autoLayoutTree,
  cloneTree,
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
import { useUrlTreeSync } from './useUrlTreeSync'
import { useUndoRedo } from './useUndoRedo'
import {
  updateNodeTextInTree,
  addBranchToTree,
  addConnectionToTree,
  linkChildNodeInTree,
  deleteEdgeFromTree,
  deleteNodeFromTree,
  addDefinitionToTree,
  deleteDefinitionFromTree,
} from '../utils/treeOperations'

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(seedWorkspace)
  const [isLoading, setIsLoading] = useState(true)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [definitionsCollapsed, setDefinitionsCollapsed] = useState(false)
  const [isNewTreeModalOpen, setIsNewTreeModalOpen] = useState(false)
  const [isTreeManagerOpen, setIsTreeManagerOpen] = useState(false)

  const { recordState, undo, redo, getCanUndo, getCanRedo } = useUndoRedo()

  // Fetch initial workspace & sync URL state
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

        const urlParams = new URLSearchParams(window.location.search)
        const urlTreeId = urlParams.get('treeId') || urlParams.get('tree')

        let selectedTreeId = fetchedWorkspace.selectedTreeId
        if (urlTreeId && updatedTrees[urlTreeId]) {
          selectedTreeId = urlTreeId
        } else if (!updatedTrees[selectedTreeId]) {
          selectedTreeId = Object.keys(updatedTrees)[0] || selectedTreeId
        }

        if (selectedTreeId) {
          const url = new URL(window.location.href)
          if (url.searchParams.get('treeId') !== selectedTreeId) {
            url.searchParams.set('treeId', selectedTreeId)
            window.history.replaceState({}, '', url.toString())
          }
        }

        setWorkspace({
          ...fetchedWorkspace,
          trees: updatedTrees,
          selectedTreeId,
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

  useUrlTreeSync(workspace, setWorkspace, isLoading)

  const treeList = useMemo(() => Object.values(workspace.trees), [workspace.trees])
  const selectedTree = workspace.trees[workspace.selectedTreeId] ?? treeList[0] ?? seedTree('Starter tree')

  // Auto-save changes to database
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
    recordState(selectedTree.id, selectedTree, 'text')
    updateSelectedTree((tree) => updateNodeTextInTree(tree, nodeId, text))
  }, [recordState, selectedTree, updateSelectedTree])

  const addBranchFromNode = useCallback((parentNodeId: string, stance: Stance) => {
    recordState(selectedTree.id, selectedTree, 'addBranch')
    updateSelectedTree((currentTree) => {
      const { tree, newNodeId } = addBranchToTree(currentTree, parentNodeId, stance)
      setEditingNodeId(newNodeId)
      return tree
    })
  }, [recordState, selectedTree, updateSelectedTree])

  const addConnection = useCallback((sourceNodeId: string, targetNodeId: string) => {
    recordState(selectedTree.id, selectedTree, 'addConnection')
    updateSelectedTree((tree) => addConnectionToTree(tree, sourceNodeId, targetNodeId))
  }, [recordState, selectedTree, updateSelectedTree])

  const linkChildNode = useCallback((parentId: string, childId: string, stance: Stance) => {
    recordState(selectedTree.id, selectedTree, 'linkChild')
    updateSelectedTree((tree) => linkChildNodeInTree(tree, parentId, childId, stance))
  }, [recordState, selectedTree, updateSelectedTree])

  const handleAutoLayout = useCallback(() => {
    recordState(selectedTree.id, selectedTree, 'autoLayout')
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      positions: autoLayoutTree(currentTree),
    }))
  }, [recordState, selectedTree, updateSelectedTree])

  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    recordState(selectedTree.id, selectedTree, 'moveNode')
    updateSelectedTree((currentTree) => ({
      ...currentTree,
      positions: {
        ...currentTree.positions,
        [nodeId]: { x, y },
      },
    }))
  }, [recordState, selectedTree, updateSelectedTree])

  const addDefinition = useCallback((term: string, description: string) => {
    recordState(selectedTree.id, selectedTree, 'addDefinition')
    updateSelectedTree((tree) => addDefinitionToTree(tree, term, description))
  }, [recordState, selectedTree, updateSelectedTree])

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
    recordState(selectedTree.id, selectedTree, 'deleteEdge')
    updateSelectedTree((tree) => deleteEdgeFromTree(tree, edgeIdToDelete))
    setSelectedEdgeId((prev) => (prev === edgeIdToDelete ? null : prev))
  }, [recordState, selectedTree, updateSelectedTree])

  const deleteNode = useCallback((nodeIdToDelete: string) => {
    if (nodeIdToDelete === selectedTree.rootId) return
    recordState(selectedTree.id, selectedTree, 'deleteNode')
    updateSelectedTree((tree) => deleteNodeFromTree(tree, nodeIdToDelete))
    setEditingNodeId((prev) => (prev === nodeIdToDelete ? null : prev))
  }, [recordState, selectedTree, updateSelectedTree])

  const deleteDefinition = useCallback((definitionId: string) => {
    recordState(selectedTree.id, selectedTree, 'deleteDefinition')
    updateSelectedTree((tree) => deleteDefinitionFromTree(tree, definitionId))
  }, [recordState, selectedTree, updateSelectedTree])

  const renameTree = useCallback((treeId: string, newTitle: string) => {
    const trimmedTitle = newTitle.trim()
    if (!trimmedTitle) return

    setWorkspace((current) => {
      const tree = current.trees[treeId]
      if (!tree) return current

      recordState(treeId, tree, 'renameTree')
      const updatedTree = { ...tree, title: trimmedTitle }
      updateTreeApi(updatedTree).catch((err) => {
        console.error(`Failed to rename tree ${treeId} in database:`, err)
      })

      return {
        ...current,
        trees: {
          ...current.trees,
          [treeId]: updatedTree,
        },
      }
    })
  }, [recordState])

  const duplicateTree = useCallback((treeIdToDuplicate: string) => {
    setWorkspace((current) => {
      const sourceTree = current.trees[treeIdToDuplicate]
      if (!sourceTree) return current

      const newTree = cloneTree(sourceTree)
      createTreeApi(newTree).catch((err) => {
        console.error(`Failed to duplicate tree ${newTree.id} in database:`, err)
      })

      return {
        ...current,
        selectedTreeId: newTree.id,
        trees: {
          ...current.trees,
          [newTree.id]: newTree,
        },
      }
    })
  }, [])

  const cleanUpEmptyTrees = useCallback(() => {
    setWorkspace((current) => {
      const allTrees = Object.values(current.trees)
      if (allTrees.length <= 1) return current

      const keepTrees: Record<string, TreeState> = {}
      const deleteIds: string[] = []

      allTrees.forEach((tree) => {
        const isDefaultTitle = tree.title === 'Untitled tree' || tree.title === 'Starter tree'
        const nodeCount = Object.keys(tree.nodes).length
        const isMinimalNode = nodeCount <= 1 || (nodeCount <= 4 && tree.title === 'Starter tree')

        if (tree.id !== current.selectedTreeId && isDefaultTitle && isMinimalNode) {
          deleteIds.push(tree.id)
        } else {
          keepTrees[tree.id] = tree
        }
      })

      if (deleteIds.length === 0) return current

      deleteIds.forEach((id) => {
        deleteTreeApi(id).catch((err) => console.error('Failed to cleanup tree:', err))
      })

      let nextSelectedId = current.selectedTreeId
      if (!keepTrees[nextSelectedId]) {
        nextSelectedId = Object.keys(keepTrees)[0] || current.selectedTreeId
      }

      return {
        selectedTreeId: nextSelectedId,
        trees: keepTrees,
      }
    })
  }, [])

  const deleteTree = useCallback((treeIdToDelete: string) => {
    deleteTreeApi(treeIdToDelete)
      .then((updatedWorkspace) => {
        setWorkspace(updatedWorkspace)
      })
      .catch((err) => {
        console.error(`Failed to delete tree ${treeIdToDelete} from database:`, err)
      })
  }, [])

  const deleteMultipleTrees = useCallback((treeIdsToDelete: string[]) => {
    if (treeIdsToDelete.length === 0) return

    setWorkspace((current) => {
      const remaining = { ...current.trees }
      treeIdsToDelete.forEach((id) => {
        delete remaining[id]
        deleteTreeApi(id).catch((err) => {
          console.error(`Failed to delete tree ${id} from database:`, err)
        })
      })

      let nextSelectedId = current.selectedTreeId
      if (!remaining[nextSelectedId]) {
        nextSelectedId = Object.keys(remaining)[0] || ''
      }

      if (Object.keys(remaining).length === 0) {
        const seed = seedTree('Starter tree')
        remaining[seed.id] = seed
        nextSelectedId = seed.id
        createTreeApi(seed).catch((err) => console.error('Failed to seed replacement tree:', err))
      }

      return {
        selectedTreeId: nextSelectedId,
        trees: remaining,
      }
    })
  }, [])

  const handleUndo = useCallback(() => {
    const previousTree = undo(selectedTree.id, selectedTree)
    if (previousTree) {
      setWorkspace((current) => ({
        ...current,
        trees: {
          ...current.trees,
          [previousTree.id]: previousTree,
        },
      }))
    }
  }, [selectedTree, undo])

  const handleRedo = useCallback(() => {
    const nextTree = redo(selectedTree.id, selectedTree)
    if (nextTree) {
      setWorkspace((current) => ({
        ...current,
        trees: {
          ...current.trees,
          [nextTree.id]: nextTree,
        },
      }))
    }
  }, [selectedTree, redo])

  const canUndo = getCanUndo(selectedTree.id)
  const canRedo = getCanRedo(selectedTree.id)

  // Global keydown handler for Delete/Backspace and Undo/Redo shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isInputActive =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable)

      const isCmdOrCtrl = event.metaKey || event.ctrlKey

      if (isCmdOrCtrl) {
        if (event.key.toLowerCase() === 'z') {
          if (isInputActive) return
          event.preventDefault()
          if (event.shiftKey) {
            handleRedo()
          } else {
            handleUndo()
          }
          return
        }
        if (event.key.toLowerCase() === 'y' && !event.shiftKey) {
          if (isInputActive) return
          event.preventDefault()
          handleRedo()
          return
        }
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
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
  }, [deleteEdge, deleteNode, handleRedo, handleUndo, selectedEdgeId, selectedTree.selectedNodeId, selectedTree.rootId])

  return {
    workspace,
    isLoading,
    selectedTree,
    treeList,
    editingNodeId,
    selectedEdgeId,
    definitionsCollapsed,
    isNewTreeModalOpen,
    isTreeManagerOpen,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    setIsNewTreeModalOpen,
    setIsTreeManagerOpen,
    setEditingNodeId,
    setSelectedEdgeId,
    setDefinitionsCollapsed,
    handleSelectTreeId,
    handleEditNode,
    updateNodeText,
    addBranchFromNode,
    addConnection,
    linkChildNode,
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
    deleteMultipleTrees,
    renameTree,
    duplicateTree,
    cleanUpEmptyTrees,
  }
}

