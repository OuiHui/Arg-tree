import { palette } from './format'

export type NodeStyleTokens = {
  stanceColor: string
  nodeBgTint: string
  nodeCardBorder: string
  nodeAccentGlow: string
}

export function getNodeStyleTokens(isOrphan: boolean, isRoot: boolean, isPro: boolean): NodeStyleTokens {
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

  return {
    stanceColor,
    nodeBgTint,
    nodeCardBorder,
    nodeAccentGlow,
  }
}
