import type { TreeState, WorkspaceState } from './argtree'

export async function fetchWorkspaceApi(): Promise<WorkspaceState> {
  const response = await fetch('/api/workspace')
  if (!response.ok) {
    throw new Error(`Failed to fetch workspace: ${response.statusText}`)
  }
  return response.json()
}

export async function createTreeApi(tree: TreeState): Promise<void> {
  const response = await fetch('/api/trees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tree),
  })
  if (!response.ok) {
    throw new Error(`Failed to create tree: ${response.statusText}`)
  }
}

export async function updateTreeApi(tree: TreeState): Promise<void> {
  const response = await fetch(`/api/trees/${tree.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tree),
  })
  if (!response.ok) {
    throw new Error(`Failed to update tree: ${response.statusText}`)
  }
}

export async function deleteTreeApi(treeId: string): Promise<WorkspaceState> {
  const response = await fetch(`/api/trees/${treeId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Failed to delete tree: ${response.statusText}`)
  }
  return response.json()
}

export async function updateSelectedTreeIdApi(selectedTreeId: string): Promise<void> {
  const response = await fetch('/api/workspace/selected', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectedTreeId }),
  })
  if (!response.ok) {
    throw new Error(`Failed to update selected tree ID: ${response.statusText}`)
  }
}
