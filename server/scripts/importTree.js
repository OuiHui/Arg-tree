import fs from 'fs'
import path from 'path'
import { connectDB } from '../db.js'
import { TreeModel } from '../models/Tree.js'
import { WorkspaceConfigModel } from '../models/Workspace.js'

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function calculateNodePositions(nodes, rootId) {
  const positions = {}
  const levels = {}
  const visited = new Set()

  const queue = [{ id: rootId, level: 0 }]
  visited.add(rootId)

  while (queue.length > 0) {
    const item = queue.shift()
    if (!levels[item.level]) {
      levels[item.level] = []
    }
    levels[item.level].push(item.id)

    const node = nodes[item.id]
    if (node && node.childIds) {
      for (const childId of node.childIds) {
        if (!visited.has(childId)) {
          visited.add(childId)
          queue.push({ id: childId, level: item.level + 1 })
        }
      }
    }
  }

  const LEVEL_HEIGHT = 320
  const NODE_SPACING = 360

  for (const [levelStr, nodeIds] of Object.entries(levels)) {
    const level = Number(levelStr)
    const count = nodeIds.length
    const startX = -((count - 1) * NODE_SPACING) / 2

    nodeIds.forEach((id, index) => {
      positions[id] = {
        x: startX + index * NODE_SPACING,
        y: level * LEVEL_HEIGHT,
      }
    })
  }

  return positions
}

export function parseDeclarativeTree(treeSpec) {
  const treeId =
    treeSpec.id ||
    (treeSpec.title ? `tree-${treeSpec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : createId())
  const rootId = createId()

  const nodes = {}
  const createdIdsMap = new Map()

  nodes[rootId] = {
    id: rootId,
    text: treeSpec.rootClaim || treeSpec.title,
    stance: 'claim',
    childIds: [],
    connectionIds: [],
  }

  function processBranch(branchSpec, parentId, indexPrefix) {
    const nodeId = createId()
    createdIdsMap.set(indexPrefix, nodeId)

    const node = {
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
    function resolveConnections(branchSpec, indexPrefix) {
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

  const positions = calculateNodePositions(nodes, rootId)

  const definitions = Array.isArray(treeSpec.definitions)
    ? treeSpec.definitions.map((def) => ({
        id: createId(),
        term: def.term,
        description: def.description,
      }))
    : []

  return {
    id: treeId,
    title: treeSpec.title,
    rootId,
    selectedNodeId: rootId,
    positions,
    nodes,
    definitions,
  }
}

export async function importTreeFromFile(filePath) {
  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`)
  }

  const content = fs.readFileSync(absolutePath, 'utf-8')
  const treeSpec = JSON.parse(content)
  const fullTree = parseDeclarativeTree(treeSpec)

  const existingTrees = await TreeModel.find({
    $or: [{ id: fullTree.id }, { title: fullTree.title }],
  }).lean()

  let savedTree

  if (existingTrees.length > 0) {
    const keepTree = existingTrees[0]
    fullTree.id = keepTree.id
    savedTree = await TreeModel.findOneAndUpdate(
      { id: keepTree.id },
      { $set: fullTree },
      { returnDocument: 'after' }
    )

    if (existingTrees.length > 1) {
      const duplicateIds = existingTrees.slice(1).map((t) => t.id)
      await TreeModel.deleteMany({ id: { $in: duplicateIds } })
    }
  } else {
    savedTree = await TreeModel.create(fullTree)
  }

  await WorkspaceConfigModel.findOneAndUpdate(
    { key: 'main' },
    { selectedTreeId: savedTree.id },
    { upsert: true }
  )

  return savedTree
}

async function runCli() {
  const targetFile = process.argv[2]
  if (!targetFile) {
    console.log('Usage: node server/scripts/importTree.js <path-to-json-file>')
    process.exit(1)
  }

  try {
    const isConnected = await connectDB()
    if (!isConnected) {
      console.error('Could not connect to MongoDB database.')
      process.exit(1)
    }

    const imported = await importTreeFromFile(targetFile)
    console.log(`Successfully imported tree "${imported.title}" (ID: ${imported.id})`)
    process.exit(0)
  } catch (error) {
    console.error('Error importing tree:', error)
    process.exit(1)
  }
}

const isDirectRun = process.argv[1] && process.argv[1].endsWith('importTree.js')
if (isDirectRun) {
  runCli()
}
