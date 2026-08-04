export type Stance = 'support' | 'attack'
export type ClaimPolarity = 'pro' | 'con' | 'neutral'

export type ArgumentNode = {
  id: string
  text: string
  stance: Stance | 'claim'
  childIds: string[]
  connectionIds: string[]
  definitionIds?: string[]
}

export type DefinitionEntry = {
  id: string
  term: string
  description: string
  nodeIds?: string[]
}

export type TreeState = {
  id: string
  title: string
  nodes: Record<string, ArgumentNode>
  positions: Record<string, { x: number; y: number }>
  rootId: string
  definitions: DefinitionEntry[]
  selectedNodeId: string | null
}

export type WorkspaceState = {
  trees: Record<string, TreeState>
  selectedTreeId: string
}

export type Point = { x: number; y: number }

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

export type BranchDragState = {
  stance: Stance
  sourceNodeId?: string
  startPoint: Point | null
  currentPoint: Point
  dropTargetId: string | null
  snapOrigin?: boolean
  snapTarget?: boolean
}
