import { useState, useRef, useEffect, useCallback } from 'react'
import type { TreeState } from '../types/argtree'

type TreeDropdownProps = {
  treeList: TreeState[]
  selectedTreeId: string
  onSelectTreeId: (treeId: string) => void
  onOpenTreeManager: () => void
}

export function TreeDropdown({
  treeList,
  selectedTreeId,
  onSelectTreeId,
  onOpenTreeManager,
}: TreeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedTree = treeList.find((t) => t.id === selectedTreeId) ?? treeList[0]
  const nodeCount = selectedTree ? Object.keys(selectedTree.nodes).length : 0

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleClose])

  const handleSelect = (treeId: string) => {
    onSelectTreeId(treeId)
    handleClose()
  }

  const handleManage = () => {
    onOpenTreeManager()
    handleClose()
  }

  return (
    <div className="tree-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`tree-dropdown-trigger ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select active argument tree"
      >
        <svg
          className="tree-dropdown-icon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 3v12" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>

        <span className="tree-dropdown-label">{selectedTree?.title || 'Select Tree'}</span>

        <span className="tree-dropdown-badge">
          {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
        </span>

        <svg
          className={`tree-dropdown-chevron ${isOpen ? 'is-open' : ''}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        className={`tree-dropdown-menu ${isOpen ? 'is-visible' : ''}`}
        role="listbox"
        aria-label="Argument trees"
      >
        <div className="tree-dropdown-header">Argument Trees</div>
        <div className="tree-dropdown-list">
          {treeList.map((tree) => {
            const isSelected = tree.id === selectedTreeId
            const count = Object.keys(tree.nodes).length
            return (
              <button
                key={tree.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`tree-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelect(tree.id)}
              >
                <span className="tree-item-check">
                  {isSelected && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className="tree-item-title">{tree.title}</span>
                <span className="tree-item-badge">
                  {count} {count === 1 ? 'node' : 'nodes'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="tree-dropdown-divider" />

        <button type="button" className="tree-dropdown-action" onClick={handleManage}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Manage All Trees...</span>
        </button>
      </div>
    </div>
  )
}
