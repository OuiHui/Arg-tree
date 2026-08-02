import { useState, type FormEvent } from 'react'
import type { TreeState } from '../types/argtree'

type TreeCardProps = {
  tree: TreeState
  isSelected: boolean
  isChecked: boolean
  isEditing: boolean
  isConfirmingDelete: boolean
  treeCount: number
  onToggleSelect: (treeId: string) => void
  onSelectAndClose: (treeId: string) => void
  onStartRename: (tree: TreeState) => void
  onSaveRename: (treeId: string, title: string) => void
  onDuplicate: (treeId: string) => void
  onDelete: (treeId: string) => void
  onConfirmDeleteRequest: (treeId: string | null) => void
}

export function TreeCard({
  tree,
  isSelected,
  isChecked,
  isEditing,
  isConfirmingDelete,
  treeCount,
  onToggleSelect,
  onSelectAndClose,
  onStartRename,
  onSaveRename,
  onDuplicate,
  onDelete,
  onConfirmDeleteRequest,
}: TreeCardProps) {
  const [editingTitle, setEditingTitle] = useState(tree.title)
  const nodeCount = Object.keys(tree.nodes).length
  const rootNode = tree.nodes[tree.rootId]

  const handleRenameSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSaveRename(tree.id, editingTitle)
  }

  return (
    <div className={`tree-card ${isSelected ? 'is-active' : ''} ${isChecked ? 'is-checked' : ''}`}>
      <label className="checkbox-label item-checkbox" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => onToggleSelect(tree.id)}
          className="custom-checkbox"
        />
      </label>

      <div className="tree-card-main">
        <div className="tree-card-header">
          {isEditing ? (
            <form onSubmit={handleRenameSubmit} className="inline-rename-form">
              <input
                type="text"
                className="inline-rename-input"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => onSaveRename(tree.id, editingTitle)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-xs">
                Save
              </button>
            </form>
          ) : (
            <div className="tree-title-group">
              <h4 className="tree-title" onClick={() => onSelectAndClose(tree.id)}>
                {tree.title}
              </h4>
              {isSelected && <span className="active-badge">Active</span>}
            </div>
          )}
        </div>

        {rootNode && <p className="tree-claim-preview">"{rootNode.text}"</p>}

        <div className="tree-meta">
          <span className="meta-item">
            {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
          </span>
          {tree.definitions?.length > 0 && (
            <span className="meta-item">• {tree.definitions.length} terms</span>
          )}
        </div>
      </div>

      <div className="tree-card-actions">
        {!isSelected && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onSelectAndClose(tree.id)}
          >
            Select
          </button>
        )}

        {!isEditing && (
          <button
            type="button"
            className="icon-action-btn"
            onClick={() => {
              setEditingTitle(tree.title)
              onStartRename(tree)
            }}
            title="Rename tree"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}

        <button
          type="button"
          className="icon-action-btn"
          onClick={() => onDuplicate(tree.id)}
          title="Duplicate tree"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>

        {treeCount > 1 &&
          (isConfirmingDelete ? (
            <div className="delete-confirm-group">
              <button
                type="button"
                className="btn btn-danger btn-xs"
                onClick={() => {
                  onDelete(tree.id)
                  onConfirmDeleteRequest(null)
                }}
              >
                Confirm Delete
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => onConfirmDeleteRequest(null)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="icon-action-btn danger"
              onClick={() => onConfirmDeleteRequest(tree.id)}
              title="Delete tree"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          ))}
      </div>
    </div>
  )
}
