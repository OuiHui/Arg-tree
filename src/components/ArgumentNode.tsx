import React, { useState } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { type Stance, type ArgumentNode as ArgNode, type DefinitionEntry, type ClaimPolarity, palette } from '../argtree'

export type ArgumentNodeData = {
  node: ArgNode
  isRoot: boolean
  isChildOfRoot: boolean
  claimPolarity?: ClaimPolarity
  isOrphan: boolean
  isSelected: boolean
  isDimmed?: boolean
  isEditing: boolean
  linkedDefinitions?: DefinitionEntry[]
  onSelectNode: (nodeId: string) => void
  onEditNode: (nodeId: string) => void
  onStopEditingNode: () => void
  onUpdateNodeText: (nodeId: string, text: string) => void
  onDeleteNode: (nodeId: string) => void
  onAddBranchFromNode: (parentNodeId: string, stance: Stance) => void
}

export type ArgumentNodeType = Node<ArgumentNodeData, 'argumentNode'>

export function ArgumentNode({ data }: NodeProps<ArgumentNodeType>) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const {
    node,
    isRoot,
    claimPolarity,
    isOrphan,
    isSelected,
    isDimmed,
    isEditing,
    linkedDefinitions,
    onSelectNode,
    onEditNode,
    onStopEditingNode,
    onUpdateNodeText,
    onDeleteNode,
    onAddBranchFromNode,
  } = data

  const isPro = claimPolarity === 'pro'

  const stanceColor = isOrphan
    ? '#94a3b8'
    : isRoot
      ? palette.claim
      : isPro
        ? '#10b981'
        : '#ef4444'

  const nodeBgTint = isOrphan
    ? 'rgba(148, 163, 184, 0.04)'
    : isRoot
      ? 'rgba(139, 92, 246, 0.08)'
      : isPro
        ? 'rgba(16, 185, 129, 0.08)'
        : 'rgba(239, 68, 68, 0.08)'

  const nodeCardBorder = isOrphan
    ? 'rgba(148, 163, 184, 0.3)'
    : isRoot
      ? 'rgba(139, 92, 246, 0.35)'
      : isPro
        ? 'rgba(16, 185, 129, 0.4)'
        : 'rgba(239, 68, 68, 0.4)'

  const nodeAccentGlow = isOrphan
    ? 'rgba(148, 163, 184, 0.2)'
    : isRoot
      ? 'rgba(139, 92, 246, 0.35)'
      : isPro
        ? 'rgba(16, 185, 129, 0.35)'
        : 'rgba(239, 68, 68, 0.35)'

  return (
    <div
      className={`node-card ${isSelected ? 'is-selected' : ''} ${isDimmed ? 'is-dimmed' : ''} ${isRoot ? 'is-root' : ''} ${isOrphan ? 'is-orphan' : ''}`}
      style={
        {
          '--node-accent': stanceColor,
          '--node-bg-tint': nodeBgTint,
          '--node-card-border': nodeCardBorder,
          '--node-accent-glow': nodeAccentGlow,
        } as React.CSSProperties
      }
      onClick={() => onSelectNode(node.id)}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="node-handle node-handle-target"
      />

      <div className="node-card-header">
        <div className="node-card-badges">
          <span
            className={`badge ${
              isRoot
                ? 'badge-claim'
                : isOrphan
                  ? 'badge-orphan'
                  : isPro
                    ? 'badge-pro'
                    : 'badge-con'
            }`}
          >
            {isRoot
              ? 'Central Claim'
              : isOrphan
                ? 'Orphan'
                : isPro
                  ? (node.stance === 'support' ? '🛡️ Support (Pro)' : '⚔️ Rebuttal (Pro)')
                  : (node.stance === 'attack' ? '⚔️ Attack (Con)' : '🛡️ Support (Con)')}
          </span>
          {linkedDefinitions && linkedDefinitions.length > 0 && (
            <span
              className="badge badge-def-count"
              title={linkedDefinitions.map((d) => d.term).join(', ')}
            >
              📖 {linkedDefinitions.length} {linkedDefinitions.length === 1 ? 'def' : 'defs'}
            </span>
          )}
        </div>


        <div className="node-card-controls">
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn-node-action btn-node-done"
                title="Done editing"
                aria-label="Done editing"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onStopEditingNode()
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                type="button"
                className="btn-node-action btn-node-cancel"
                title="Cancel editing"
                aria-label="Cancel editing"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onStopEditingNode()
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-node-action"
              title="Edit node"
              aria-label="Edit node"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onEditNode(node.id)
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}

          {!isRoot &&
            (isConfirmingDelete ? (
              <div className="node-delete-confirm-group">
                <button
                  type="button"
                  className="btn-node-confirm-btn"
                  title="Click to confirm deletion"
                  aria-label="Confirm delete node"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsConfirmingDelete(false)
                    onDeleteNode(node.id)
                  }}
                >
                  Confirm?
                </button>
                <button
                  type="button"
                  className="btn-node-delete"
                  title="Cancel delete"
                  aria-label="Cancel delete"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsConfirmingDelete(false)
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-node-delete"
                title="Delete node"
                aria-label="Delete node"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsConfirmingDelete(true)
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            ))}
        </div>
      </div>

      <div className="node-card-body">
        {isEditing ? (
          <textarea
            className="node-textarea nodrag"
            value={node.text}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onUpdateNodeText(node.id, e.target.value)}
            rows={3}
            autoFocus
          />
        ) : (
          <>
            <p className="node-text">{node.text}</p>
            {linkedDefinitions && linkedDefinitions.length > 0 && (
              <div className="node-card-terms">
                {linkedDefinitions.map((def) => (
                  <span key={def.id} className="term-chip" title={def.description}>
                    📖 {def.term}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="node-card-footer" onPointerDown={(e) => e.stopPropagation()}>
        <div className="btn-branch-wrapper">
          <Handle
            type="target"
            position={Position.Bottom}
            id="support-target"
            className="btn-branch-handle handle-support"
            title="Drag from a node here to link as Support"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="support-source"
            className="btn-branch-handle handle-support"
            title="Drag from here to a node to link as Support"
          />
          <button
            type="button"
            className="btn-branch btn-branch-support"
            onClick={(e) => {
              e.stopPropagation()
              onAddBranchFromNode(node.id, 'support')
            }}
          >
            + Support
          </button>
        </div>

        <div className="btn-branch-wrapper">
          <Handle
            type="target"
            position={Position.Bottom}
            id="attack-target"
            className="btn-branch-handle handle-attack"
            title="Drag from a node here to link as Attack"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="attack-source"
            className="btn-branch-handle handle-attack"
            title="Drag from here to a node to link as Attack"
          />
          <button
            type="button"
            className="btn-branch btn-branch-attack"
            onClick={(e) => {
              e.stopPropagation()
              onAddBranchFromNode(node.id, 'attack')
            }}
          >
            + Attack
          </button>
        </div>
      </div>

      {node.connectionIds.length > 0 && (
        <div className="node-crosslinks-indicator">
          <span>{node.connectionIds.length} cross-link{node.connectionIds.length > 1 ? 's' : ''}</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="node-handle node-handle-source"
      />
    </div>
  )
}
