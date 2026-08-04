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

/**
 * Easing function for smooth layout transition (cubic ease-out).
 */
export function cubicEaseOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Interpolates between start and target node positions based on animation progress (0 to 1).
 */
export function interpolatePositions(
  start: Record<string, Point>,
  target: Record<string, Point>,
  progress: number,
  nodeIds: string[],
): Record<string, Point> {
  const eased = cubicEaseOut(Math.max(0, Math.min(1, progress)))
  const interpolated: Record<string, Point> = {}

  for (const id of nodeIds) {
    const startPos = start[id] || target[id] || { x: 0, y: 0 }
    const targetPos = target[id] || startPos
    interpolated[id] = {
      x: startPos.x + (targetPos.x - startPos.x) * eased,
      y: startPos.y + (targetPos.y - startPos.y) * eased,
    }
  }

  return interpolated
}

/**
 * Checks if layout positions differ significantly between start and target positions.
 */
export function hasLayoutChanged(
  start: Record<string, Point>,
  target: Record<string, Point>,
  nodeIds: string[],
  threshold = 1,
): boolean {
  return nodeIds.some((id) => {
    const s = start[id] || { x: 0, y: 0 }
    const t = target[id] || { x: 0, y: 0 }
    return Math.abs(s.x - t.x) > threshold || Math.abs(s.y - t.y) > threshold
  })
}

