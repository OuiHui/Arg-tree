import type { TreeState } from '../types/argtree'
import { seedTree } from '../data/seed'
import { createId } from './id'

export function sanitizeTree(tree: TreeState): TreeState {
  if (!tree) return seedTree('Starter tree')

  const nodes = tree.nodes || {}
  let rootId = tree.rootId

  // If rootId is missing or doesn't exist in nodes, find a claim node or first node or create one
  if (!rootId || !nodes[rootId]) {
    const existingNodeIds = Object.keys(nodes)
    const claimNodeId = existingNodeIds.find((id) => nodes[id]?.stance === 'claim')
    if (claimNodeId) {
      rootId = claimNodeId
    } else if (existingNodeIds.length > 0) {
      rootId = existingNodeIds[0]
      nodes[rootId] = {
        ...nodes[rootId],
        stance: 'claim',
      }
    } else {
      rootId = createId()
      const rootText = tree.title && tree.title !== 'Untitled tree'
        ? tree.title
        : 'Write the central claim for this argument tree.'
      nodes[rootId] = {
        id: rootId,
        text: rootText,
        stance: 'claim',
        childIds: [],
        connectionIds: [],
      }
    }
  }

  const positions = tree.positions || {}
  if (!positions[rootId]) {
    positions[rootId] = { x: 0, y: 0 }
  }

  const selectedNodeId =
    tree.selectedNodeId && nodes[tree.selectedNodeId] ? tree.selectedNodeId : rootId

  return {
    ...tree,
    rootId,
    selectedNodeId,
    nodes,
    positions,
    definitions: Array.isArray(tree.definitions) ? tree.definitions : [],
  }
}
