import mongoose from 'mongoose'

const workspaceConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'main' },
    selectedTreeId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

export const WorkspaceConfigModel = mongoose.model('WorkspaceConfig', workspaceConfigSchema)
