import React from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { type Stance, type ArgumentNode as ArgNode, palette } from '../argtree'

export type ArgumentNodeData = {
  node: ArgNode
  isRoot: boolean
  isSelected: boolean
  isEditing: boolean
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
    isSelected,
    isEditing,
    onSelectNode,
    onEditNode,
    onStopEditingNode,
    onUpdateNodeText,
    onDeleteNode,
    onAddBranchFromNode,
  } = data

  const stanceColor = palette[node.stance as Stance] ?? palette.support

  return (
    <div
      className={`node-card ${isSelected ? 'is-selected' : ''} ${isRoot ? 'is-root' : ''}`}
      style={
        {
          '--node-accent': stanceColor,
        } as React.CSSProperties
      }
      onClick={() => onSelectNode(node.id)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="node-handle node-handle-target"
      />

      <div className="node-card-header">
        <span className={`badge badge-${isRoot ? 'claim' : node.stance}`}>
          {isRoot ? 'Central Claim' : node.stance}
        </span>

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
          <p className="node-text">{node.text}</p>
        )}
      </div>

      <div className="node-card-footer" onPointerDown={(e) => e.stopPropagation()}>
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

      {node.connectionIds.length > 0 && (
        <div className="node-crosslinks-indicator">
          <span>{node.connectionIds.length} cross-link{node.connectionIds.length > 1 ? 's' : ''}</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="node-handle node-handle-source"
      />
    </div>
  )
}
