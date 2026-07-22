import mongoose from 'mongoose'

const treeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    rootId: { type: String, required: true },
    selectedNodeId: { type: String, required: true },
    nodes: { type: Object, default: {} },
    positions: { type: Object, default: {} },
    definitions: { type: Array, default: [] },
  },
  {
    timestamps: true,
  }
)

export const TreeModel = mongoose.model('Tree', treeSchema)
