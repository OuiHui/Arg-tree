import express from 'express'
import cors from 'cors'
import { connectDB } from './db.js'
import { TreeModel } from './models/Tree.js'
import { WorkspaceConfigModel } from './models/Workspace.js'
import { ensureInitialSeed, generateSeedTree } from './seed.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: '10mb' }))

let isMongoConnected = false

const memoryStore = {
  selectedTreeId: '',
  trees: {},
}

function initMemoryStore() {
  if (Object.keys(memoryStore.trees).length === 0) {
    const seed = generateSeedTree('Free Will & Determinism')
    memoryStore.trees[seed.id] = seed
    memoryStore.selectedTreeId = seed.id
  }
}

connectDB().then((connected) => {
  isMongoConnected = connected
  if (connected) {
    ensureInitialSeed().catch((err) => console.error('Error seeding database:', err))
  } else {
    initMemoryStore()
  }
})

// GET /api/workspace
app.get('/api/workspace', async (req, res) => {
  try {
    if (isMongoConnected) {
      let treesDoc = await TreeModel.find().lean()
      if (treesDoc.length === 0) {
        await ensureInitialSeed()
        treesDoc = await TreeModel.find().lean()
      }
      let configDoc = await WorkspaceConfigModel.findOne({ key: 'main' }).lean()

      const trees = {}
      for (const tree of treesDoc) {
        trees[tree.id] = {
          id: tree.id,
          title: tree.title,
          rootId: tree.rootId,
          selectedNodeId: tree.selectedNodeId,
          nodes: tree.nodes || {},
          positions: tree.positions || {},
          definitions: tree.definitions || [],
        }
      }

      let selectedTreeId = configDoc?.selectedTreeId
      if (!selectedTreeId || !trees[selectedTreeId]) {
        selectedTreeId = Object.keys(trees)[0]
      }

      return res.json({ selectedTreeId, trees })
    }
  } catch (error) {
    console.warn('MongoDB query failed, falling back to memory store:', error.message)
  }

  initMemoryStore()
  res.json({
    selectedTreeId: memoryStore.selectedTreeId,
    trees: memoryStore.trees,
  })
})

// POST /api/trees
app.post('/api/trees', async (req, res) => {
  try {
    const treeData = req.body
    if (!treeData.id || !treeData.title) {
      return res.status(400).json({ error: 'Invalid tree data' })
    }

    if (isMongoConnected) {
      const createdTree = await TreeModel.create(treeData)
      await WorkspaceConfigModel.findOneAndUpdate(
        { key: 'main' },
        { selectedTreeId: createdTree.id },
        { upsert: true }
      )
      return res.status(201).json(createdTree)
    }
  } catch (error) {
    console.warn('MongoDB tree creation failed, updating memory store:', error.message)
  }

  const treeData = req.body
  memoryStore.trees[treeData.id] = treeData
  memoryStore.selectedTreeId = treeData.id
  res.status(201).json(treeData)
})

// PUT /api/trees/:id
app.put('/api/trees/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    if (isMongoConnected) {
      const updatedTree = await TreeModel.findOneAndUpdate(
        { id },
        { $set: updateData },
        { returnDocument: 'after', upsert: true }
      )
      return res.json(updatedTree)
    }
  } catch (error) {
    console.warn(`MongoDB update failed for tree ${req.params.id}, updating memory store:`, error.message)
  }

  const { id } = req.params
  memoryStore.trees[id] = req.body
  res.json(req.body)
})

// DELETE /api/trees/:id
app.delete('/api/trees/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (isMongoConnected) {
      await TreeModel.deleteOne({ id })

      const remainingTrees = await TreeModel.find().lean()
      let nextSelectedId = ''

      if (remainingTrees.length === 0) {
        const seed = generateSeedTree('Starter tree')
        await TreeModel.create(seed)
        nextSelectedId = seed.id
      } else {
        nextSelectedId = remainingTrees[0].id
      }

      await WorkspaceConfigModel.findOneAndUpdate(
        { key: 'main' },
        { selectedTreeId: nextSelectedId },
        { upsert: true }
      )

      const trees = {}
      const updatedDocs = await TreeModel.find().lean()
      for (const tree of updatedDocs) {
        trees[tree.id] = {
          id: tree.id,
          title: tree.title,
          rootId: tree.rootId,
          selectedNodeId: tree.selectedNodeId,
          nodes: tree.nodes || {},
          positions: tree.positions || {},
          definitions: tree.definitions || [],
        }
      }

      return res.json({ selectedTreeId: nextSelectedId, trees })
    }
  } catch (error) {
    console.warn(`MongoDB delete failed for tree ${req.params.id}, updating memory store:`, error.message)
  }

  const { id } = req.params
  delete memoryStore.trees[id]
  let nextSelectedId = ''

  if (Object.keys(memoryStore.trees).length === 0) {
    const seed = generateSeedTree('Starter tree')
    memoryStore.trees[seed.id] = seed
    nextSelectedId = seed.id
  } else {
    nextSelectedId = Object.keys(memoryStore.trees)[0]
  }

  memoryStore.selectedTreeId = nextSelectedId
  res.json({ selectedTreeId: nextSelectedId, trees: memoryStore.trees })
})

// PUT /api/workspace/selected
app.put('/api/workspace/selected', async (req, res) => {
  try {
    const { selectedTreeId } = req.body
    if (!selectedTreeId) {
      return res.status(400).json({ error: 'selectedTreeId is required' })
    }

    if (isMongoConnected) {
      await WorkspaceConfigModel.findOneAndUpdate(
        { key: 'main' },
        { selectedTreeId },
        { upsert: true }
      )
      return res.json({ selectedTreeId })
    }
  } catch (error) {
    console.warn('MongoDB selected tree update failed, updating memory store:', error.message)
  }

  const { selectedTreeId } = req.body
  memoryStore.selectedTreeId = selectedTreeId
  res.json({ selectedTreeId })
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
