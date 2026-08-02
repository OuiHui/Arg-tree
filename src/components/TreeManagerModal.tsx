import { useState, useMemo } from 'react'
import type { TreeState } from '../types/argtree'
import { TreeCard } from './TreeCard'

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

  const handleSaveRename = (treeId: string, title: string) => {
    if (title.trim()) {
      onRenameTree(treeId, title.trim())
    }
    setEditingTreeId(null)
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
            filteredTrees.map((tree) => (
              <TreeCard
                key={tree.id}
                tree={tree}
                isSelected={tree.id === selectedTreeId}
                isChecked={selectedForBatch.has(tree.id)}
                isEditing={editingTreeId === tree.id}
                isConfirmingDelete={confirmDeleteId === tree.id}
                treeCount={treeList.length}
                onToggleSelect={handleToggleTreeSelection}
                onSelectAndClose={handleSelectAndClose}
                onStartRename={(t) => setEditingTreeId(t.id)}
                onSaveRename={handleSaveRename}
                onDuplicate={onDuplicateTree}
                onDelete={onDeleteTree}
                onConfirmDeleteRequest={setConfirmDeleteId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
