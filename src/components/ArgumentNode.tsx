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
      className={`canvas-node ${isSelected ? 'selected' : ''}`}
      style={
        {
          '--node-accent': stanceColor,
          cursor: 'pointer',
        } as React.CSSProperties
      }
      onClick={() => onSelectNode(node.id)}
    >
      {/* Top Handle for incoming parent/connection edges */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        style={{
          background: stanceColor,
          width: 12,
          height: 12,
          border: '2px solid #07101d',
          top: -6,
        }}
      />

      <div className="node-header">
        <span className="node-badge">{isRoot ? 'Claim' : node.stance}</span>
        <div className="node-header-controls">
          <button
            type="button"
            className="node-edit-button"
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
              className="node-delete-button"
              title="Delete argument"
              aria-label="Delete argument"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onDeleteNode(node.id)
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          className="node-text-editor nodrag"
          value={node.text}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => onUpdateNodeText(node.id, e.target.value)}
          rows={3}
          autoFocus
        />
      ) : (
        <p className="node-text">{node.text}</p>
      )}

      <div className="node-actions" onPointerDown={(e) => e.stopPropagation()}>
        <div style={{ position: 'relative', flex: 1 }}>
          <button
            type="button"
            className="node-branch-button support"
            style={{ width: '100%' }}
            onClick={(e) => {
              e.stopPropagation()
              onAddBranchFromNode(node.id, 'support')
            }}
          >
            Support +
          </button>
          <Handle
            type="source"
            position={Position.Bottom}
            id={`support-${node.id}`}
            style={{
              background: palette.support,
              width: 10,
              height: 10,
              bottom: -5,
              left: '25%',
            }}
          />
        </div>

        <div style={{ position: 'relative', flex: 1 }}>
          <button
            type="button"
            className="node-branch-button attack"
            style={{ width: '100%' }}
            onClick={(e) => {
              e.stopPropagation()
              onAddBranchFromNode(node.id, 'attack')
            }}
          >
            Attack +
          </button>
          <Handle
            type="source"
            position={Position.Bottom}
            id={`attack-${node.id}`}
            style={{
              background: palette.attack,
              width: 10,
              height: 10,
              bottom: -5,
              left: '75%',
            }}
          />
        </div>
      </div>

      {node.connectionIds.length > 0 && (
        <span className="node-footnote">{node.connectionIds.length} cross-link(s)</span>
      )}

      {/* Main bottom source handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        style={{
          background: stanceColor,
          width: 12,
          height: 12,
          border: '2px solid #07101d',
          bottom: -6,
        }}
      />
    </div>
  )
}
