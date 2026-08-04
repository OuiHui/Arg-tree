import { useState, type FormEvent } from 'react'
import { type TreeState } from '../types/argtree'
import { TreeDropdown } from './TreeDropdown'

type HeaderProps = {
  treeList: TreeState[]
  selectedTreeId: string
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onSelectTreeId: (treeId: string) => void
  onRenameTree: (treeId: string, newTitle: string) => void
  onOpenNewTreeModal: () => void
  onOpenTreeManager: () => void
  onAutoLayout: () => void
  onDeleteTree: (treeId: string) => void
}

export function Header({
  treeList,
  selectedTreeId,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onSelectTreeId,
  onRenameTree,
  onOpenNewTreeModal,
  onOpenTreeManager,
  onAutoLayout,
  onDeleteTree,
}: HeaderProps) {
  const selectedTree = treeList.find((t) => t.id === selectedTreeId)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(selectedTree?.title || '')

  const handleStartRename = () => {
    if (selectedTree) {
      setTitleInput(selectedTree.title)
      setIsEditingTitle(true)
    }
  }

  const handleSaveRename = () => {
    if (selectedTree && titleInput.trim()) {
      onRenameTree(selectedTree.id, titleInput.trim())
    }
    setIsEditingTitle(false)
  }

  const handleTitleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleSaveRename()
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="3" />
            <circle cx="6" cy="19" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M12 8v4M9 14.5l-2 2M15 14.5l2 2" />
          </svg>
          <span className="brand-name">argTree</span>
        </div>

        <div className="tree-selector-wrapper">
          {isEditingTitle ? (
            <form onSubmit={handleTitleFormSubmit} className="header-rename-form">
              <input
                type="text"
                className="header-rename-input"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleSaveRename}
                autoFocus
              />
            </form>
          ) : (
            <div className="active-tree-display">
              <TreeDropdown
                treeList={treeList}
                selectedTreeId={selectedTreeId}
                onSelectTreeId={onSelectTreeId}
                onOpenTreeManager={onOpenTreeManager}
              />

              <button
                type="button"
                className="btn-icon-subtle"
                onClick={handleStartRename}
                title="Rename active tree"
                aria-label="Rename active tree"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo action"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
          <span>Undo</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          aria-label="Redo action"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
          </svg>
          <span>Redo</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenTreeManager}
          title="Open Tree Manager"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span>Manage Trees</span>
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenNewTreeModal}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Tree</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onAutoLayout}
          title="Auto-arrange tree layout"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>Auto Layout</span>
        </button>

        {treeList.length > 1 && (
          <button
            type="button"
            className="btn btn-ghost danger"
            onClick={() => onDeleteTree(selectedTreeId)}
            title="Delete active argument tree"
          >
            Delete
          </button>
        )}
      </div>
    </header>
  )
}

