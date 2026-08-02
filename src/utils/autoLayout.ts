import type { Point, TreeState } from '../types/argtree'

export function autoLayoutTree(tree: TreeState): Record<string, Point> {
  const newPositions: Record<string, Point> = {}
  const rootId = tree.rootId
  if (!rootId || !tree.nodes[rootId]) return tree.positions

  const levels: Record<number, string[]> = {}
  const visited = new Set<string>()

  const queue: Array<{ id: string; level: number }> = [{ id: rootId, level: 0 }]
  visited.add(rootId)

  while (queue.length > 0) {
    const item = queue.shift()!
    if (!levels[item.level]) {
      levels[item.level] = []
    }
    levels[item.level].push(item.id)

    const node = tree.nodes[item.id]
    if (node) {
      for (const childId of node.childIds) {
        if (!visited.has(childId)) {
          visited.add(childId)
          queue.push({ id: childId, level: item.level + 1 })
        }
      }
    }
  }

  const maxLevel = Math.max(...Object.keys(levels).map(Number), 0)
  for (const nodeId of Object.keys(tree.nodes)) {
    if (!visited.has(nodeId)) {
      const level = maxLevel + 1
      if (!levels[level]) levels[level] = []
      levels[level].push(nodeId)
    }
  }

  const LEVEL_HEIGHT = 320
  const NODE_SPACING = 360

  for (const [levelStr, nodeIds] of Object.entries(levels)) {
    const level = Number(levelStr)
    const count = nodeIds.length
    const startX = -((count - 1) * NODE_SPACING) / 2

    nodeIds.forEach((id, index) => {
      newPositions[id] = {
        x: startX + index * NODE_SPACING,
        y: level * LEVEL_HEIGHT,
      }
    })
  }

  return newPositions
}
