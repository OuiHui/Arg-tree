import React, { useState } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { type Stance, type ArgumentNode as ArgNode, type DefinitionEntry, type ClaimPolarity } from '../argtree'
import { getNodeStyleTokens } from '../utils/styles'
import { CheckIcon, CloseIcon, EditIcon, TrashIcon } from './NodeIcons'

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
  const styles = getNodeStyleTokens(isOrphan, isRoot, isPro)

  const getBadgeLabel = () => {
    if (isRoot) return 'Central Claim'
    if (isOrphan) return 'Orphan'
    if (isPro) {
      return node.stance === 'support' ? '🛡️ Support (Pro)' : '⚔️ Rebuttal (Pro)'
    }
    return node.stance === 'attack' ? '⚔️ Attack (Con)' : '🛡️ Support (Con)'
  }

  const getBadgeClass = () => {
    if (isRoot) return 'badge-claim'
    if (isOrphan) return 'badge-orphan'
    return isPro ? 'badge-pro' : 'badge-con'
  }

  return (
    <div
      className={`node-card ${isSelected ? 'is-selected' : ''} ${isDimmed ? 'is-dimmed' : ''} ${isRoot ? 'is-root' : ''} ${isOrphan ? 'is-orphan' : ''}`}
      style={
        {
          '--node-accent': styles.stanceColor,
          '--node-bg-tint': styles.nodeBgTint,
          '--node-card-border': styles.nodeCardBorder,
          '--node-accent-glow': styles.nodeAccentGlow,
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
          <span className={`badge ${getBadgeClass()}`}>
            {getBadgeLabel()}
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
                <CheckIcon />
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
                <CloseIcon />
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
              <EditIcon />
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
                  <CloseIcon width={12} height={12} />
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
                <TrashIcon />
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
