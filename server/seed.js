import { TreeModel } from './models/Tree.js'
import { WorkspaceConfigModel } from './models/Workspace.js'

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function generateSeedTree(title = 'Free Will & Determinism') {
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

import fs from 'fs'
import path from 'path'
import { importTreeFromFile } from './scripts/importTree.js'

export async function ensureInitialSeed() {
  const existingCount = await TreeModel.countDocuments()
  if (existingCount > 0) {
    return
  }

  const treesDir = path.resolve('data/trees')
  let targetTreeId = null

  if (fs.existsSync(treesDir)) {
    const files = fs.readdirSync(treesDir).filter((f) => f.endsWith('.json'))
    for (const file of files) {
      try {
        const filePath = path.join(treesDir, file)
        const imported = await importTreeFromFile(filePath)
        if (!targetTreeId) {
          targetTreeId = imported.id
        }
      } catch (err) {
        console.error(`Failed to auto-import tree file ${file}:`, err.message)
      }
    }
  }

  if (!targetTreeId) {
    const existingFreeWill = await TreeModel.findOne({ title: 'Free Will & Determinism' })
    if (existingFreeWill) {
      targetTreeId = existingFreeWill.id
    } else {
      const seed = generateSeedTree('Free Will & Determinism')
      await TreeModel.create(seed)
      targetTreeId = seed.id
    }
  }

  if (targetTreeId) {
    await WorkspaceConfigModel.findOneAndUpdate(
      { key: 'main' },
      { selectedTreeId: targetTreeId },
      { upsert: true, returnDocument: 'after' }
    )
  }
}

