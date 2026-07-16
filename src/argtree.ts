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
  d: string
  color: string
  dashed: boolean
}

export const STORAGE_KEY = 'argtree-state'

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
      [rebuttalId]: { x: 240, y: 140 },
      [evidenceId]: { x: 240, y: -110 },
      [definitionId]: { x: 480, y: -110 },
    },
    nodes: {
      [rootId]: {
        id: rootId,
        text: 'School should start one hour later to improve student attention and wellbeing.',
        stance: 'claim',
        childIds: [rebuttalId, evidenceId],
        connectionIds: [],
      },
      [rebuttalId]: {
        id: rebuttalId,
        text: 'Later starts can conflict with after-school jobs, sports, and caregiving duties.',
        stance: 'attack',
        childIds: [],
        connectionIds: [definitionId],
      },
      [evidenceId]: {
        id: evidenceId,
        text: 'Adolescents often have sleep cycles that make earlier mornings especially costly.',
        stance: 'support',
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

export const seedWorkspace = (): WorkspaceState => {
  const tree = seedTree('Starter tree')

  return {
    selectedTreeId: tree.id,
    trees: {
      [tree.id]: tree,
    },
  }
}

export const readInitialState = (): WorkspaceState => {
  if (typeof window === 'undefined') {
    return seedWorkspace()
  }

  const rawState = window.localStorage.getItem(STORAGE_KEY)

  if (!rawState) {
    return seedWorkspace()
  }

  try {
    const parsed = JSON.parse(rawState) as Partial<WorkspaceState & TreeState>

    if (parsed.trees && parsed.selectedTreeId) {
      const treeIds = Object.keys(parsed.trees)

      if (treeIds.length > 0 && parsed.trees[parsed.selectedTreeId]) {
        return parsed as WorkspaceState
      }
    }

    if (parsed.nodes && parsed.positions && parsed.rootId && parsed.selectedNodeId && parsed.definitions) {
      const treeId = createId()

      return {
        selectedTreeId: treeId,
        trees: {
          [treeId]: {
            id: treeId,
            title: 'Imported tree',
            nodes: parsed.nodes,
            positions: parsed.positions,
            rootId: parsed.rootId,
            definitions: parsed.definitions,
            selectedNodeId: parsed.selectedNodeId,
          },
        },
      }
    }

    return seedWorkspace()
  } catch {
    return seedWorkspace()
  }
}

export const palette: Record<Stance | 'claim', string> = {
  claim: 'var(--claim)',
  support: 'var(--support)',
  attack: 'var(--attack)',
}

export const formatNodeLabel = (text: string) => {
  if (text.length <= 32) return text
  return `${text.slice(0, 32)}…`
}