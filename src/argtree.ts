import type { Point, Stance, TreeState, WorkspaceState, ArgumentNode } from './types/argtree'

export * from './types/argtree'
export * from './utils/autoLayout'

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

export const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const seedTree = (title = 'Free Will & Determinism'): TreeState => {
  const treeId = createId()
  const rootId = createId()

  const introspectiveSupportId = createId()
  const agentCausationId = createId()
  const moralAgencyId = createId()

  const neuroAttackId = createId()
  const libetId = createId()
  const epiphenomenalismId = createId()

  const compatibilismSupportId = createId()
  const secondOrderVolitionId = createId()

  const determinismAttackId = createId()
  const luckProblemId = createId()

  const defMoralAgency = createId()
  const defCompatibilism = createId()
  const defHardDeterminism = createId()

  return {
    id: treeId,
    title,
    rootId,
    selectedNodeId: rootId,
    positions: {
      [rootId]: { x: 0, y: 0 },
      [introspectiveSupportId]: { x: -450, y: 320 },
      [neuroAttackId]: { x: -150, y: 320 },
      [compatibilismSupportId]: { x: 150, y: 320 },
      [determinismAttackId]: { x: 450, y: 320 },
      [agentCausationId]: { x: -550, y: 640 },
      [moralAgencyId]: { x: -350, y: 640 },
      [libetId]: { x: -200, y: 640 },
      [epiphenomenalismId]: { x: 0, y: 640 },
      [secondOrderVolitionId]: { x: 200, y: 640 },
      [luckProblemId]: { x: 450, y: 640 },
    },
    nodes: {
      [rootId]: {
        id: rootId,
        text: 'Human beings possess genuine free will, exerting conscious agency and moral responsibility over their choices.',
        stance: 'claim',
        childIds: [introspectiveSupportId, neuroAttackId, compatibilismSupportId, determinismAttackId],
        connectionIds: [],
      },
      [introspectiveSupportId]: {
        id: introspectiveSupportId,
        text: 'First-person subjective experience provides direct, intuitive evidence of conscious deliberation and choice.',
        stance: 'support',
        childIds: [agentCausationId, moralAgencyId],
        connectionIds: [],
      },
      [agentCausationId]: {
        id: agentCausationId,
        text: 'Agent-Causation: Conscious minds act as uncaused initiators of events, distinct from deterministic event-event physical chains.',
        stance: 'support',
        childIds: [],
        connectionIds: [],
      },
      [moralAgencyId]: {
        id: moralAgencyId,
        text: 'Moral & Legal Systems: Society logically requires personal agency, praise, and blame for intentional actions.',
        stance: 'support',
        childIds: [],
        connectionIds: [],
      },
      [neuroAttackId]: {
        id: neuroAttackId,
        text: 'Neuroscience indicates that decisions are formulated by pre-conscious neural processes prior to subjective awareness.',
        stance: 'attack',
        childIds: [libetId, epiphenomenalismId],
        connectionIds: [introspectiveSupportId],
      },
      [libetId]: {
        id: libetId,
        text: 'Libet Experiments: Motor readiness potentials in the brain build up hundreds of milliseconds before an agent reports conscious intent.',
        stance: 'support',
        childIds: [],
        connectionIds: [agentCausationId],
      },
      [epiphenomenalismId]: {
        id: epiphenomenalismId,
        text: 'Epiphenomenal Consciousness: Conscious awareness is a passive observer of neural activity rather than the executive controller.',
        stance: 'support',
        childIds: [],
        connectionIds: [],
      },
      [compatibilismSupportId]: {
        id: compatibilismSupportId,
        text: 'Compatibilism: Free will is compatible with physical determinism when defined as acting on internal desires without external coercion.',
        stance: 'support',
        childIds: [secondOrderVolitionId],
        connectionIds: [],
      },
      [secondOrderVolitionId]: {
        id: secondOrderVolitionId,
        text: 'Second-Order Volition: Freedom consists of reflective alignment between higher-order desires and immediate motivations.',
        stance: 'support',
        childIds: [],
        connectionIds: [],
      },
      [determinismAttackId]: {
        id: determinismAttackId,
        text: 'Hard Determinism: Every physical event, including human brain states, is completely determined by preceding physical causes and natural laws.',
        stance: 'attack',
        childIds: [luckProblemId],
        connectionIds: [compatibilismSupportId],
      },
      [luckProblemId]: {
        id: luckProblemId,
        text: 'The Luck Problem: If actions are uncaused or quantum-random, they represent stochastic chance rather than intentional free choice.',
        stance: 'support',
        childIds: [],
        connectionIds: [secondOrderVolitionId],
      },
    },
    definitions: [
      {
        id: defMoralAgency,
        term: 'Moral Agency',
        description: 'The capacity of a rational being to make moral judgments and be held morally accountable for actions.',
      },
      {
        id: defCompatibilism,
        term: 'Compatibilism',
        description: 'The philosophical view that causal determinism and free will are logically compatible perspectives.',
      },
      {
        id: defHardDeterminism,
        term: 'Hard Determinism',
        description: 'The view that causal determinism is true and completely rules out free will and moral responsibility.',
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
  const newSelectedNodeId = sourceTree.selectedNodeId ? (idMap[sourceTree.selectedNodeId] || null) : null

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