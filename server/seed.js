import { TreeModel } from './models/Tree.js'
import { WorkspaceConfigModel } from './models/Workspace.js'

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function generateSeedTree(title = 'Starter tree') {
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
      [evidenceId]: { x: -240, y: 220 },
      [rebuttalId]: { x: 240, y: 220 },
      [definitionId]: { x: -240, y: 440 },
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

export async function ensureInitialSeed() {
  const count = await TreeModel.countDocuments()
  if (count === 0) {
    const seed = generateSeedTree('Starter tree')
    await TreeModel.create(seed)
    await WorkspaceConfigModel.findOneAndUpdate(
      { key: 'main' },
      { selectedTreeId: seed.id },
      { upsert: true, returnDocument: 'after' }
    )
    console.log('Seeded database with starter tree')
  }
}
