import React from 'react'
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
  const {
    node,
    isRoot,
    isChildOfRoot,
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

  const isRebuttal = node.stance === 'attack' && !isChildOfRoot && !isRoot

  const stanceColor = isOrphan
    ? '#94a3b8'
    : isRoot
      ? palette.claim
      : isRebuttal
        ? (claimPolarity === 'pro' ? '#fb923c' : '#f43f5e')
        : (palette[node.stance as Stance] ?? palette.support)

  const nodeBgTint = isOrphan
    ? 'rgba(148, 163, 184, 0.04)'
    : isRoot
      ? 'rgba(99, 102, 241, 0.08)'
      : isRebuttal
        ? (claimPolarity === 'pro' ? 'rgba(249, 115, 22, 0.07)' : 'rgba(244, 63, 94, 0.07)')
        : node.stance === 'attack'
          ? 'rgba(244, 63, 94, 0.07)'
          : 'rgba(16, 185, 129, 0.07)'

  const nodeCardBorder = isOrphan
    ? 'rgba(148, 163, 184, 0.3)'
    : isRoot
      ? 'rgba(99, 102, 241, 0.35)'
      : isRebuttal
        ? (claimPolarity === 'pro' ? 'rgba(249, 115, 22, 0.4)' : 'rgba(244, 63, 94, 0.4)')
        : node.stance === 'attack'
          ? 'rgba(244, 63, 94, 0.35)'
          : 'rgba(16, 185, 129, 0.35)'

  const nodeAccentGlow = isOrphan
    ? 'rgba(148, 163, 184, 0.2)'
    : isRoot
      ? 'rgba(99, 102, 241, 0.35)'
      : isRebuttal
        ? (claimPolarity === 'pro' ? 'rgba(249, 115, 22, 0.35)' : 'rgba(244, 63, 94, 0.35)')
        : node.stance === 'attack'
          ? 'rgba(244, 63, 94, 0.35)'
          : 'rgba(16, 185, 129, 0.35)'

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
                  : isRebuttal
                    ? (claimPolarity === 'pro' ? 'badge-rebuttal-pro' : 'badge-rebuttal-con')
                    : `badge-${node.stance}`
            }`}
          >
            {isRoot
              ? 'Central Claim'
              : isOrphan
                ? 'Orphan'
                : isRebuttal
                  ? (claimPolarity === 'pro' ? '🛡️ Rebuttal (Pro)' : '⚔️ Rebuttal (Con)')
                  : node.stance === 'attack'
                    ? '⚔️ Attack'
                    : '🛡️ Support'}
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
          <button
            type="button"
            className="btn-node-action"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              if (isEditing) {
                onStopEditingNode()
              } else {
                onEditNode(node.id)
              }
            }}
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>

          {!isRoot && (
            <button
              type="button"
              className="btn-node-delete"
              title="Delete node"
              aria-label="Delete node"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteNode(node.id)
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
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
