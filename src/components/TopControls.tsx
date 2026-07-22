import { type TreeState } from '../argtree'

type TopControlsProps = {
  treeList: TreeState[]
  selectedTreeId: string
  onSelectTreeId: (treeId: string) => void
  newTreeTitle: string
  onNewTreeTitleChange: (value: string) => void
  newTreeClaim: string
  onNewTreeClaimChange: (value: string) => void
  onCreateTree: () => void
  onResetWorkspace: () => void
  onDeleteTree: (treeId: string) => void
}

export function TopControls({
  treeList,
  selectedTreeId,
  onSelectTreeId,
  newTreeTitle,
  onNewTreeTitleChange,
  newTreeClaim,
  onNewTreeClaimChange,
  onCreateTree,
  onResetWorkspace,
  onDeleteTree,
}: TopControlsProps) {
  return (
    <section className="topbar-create">
      <div className="topbar-create-grid">
        <label className="field">
          <span>New tree title</span>
          <input
            value={newTreeTitle}
            onChange={(event) => onNewTreeTitleChange(event.target.value)}
            placeholder="Untitled tree"
          />
        </label>
        <label className="field grow">
          <span>Root claim for the new tree</span>
          <input
            value={newTreeClaim}
            onChange={(event) => onNewTreeClaimChange(event.target.value)}
            placeholder="Write the central claim for a new map"
          />
        </label>
        <button type="button" className="primary" onClick={onCreateTree}>
          Create argument tree
        </button>
      </div>

      <div className="topbar-actions">
        <label className="field compact">
          <span>Tree</span>
          <select value={selectedTreeId} onChange={(event) => onSelectTreeId(event.target.value)}>
            {treeList.map((tree) => (
              <option key={tree.id} value={tree.id}>
                {tree.title}
              </option>
            ))}
          </select>
        </label>

        <div className="toolbar-group">
          <button
            type="button"
            className="secondary danger-text"
            onClick={() => onDeleteTree(selectedTreeId)}
            title="Delete active tree"
          >
            Delete tree
          </button>
          <button type="button" className="secondary" onClick={onResetWorkspace}>
            Reset sample
          </button>
        </div>
      </div>
    </section>
  )
}