import type { Stance } from '../types/argtree'

export const palette: Record<Stance | 'claim' | 'rebuttal', string> = {
  claim: '#8b5cf6',
  support: '#10b981',
  attack: '#ef4444',
  rebuttal: '#ef4444',
}

export const formatNodeLabel = (text: string) => {
  if (text.length <= 32) return text
  return `${text.slice(0, 32)}…`
}
