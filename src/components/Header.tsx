import { type TreeState } from '../argtree'

type HeaderProps = {
  treeList: TreeState[]
  selectedTreeId: string
  onSelectTreeId: (treeId: string) => void
  onOpenNewTreeModal: () => void
  onAutoLayout: () => void
  onResetWorkspace: () => void
  onDeleteTree: (treeId: string) => void
}

export function Header({
  treeList,
  selectedTreeId,
  onSelectTreeId,
  onOpenNewTreeModal,
  onAutoLayout,
  onResetWorkspace,
  onDeleteTree,
}: HeaderProps) {
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
          <select
            className="tree-select"
            value={selectedTreeId}
            onChange={(e) => onSelectTreeId(e.target.value)}
            aria-label="Select active argument tree"
          >
            {treeList.map((tree) => (
              <option key={tree.id} value={tree.id}>
                {tree.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="header-actions">
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

        <button
          type="button"
          className="btn btn-ghost"
          onClick={onResetWorkspace}
          title="Reset workspace to default starter tree"
        >
          Reset Sample
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
