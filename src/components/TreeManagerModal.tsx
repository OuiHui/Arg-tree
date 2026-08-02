import { useState, useMemo, type FormEvent } from 'react'
import type { TreeState } from '../argtree'

type TreeManagerModalProps = {
  isOpen: boolean
  treeList: TreeState[]
  selectedTreeId: string
  onClose: () => void
  onSelectTree: (treeId: string) => void
  onRenameTree: (treeId: string, newTitle: string) => void
  onDuplicateTree: (treeId: string) => void
  onDeleteTree: (treeId: string) => void
  onDeleteMultipleTrees: (treeIds: string[]) => void
  onCleanUpEmptyTrees: () => void
  onOpenNewTreeModal: () => void
}

export function TreeManagerModal({
  isOpen,
  treeList,
  selectedTreeId,
  onClose,
  onSelectTree,
  onRenameTree,
  onDuplicateTree,
  onDeleteTree,
  onDeleteMultipleTrees,
  onCleanUpEmptyTrees,
  onOpenNewTreeModal,
}: TreeManagerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTreeId, setEditingTreeId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set())
  const [isConfirmingBatchDelete, setIsConfirmingBatchDelete] = useState(false)

  const filteredTrees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return treeList

    return treeList.filter((tree) => {
      const titleMatch = tree.title.toLowerCase().includes(q)
      const rootNode = tree.nodes[tree.rootId]
      const claimMatch = rootNode?.text.toLowerCase().includes(q) ?? false
      return titleMatch || claimMatch
    })
  }, [treeList, searchQuery])

  if (!isOpen) return null

  const handleToggleSelectAll = () => {
    if (selectedForBatch.size === filteredTrees.length) {
      setSelectedForBatch(new Set())
    } else {
      setSelectedForBatch(new Set(filteredTrees.map((t) => t.id)))
    }
  }

  const handleToggleTreeSelection = (treeId: string) => {
    setSelectedForBatch((prev) => {
      const next = new Set(prev)
      if (next.has(treeId)) {
        next.delete(treeId)
      } else {
        next.add(treeId)
      }
      return next
    })
  }

  const handleExecuteBatchDelete = () => {
    const idsToDelete = Array.from(selectedForBatch)
    onDeleteMultipleTrees(idsToDelete)
    setSelectedForBatch(new Set())
    setIsConfirmingBatchDelete(false)
  }

  const handleStartRename = (tree: TreeState) => {
    setEditingTreeId(tree.id)
    setEditingTitle(tree.title)
  }

  const handleSaveRename = (treeId: string) => {
    if (editingTitle.trim()) {
      onRenameTree(treeId, editingTitle.trim())
    }
    setEditingTreeId(null)
  }

  const handleRenameSubmit = (e: FormEvent, treeId: string) => {
    e.preventDefault()
    handleSaveRename(treeId)
  }

  const handleSelectAndClose = (treeId: string) => {
    onSelectTree(treeId)
    onClose()
  }

  const isAllSelected = filteredTrees.length > 0 && selectedForBatch.size === filteredTrees.length

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content tree-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-with-badge">
            <h3>Manage Argument Trees</h3>
            <span className="count-badge">{treeList.length}</span>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="tree-manager-toolbar">
          <div className="search-input-wrapper">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Filter trees by title or claim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="toolbar-actions">
            {treeList.length > 2 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onCleanUpEmptyTrees}
                title="Clean up empty starter/untitled trees"
              >
                Clean Up Duplicates
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose()
                onOpenNewTreeModal()
              }}
            >
              + New Tree
            </button>
          </div>
        </div>

        {filteredTrees.length > 0 && (
          <div className="batch-selection-bar">
            <label className="checkbox-label select-all-label">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="custom-checkbox"
              />
              <span>Select All ({filteredTrees.length})</span>
            </label>

            {selectedForBatch.size > 0 && (
              <div className="batch-action-buttons">
                {isConfirmingBatchDelete ? (
                  <>
                    <span className="batch-confirm-text">Delete {selectedForBatch.size} tree(s)?</span>
                    <button
                      type="button"
                      className="btn btn-danger btn-xs"
                      onClick={handleExecuteBatchDelete}
                    >
                      Confirm Mass Delete
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => setIsConfirmingBatchDelete(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger btn-xs"
                    onClick={() => setIsConfirmingBatchDelete(true)}
                  >
                    Delete Selected ({selectedForBatch.size})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="tree-manager-list">
          {filteredTrees.length === 0 ? (
            <div className="empty-search-state">
              <p>No argument trees match "{searchQuery}"</p>
            </div>
          ) : (
            filteredTrees.map((tree) => {
              const isSelected = tree.id === selectedTreeId
              const isChecked = selectedForBatch.has(tree.id)
              const isEditing = editingTreeId === tree.id
              const isConfirmingDelete = confirmDeleteId === tree.id
              const nodeCount = Object.keys(tree.nodes).length
              const rootNode = tree.nodes[tree.rootId]

              return (
                <div
                  key={tree.id}
                  className={`tree-card ${isSelected ? 'is-active' : ''} ${isChecked ? 'is-checked' : ''}`}
                >
                  <label className="checkbox-label item-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleTreeSelection(tree.id)}
                      className="custom-checkbox"
                    />
                  </label>

                  <div className="tree-card-main">
                    <div className="tree-card-header">
                      {isEditing ? (
                        <form
                          onSubmit={(e) => handleRenameSubmit(e, tree.id)}
                          className="inline-rename-form"
                        >
                          <input
                            type="text"
                            className="inline-rename-input"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => handleSaveRename(tree.id)}
                            autoFocus
                          />
                          <button type="submit" className="btn btn-primary btn-xs">
                            Save
                          </button>
                        </form>
                      ) : (
                        <div className="tree-title-group">
                          <h4
                            className="tree-title"
                            onClick={() => handleSelectAndClose(tree.id)}
                          >
                            {tree.title}
                          </h4>
                          {isSelected && <span className="active-badge">Active</span>}
                        </div>
                      )}
                    </div>

                    {rootNode && (
                      <p className="tree-claim-preview">
                        "{rootNode.text}"
                      </p>
                    )}

                    <div className="tree-meta">
                      <span className="meta-item">{nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}</span>
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
                        onClick={() => handleSelectAndClose(tree.id)}
                      >
                        Select
                      </button>
                    )}

                    {!isEditing && (
                      <button
                        type="button"
                        className="icon-action-btn"
                        onClick={() => handleStartRename(tree)}
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
                      onClick={() => onDuplicateTree(tree.id)}
                      title="Duplicate tree"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>

                    {treeList.length > 1 && (
                      isConfirmingDelete ? (
                        <div className="delete-confirm-group">
                          <button
                            type="button"
                            className="btn btn-danger btn-xs"
                            onClick={() => {
                              onDeleteTree(tree.id)
                              setConfirmDeleteId(null)
                            }}
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="icon-action-btn danger"
                          onClick={() => setConfirmDeleteId(tree.id)}
                          title="Delete tree"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
