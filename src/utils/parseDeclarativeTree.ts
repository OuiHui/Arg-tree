import type { Stance, TreeState, ArgumentNode } from '../types/argtree'
import { autoLayoutTree } from './autoLayout'

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export interface DeclarativeBranch {
  text: string
  stance?: Stance
  targetRebuttalIndex?: string | number
  children?: DeclarativeBranch[]
}

export interface DeclarativeDefinition {
  term: string
  description: string
}

export interface DeclarativeTreeSpec {
  id?: string
  title: string
  rootClaim?: string
  branches?: DeclarativeBranch[]
  definitions?: DeclarativeDefinition[]
}

export function parseDeclarativeTree(treeSpec: DeclarativeTreeSpec): TreeState {
  const treeId = treeSpec.id || createId()
  const rootId = createId()

  const nodes: Record<string, ArgumentNode> = {}
  const createdIdsMap = new Map<string, string>()

  nodes[rootId] = {
    id: rootId,
    text: treeSpec.rootClaim || treeSpec.title,
    stance: 'claim',
    childIds: [],
    connectionIds: [],
  }

  function processBranch(branchSpec: DeclarativeBranch, parentId: string, indexPrefix: string) {
    const nodeId = createId()
    createdIdsMap.set(indexPrefix, nodeId)

    const node: ArgumentNode = {
      id: nodeId,
      text: branchSpec.text,
      stance: branchSpec.stance || 'support',
      childIds: [],
      connectionIds: [],
    }

    nodes[nodeId] = node
    nodes[parentId].childIds.push(nodeId)

    if (Array.isArray(branchSpec.children)) {
      branchSpec.children.forEach((childSpec, childIdx) => {
        processBranch(childSpec, nodeId, `${indexPrefix}.${childIdx}`)
      })
    }
  }

  if (Array.isArray(treeSpec.branches)) {
    treeSpec.branches.forEach((branchSpec, bIdx) => {
      processBranch(branchSpec, rootId, `${bIdx}`)
    })
  }

  // Cross-link connections if targetRebuttalIndex is specified
  if (Array.isArray(treeSpec.branches)) {
    function resolveConnections(branchSpec: DeclarativeBranch, indexPrefix: string) {
      if (branchSpec.targetRebuttalIndex !== undefined) {
        const sourceId = createdIdsMap.get(indexPrefix)
        const targetId = createdIdsMap.get(String(branchSpec.targetRebuttalIndex))
        if (sourceId && targetId && nodes[sourceId]) {
          nodes[sourceId].connectionIds.push(targetId)
        }
      }

      if (Array.isArray(branchSpec.children)) {
        branchSpec.children.forEach((childSpec, childIdx) => {
          resolveConnections(childSpec, `${indexPrefix}.${childIdx}`)
        })
      }
    }

    treeSpec.branches.forEach((branchSpec, bIdx) => {
      resolveConnections(branchSpec, `${bIdx}`)
    })
  }

  const definitions = Array.isArray(treeSpec.definitions)
    ? treeSpec.definitions.map((def) => ({
        id: createId(),
        term: def.term,
        description: def.description,
      }))
    : []

  const treeWithoutPositions: TreeState = {
    id: treeId,
    title: treeSpec.title,
    rootId,
    selectedNodeId: rootId,
    positions: {},
    nodes,
    definitions,
  }

  const positions = autoLayoutTree(treeWithoutPositions)

  return {
    ...treeWithoutPositions,
    positions,
  }
}
