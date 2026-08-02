import { useState, type FormEvent } from 'react'

type NewTreeModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreateTree: (title: string, claim: string) => void
}

export function NewTreeModal({ isOpen, onClose, onCreateTree }: NewTreeModalProps) {
  const [title, setTitle] = useState('')
  const [claim, setClaim] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onCreateTree(title, claim)
    setTitle('')
    setClaim('')
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Argument Tree</h3>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="tree-title">Tree Title</label>
            <input
              id="tree-title"
              type="text"
              className="input-text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Later School Start Times"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="tree-claim">Root Claim</label>
            <textarea
              id="tree-claim"
              className="input-textarea"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder="Enter the core proposition or claim of this argument tree..."
              rows={3}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Tree
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
