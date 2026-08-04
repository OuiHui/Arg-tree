import { createId } from '../argtree'
import type { Stance, TreeState, DefinitionEntry, ClaimPolarity } from '../types/argtree'

export function updateNodeTextInTree(currentTree: TreeState, nodeId: string, text: string): TreeState {
  if (!currentTree.nodes[nodeId]) return currentTree
  return {
    ...currentTree,
    nodes: {
      ...currentTree.nodes,
      [nodeId]: {
        ...currentTree.nodes[nodeId],
        text,
      },
    },
  }
}

export function addBranchToTree(
  currentTree: TreeState,
  parentNodeId: string,
  stance: Stance
): { tree: TreeState; newNodeId: string } {
  const id = createId()
  const parent = currentTree.nodes[parentNodeId]
  if (!parent) return { tree: currentTree, newNodeId: parentNodeId }

  const text = stance === 'support' ? 'New supporting point' : 'New counterargument'
  const parentPosition = currentTree.positions[parent.id] ?? { x: 0, y: 0 }
  const branchCount = parent.childIds.length
  const sideOffset = stance === 'support' ? -180 : 180
  const spreadX =
    sideOffset + (branchCount > 0 ? (stance === 'support' ? -120 * branchCount : 120 * branchCount) : 0)

  const updatedTree: TreeState = {
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

  return { tree: updatedTree, newNodeId: id }
}

export function addConnectionToTree(
  currentTree: TreeState,
  sourceNodeId: string,
  targetNodeId: string
): TreeState {
  if (sourceNodeId === targetNodeId) return currentTree

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
}

export function linkChildNodeInTree(
  currentTree: TreeState,
  parentId: string,
  childId: string,
  stance: Stance
): TreeState {
  if (parentId === childId) return currentTree

  const parentNode = currentTree.nodes[parentId]
  const childNode = currentTree.nodes[childId]
  if (!parentNode || !childNode) return currentTree

  if (childId === currentTree.rootId || childNode.stance === 'claim') {
    return currentTree
  }

  const isAncestor = (nodeId: string, targetId: string): boolean => {
    const n = currentTree.nodes[nodeId]
    if (!n) return false
    if (n.childIds.includes(targetId)) return true
    return n.childIds.some((cid) => isAncestor(cid, targetId))
  }

  if (isAncestor(childId, parentId)) {
    return currentTree
  }

  const nextNodes = { ...currentTree.nodes }

  Object.keys(nextNodes).forEach((key) => {
    const n = nextNodes[key]
    if (n.childIds.includes(childId)) {
      nextNodes[key] = {
        ...n,
        childIds: n.childIds.filter((cid) => cid !== childId),
      }
    }
  })

  const updatedParent = nextNodes[parentId] ?? parentNode
  const updatedChild = nextNodes[childId] ?? childNode

  nextNodes[parentId] = {
    ...updatedParent,
    childIds: updatedParent.childIds.includes(childId)
      ? updatedParent.childIds
      : [...updatedParent.childIds, childId],
    connectionIds: updatedParent.connectionIds.filter((cid) => cid !== childId),
  }

  nextNodes[childId] = {
    ...updatedChild,
    stance,
    connectionIds: updatedChild.connectionIds.filter((cid) => cid !== parentId),
  }

  return {
    ...currentTree,
    nodes: nextNodes,
  }
}

export function deleteEdgeFromTree(currentTree: TreeState, edgeIdToDelete: string): TreeState {
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
}

export function deleteNodeFromTree(currentTree: TreeState, nodeIdToDelete: string): TreeState {
  if (nodeIdToDelete === currentTree.rootId) return currentTree

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
}

export function addDefinitionToTree(
  currentTree: TreeState,
  term: string,
  description: string,
  linkToNodeId?: string
): TreeState {
  const cleanTerm = term.trim()
  const cleanDesc = description.trim()
  if (!cleanTerm || !cleanDesc) return currentTree

  const id = createId()
  const newDef: DefinitionEntry = {
    id,
    term: cleanTerm,
    description: cleanDesc,
    nodeIds: linkToNodeId ? [linkToNodeId] : [],
  }

  let updatedNodes = currentTree.nodes
  if (linkToNodeId && currentTree.nodes[linkToNodeId]) {
    const existingNode = currentTree.nodes[linkToNodeId]
    updatedNodes = {
      ...currentTree.nodes,
      [linkToNodeId]: {
        ...existingNode,
        definitionIds: [...(existingNode.definitionIds || []), id],
      },
    }
  }

  return {
    ...currentTree,
    nodes: updatedNodes,
    definitions: [...currentTree.definitions, newDef],
  }
}

export function deleteDefinitionFromTree(currentTree: TreeState, definitionId: string): TreeState {
  return {
    ...currentTree,
    definitions: currentTree.definitions.filter((def) => def.id !== definitionId),
  }
}

export function pasteNodeInTree(
  currentTree: TreeState,
  copiedData: { text: string; stance: Stance | 'claim' }
): { tree: TreeState; newNodeId: string } {
  const id = createId()
  const selectedPos = currentTree.selectedNodeId ? currentTree.positions[currentTree.selectedNodeId] : undefined
  const basePos = selectedPos ?? currentTree.positions[currentTree.rootId] ?? { x: 0, y: 0 }

  const stance: Stance = copiedData.stance === 'claim' ? 'support' : copiedData.stance

  const updatedTree: TreeState = {
    ...currentTree,
    selectedNodeId: id,
    positions: {
      ...currentTree.positions,
      [id]: {
        x: basePos.x + 40,
        y: basePos.y + 40,
      },
    },
    nodes: {
      ...currentTree.nodes,
      [id]: {
        id,
        text: copiedData.text,
        stance,
        childIds: [],
        connectionIds: [],
      },
    },
  }

  return { tree: updatedTree, newNodeId: id }
}

export function getBranchNodeIds(selectedTree: TreeState, selectedId: string | null): Set<string> | null {
  if (!selectedId || !selectedTree.nodes[selectedId]) {
    return null
  }

  if (selectedId === selectedTree.rootId) {
    return null
  }

  const focused = new Set<string>()
  focused.add(selectedId)

  const parentMap: Record<string, string[]> = {}
  Object.values(selectedTree.nodes).forEach((pNode) => {
    pNode.childIds.forEach((childId) => {
      if (!parentMap[childId]) {
        parentMap[childId] = []
      }
      parentMap[childId].push(pNode.id)
    })
  })

  const ancestorQueue = [selectedId]
  while (ancestorQueue.length > 0) {
    const currentId = ancestorQueue.shift()!
    const parents = parentMap[currentId] ?? []
    parents.forEach((parentId) => {
      if (!focused.has(parentId)) {
        focused.add(parentId)
        ancestorQueue.push(parentId)
      }
    })
  }

  const descendantQueue = [selectedId]
  while (descendantQueue.length > 0) {
    const currentId = descendantQueue.shift()!
    const currNode = selectedTree.nodes[currentId]
    if (currNode && currNode.childIds) {
      currNode.childIds.forEach((childId) => {
        if (!focused.has(childId)) {
          focused.add(childId)
          descendantQueue.push(childId)
        }
      })
    }
  }

  return focused
}

export function isDefinitionLinkedToNode(
  def: DefinitionEntry,
  nodeText: string,
  nodeId: string,
  nodeDefinitionIds?: string[]
): boolean {
  if (def.nodeIds?.includes(nodeId) || nodeDefinitionIds?.includes(def.id)) {
    return true
  }
  if (!def.term || def.term.trim().length < 2) return false
  const lowerTerm = def.term.toLowerCase()
  const lowerText = nodeText.toLowerCase()
  return lowerText.includes(lowerTerm)
}

export function toggleDefinitionLinkToNode(
  currentTree: TreeState,
  definitionId: string,
  nodeId: string
): TreeState {
  const targetDef = currentTree.definitions.find((d) => d.id === definitionId)
  const targetNode = currentTree.nodes[nodeId]
  if (!targetDef || !targetNode) return currentTree

  const currentDefNodeIds = targetDef.nodeIds ?? []
  const currentDefHasNode = currentDefNodeIds.includes(nodeId)
  const nextDefNodeIds = currentDefHasNode
    ? currentDefNodeIds.filter((id) => id !== nodeId)
    : [...currentDefNodeIds, nodeId]

  const currentNodeDefIds = targetNode.definitionIds ?? []
  const currentNodeHasDef = currentNodeDefIds.includes(definitionId)
  const nextNodeDefIds = currentNodeHasDef
    ? currentNodeDefIds.filter((id) => id !== definitionId)
    : [...currentNodeDefIds, definitionId]

  return {
    ...currentTree,
    definitions: currentTree.definitions.map((def) =>
      def.id === definitionId ? { ...def, nodeIds: nextDefNodeIds } : def
    ),
    nodes: {
      ...currentTree.nodes,
      [nodeId]: {
        ...targetNode,
        definitionIds: nextNodeDefIds,
      },
    },
  }
}

export function getDefinitionsForBranch(
  tree: TreeState,
  activeNodeIds: Set<string> | null
): DefinitionEntry[] {
  if (!activeNodeIds || activeNodeIds.size === 0) {
    return tree.definitions
  }

  return tree.definitions.filter((def) => {
    for (const nodeId of activeNodeIds) {
      const node = tree.nodes[nodeId]
      if (node && isDefinitionLinkedToNode(def, node.text, node.id, node.definitionIds)) {
        return true
      }
    }
    return false
  })
}

export function getNodeClaimPolarity(tree: TreeState, nodeId: string): ClaimPolarity {
  if (nodeId === tree.rootId) return 'neutral'
  const node = tree.nodes[nodeId]
  if (!node || node.stance === 'claim') return 'neutral'

  const parentMap: Record<string, string> = {}
  Object.values(tree.nodes).forEach((pNode) => {
    pNode.childIds.forEach((childId) => {
      parentMap[childId] = pNode.id
    })
  })

  const path: string[] = []
  let curr: string | undefined = nodeId
  const visited = new Set<string>()

  while (curr && curr !== tree.rootId && !visited.has(curr)) {
    visited.add(curr)
    path.unshift(curr)
    curr = parentMap[curr]
  }

  if (curr !== tree.rootId) return 'neutral'

  let isPro = true
  for (const nId of path) {
    const n = tree.nodes[nId]
    if (n && n.stance === 'attack') {
      isPro = !isPro
    }
  }

  return isPro ? 'pro' : 'con'
}



