import { useEffect, type Dispatch, type SetStateAction } from 'react'
import type { WorkspaceState } from '../types/argtree'

export function useUrlTreeSync(
  workspace: WorkspaceState,
  setWorkspace: Dispatch<SetStateAction<WorkspaceState>>,
  isLoading: boolean
) {
  useEffect(() => {
    if (isLoading || !workspace.selectedTreeId) return
    const url = new URL(window.location.href)
    if (url.searchParams.get('treeId') !== workspace.selectedTreeId) {
      url.searchParams.set('treeId', workspace.selectedTreeId)
      window.history.pushState({}, '', url.toString())
    }
  }, [workspace.selectedTreeId, isLoading])

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const urlTreeId = params.get('treeId') || params.get('tree')
      if (urlTreeId && workspace.trees[urlTreeId]) {
        setWorkspace((current) => {
          if (current.trees[urlTreeId] && current.selectedTreeId !== urlTreeId) {
            return { ...current, selectedTreeId: urlTreeId }
          }
          return current
        })
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [workspace.trees, setWorkspace])
}
