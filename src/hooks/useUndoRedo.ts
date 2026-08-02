import { useState, useCallback, useRef } from 'react'
import { type TreeState } from '../argtree'

const MAX_HISTORY = 50

type HistoryMap = Record<string, { past: TreeState[]; future: TreeState[] }>

export function useUndoRedo() {
  const [historyMap, setHistoryMap] = useState<HistoryMap>({})
  const lastActionRef = useRef<{ treeId: string; type: string; time: number } | null>(null)

  const recordState = useCallback(
    (treeId: string, currentState: TreeState, actionType: string = 'general') => {
      setHistoryMap((prevMap) => {
        const treeHistory = prevMap[treeId] || { past: [], future: [] }
        const now = Date.now()
        const lastAction = lastActionRef.current

        const shouldCoalesce =
          lastAction &&
          lastAction.treeId === treeId &&
          lastAction.type === actionType &&
          (actionType === 'text' || actionType === 'moveNode') &&
          now - lastAction.time < 1200

        lastActionRef.current = { treeId, type: actionType, time: now }

        let updatedPast: TreeState[]
        if (shouldCoalesce && treeHistory.past.length > 0) {
          updatedPast = treeHistory.past
        } else {
          updatedPast = [...treeHistory.past, currentState].slice(-MAX_HISTORY)
        }

        return {
          ...prevMap,
          [treeId]: {
            past: updatedPast,
            future: [],
          },
        }
      })
    },
    [],
  )

  const undo = useCallback((treeId: string, currentTree: TreeState): TreeState | null => {
    let result: TreeState | null = null
    setHistoryMap((prevMap) => {
      const treeHistory = prevMap[treeId]
      if (!treeHistory || treeHistory.past.length === 0) return prevMap

      const pastCopy = [...treeHistory.past]
      const previousTree = pastCopy.pop()!
      result = previousTree

      return {
        ...prevMap,
        [treeId]: {
          past: pastCopy,
          future: [currentTree, ...treeHistory.future].slice(0, MAX_HISTORY),
        },
      }
    })
    lastActionRef.current = null
    return result
  }, [])

  const redo = useCallback((treeId: string, currentTree: TreeState): TreeState | null => {
    let result: TreeState | null = null
    setHistoryMap((prevMap) => {
      const treeHistory = prevMap[treeId]
      if (!treeHistory || treeHistory.future.length === 0) return prevMap

      const futureCopy = [...treeHistory.future]
      const nextTree = futureCopy.shift()!
      result = nextTree

      return {
        ...prevMap,
        [treeId]: {
          past: [...treeHistory.past, currentTree].slice(-MAX_HISTORY),
          future: futureCopy,
        },
      }
    })
    lastActionRef.current = null
    return result
  }, [])

  const getCanUndo = useCallback(
    (treeId: string) => {
      return (historyMap[treeId]?.past.length ?? 0) > 0
    },
    [historyMap],
  )

  const getCanRedo = useCallback(
    (treeId: string) => {
      return (historyMap[treeId]?.future.length ?? 0) > 0
    },
    [historyMap],
  )

  return {
    recordState,
    undo,
    redo,
    getCanUndo,
    getCanRedo,
  }
}
