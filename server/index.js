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

// Connect to MongoDB and ensure seed data
connectDB().then(() => {
  ensureInitialSeed().catch((err) => console.error('Error seeding database:', err))
})

// GET /api/workspace - Fetch workspace state with all trees
app.get('/api/workspace', async (req, res) => {
  try {
    await ensureInitialSeed()

    const treesDoc = await TreeModel.find().lean()
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

    res.json({
      selectedTreeId,
      trees,
    })
  } catch (error) {
    console.error('Error fetching workspace:', error)
    res.status(500).json({ error: 'Failed to fetch workspace' })
  }
})

// POST /api/trees - Create a new tree
app.post('/api/trees', async (req, res) => {
  try {
    const treeData = req.body
    if (!treeData.id || !treeData.title) {
      return res.status(400).json({ error: 'Invalid tree data' })
    }

    const createdTree = await TreeModel.create(treeData)
    await WorkspaceConfigModel.findOneAndUpdate(
      { key: 'main' },
      { selectedTreeId: createdTree.id },
      { upsert: true }
    )

    res.status(201).json(createdTree)
  } catch (error) {
    console.error('Error creating tree:', error)
    res.status(500).json({ error: 'Failed to create tree' })
  }
})

// PUT /api/trees/:id - Update existing tree
app.put('/api/trees/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const updatedTree = await TreeModel.findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after', upsert: true }
    )

    res.json(updatedTree)
  } catch (error) {
    console.error(`Error updating tree ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to update tree' })
  }
})

// DELETE /api/trees/:id - Delete a tree
app.delete('/api/trees/:id', async (req, res) => {
  try {
    const { id } = req.params
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

    res.json({
      selectedTreeId: nextSelectedId,
      trees,
    })
  } catch (error) {
    console.error(`Error deleting tree ${req.params.id}:`, error)
    res.status(500).json({ error: 'Failed to delete tree' })
  }
})

// PUT /api/workspace/selected - Update selected tree ID
app.put('/api/workspace/selected', async (req, res) => {
  try {
    const { selectedTreeId } = req.body
    if (!selectedTreeId) {
      return res.status(400).json({ error: 'selectedTreeId is required' })
    }

    await WorkspaceConfigModel.findOneAndUpdate(
      { key: 'main' },
      { selectedTreeId },
      { upsert: true }
    )

    res.json({ selectedTreeId })
  } catch (error) {
    console.error('Error updating selected tree ID:', error)
    res.status(500).json({ error: 'Failed to update selected tree ID' })
  }
})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})
