export type Stance = 'support' | 'attack'

export type ArgumentNode = {
  id: string
  text: string
  stance: Stance | 'claim'
  childIds: string[]
  connectionIds: string[]
}

export type DefinitionEntry = {
  id: string
  term: string
  description: string
}

export type TreeState = {
  id: string
  title: string
  nodes: Record<string, ArgumentNode>
  positions: Record<string, { x: number; y: number }>
  rootId: string
  definitions: DefinitionEntry[]
  selectedNodeId: string
}

export type WorkspaceState = {
  trees: Record<string, TreeState>
  selectedTreeId: string
}

export type EdgePath = {
  id: string
  sourceId: string
  targetId: string
  type: 'child' | 'connection'
  d: string
  color: string
  dashed: boolean
  markerId?: string
  midPoint: Point
}

export type Point = { x: number; y: number }

export type BranchDragState = {
  stance: Stance
  sourceNodeId?: string
  startPoint: Point | null
  currentPoint: Point
  dropTargetId: string | null
  snapOrigin?: boolean
  snapTarget?: boolean
}

export function computeDragEdgePath(
  origin: Point,
  target: Point,
  snapOrigin = true,
  snapTarget = false,
  boxWidth = 280,
  boxHeight = 140
): string {
  const dx = target.x - origin.x
  const dy = target.y - origin.y

  let startX = origin.x
  let startY = origin.y
  let endX = target.x
  let endY = target.y

  const halfW = boxWidth / 2
  const halfH = boxHeight / 2

  if (snapOrigin) {
    if (dy > 30) {
      startX = origin.x
      startY = origin.y + halfH
    } else if (dy < -30) {
      startX = origin.x
      startY = origin.y - halfH
    } else if (dx >= 0) {
      startX = origin.x + halfW
      startY = origin.y
    } else {
      startX = origin.x - halfW
      startY = origin.y
    }
  }

  if (snapTarget) {
    if (dy > 30) {
      endX = target.x
      endY = target.y - halfH
    } else if (dy < -30) {
      endX = target.x
      endY = target.y + halfH
    } else if (dx >= 0) {
      endX = target.x - halfW
      endY = target.y
    } else {
      endX = target.x + halfW
      endY = target.y
    }
  }

  const deltaX = endX - startX
  const deltaY = endY - startY

  if (Math.abs(deltaY) >= Math.abs(deltaX)) {
    const controlY1 = startY + deltaY * 0.45
    const controlY2 = endY - deltaY * 0.45
    return `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`
  } else {
    const controlX1 = startX + deltaX * 0.45
    const controlX2 = endX - deltaX * 0.45
    return `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`
  }
}

export function computeEdgePath(
  origin: Point,
  target: Point,
  boxWidth = 280,
  boxHeight = 140,
  isConnection = false
): string {
  const dx = target.x - origin.x
  const dy = target.y - origin.y

  if (dx === 0 && dy === 0) {
    return `M ${origin.x} ${origin.y} L ${target.x} ${target.y}`
  }

  const halfW = boxWidth / 2
  const halfH = boxHeight / 2

  let startX: number
  let startY: number
  let endX: number
  let endY: number

  if (dy > 40) {
    startX = origin.x
    startY = origin.y + halfH
    endX = target.x
    endY = target.y - halfH - 6
  } else if (dy < -40) {
    startX = origin.x
    startY = origin.y - halfH
    endX = target.x
    endY = target.y + halfH + 6
  } else if (dx >= 0) {
    startX = origin.x + halfW
    startY = origin.y
    endX = target.x - halfW - 6
    endY = target.y
  } else {
    startX = origin.x - halfW
    startY = origin.y
    endX = target.x + halfW + 6
    endY = target.y
  }

  if (isConnection) {
    const deltaX = endX - startX
    const controlX = startX + deltaX * 0.4
    const controlY1 = startY - 60
    const controlY2 = endY - 30
    return `M ${startX} ${startY} C ${controlX} ${controlY1}, ${endX - deltaX * 0.15} ${controlY2}, ${endX} ${endY}`
  }

  const deltaY = endY - startY
  const controlY1 = startY + deltaY * 0.45
  const controlY2 = endY - deltaY * 0.45

  return `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`
}

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

export const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const seedTree = (title: string): TreeState => {
  const treeId = createId()
  const rootId = createId()
  const rebuttalId = createId()
  const evidenceId = createId()
  const definitionId = createId()

  return {
    id: treeId,
    title,
    rootId,
    selectedNodeId: rootId,
    positions: {
      [rootId]: { x: 0, y: 0 },
      [evidenceId]: { x: -260, y: 320 },
      [rebuttalId]: { x: 260, y: 320 },
      [definitionId]: { x: -260, y: 640 },
    },
    nodes: {
      [rootId]: {
        id: rootId,
        text: 'School should start one hour later to improve student attention and wellbeing.',
        stance: 'claim',
        childIds: [evidenceId, rebuttalId],
        connectionIds: [],
      },
      [evidenceId]: {
        id: evidenceId,
        text: 'Adolescents often have sleep cycles that make earlier mornings especially costly.',
        stance: 'support',
        childIds: [definitionId],
        connectionIds: [],
      },
      [rebuttalId]: {
        id: rebuttalId,
        text: 'Later starts can conflict with after-school jobs, sports, and caregiving duties.',
        stance: 'attack',
        childIds: [],
        connectionIds: [definitionId],
      },
      [definitionId]: {
        id: definitionId,
        text: 'Circadian rhythm: the body’s internal clock that influences sleep timing and alertness.',
        stance: 'support',
        childIds: [],
        connectionIds: [],
      },
    },
    definitions: [
      {
        id: definitionId,
        term: 'Circadian rhythm',
        description:
          'The internal daily timing system that shapes when a person naturally feels sleepy or alert.',
      },
    ],
  }
}

export const createEmptyTree = (title: string, rootText: string): TreeState => {
  const treeId = createId()
  const rootId = createId()

  return {
    id: treeId,
    title,
    rootId,
    selectedNodeId: rootId,
    positions: {
      [rootId]: { x: 0, y: 0 },
    },
    nodes: {
      [rootId]: {
        id: rootId,
        text: rootText,
        stance: 'claim',
        childIds: [],
        connectionIds: [],
      },
    },
    definitions: [],
  }
}

export const cloneTree = (sourceTree: TreeState, newTitle?: string): TreeState => {
  const newTreeId = createId()
  const idMap: Record<string, string> = {}

  Object.keys(sourceTree.nodes).forEach((oldId) => {
    idMap[oldId] = createId()
  })

  const newNodes: Record<string, ArgumentNode> = {}
  const newPositions: Record<string, Point> = {}

  Object.entries(sourceTree.nodes).forEach(([oldId, node]) => {
    const freshId = idMap[oldId]
    newNodes[freshId] = {
      ...node,
      id: freshId,
      childIds: node.childIds.map((cid) => idMap[cid] || cid),
      connectionIds: node.connectionIds.map((cid) => idMap[cid] || cid),
    }
    if (sourceTree.positions[oldId]) {
      newPositions[freshId] = { ...sourceTree.positions[oldId] }
    }
  })

  const newRootId = idMap[sourceTree.rootId] || Object.keys(newNodes)[0] || createId()
  const newSelectedNodeId = idMap[sourceTree.selectedNodeId] || newRootId

  const newDefinitions = sourceTree.definitions.map((def) => ({
    ...def,
    id: idMap[def.id] || createId(),
  }))

  return {
    id: newTreeId,
    title: newTitle || `Copy of ${sourceTree.title}`,
    rootId: newRootId,
    selectedNodeId: newSelectedNodeId,
    nodes: newNodes,
    positions: newPositions,
    definitions: newDefinitions,
  }
}

export const seedWorkspace = (): WorkspaceState => {
  const tree = seedTree('Starter tree')

  return {
    selectedTreeId: tree.id,
    trees: {
      [tree.id]: tree,
    },
  }
}



export const palette: Record<Stance | 'claim', string> = {
  claim: '#7ea7ff',
  support: '#58d39b',
  attack: '#ff7a73',
}

export const formatNodeLabel = (text: string) => {
  if (text.length <= 32) return text
  return `${text.slice(0, 32)}…`
}