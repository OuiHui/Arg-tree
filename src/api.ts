import type { TreeState, WorkspaceState } from './argtree'
import { parseDeclarativeTree } from './utils/parseDeclarativeTree'

const STORAGE_KEY = 'argtree_workspace'

function loadFromLocalStorage(): WorkspaceState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.trees && Object.keys(parsed.trees).length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Failed to load workspace from local storage:', err)
  }
  return null
}

function saveToLocalStorage(workspace: WorkspaceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
  } catch (err) {
    console.warn('Failed to save workspace to local storage:', err)
  }
}

async function fetchStaticWorkspace(): Promise<WorkspaceState> {
  const local = loadFromLocalStorage()
  if (local) return local

  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`

  let filenames: string[] = ['free_will.json', 'objective_morality.json']
  try {
    const manifestRes = await fetch(`${baseUrl}trees/manifest.json`)
    if (manifestRes.ok) {
      filenames = await manifestRes.json()
    }
  } catch {
    // Fallback to default filenames
  }

  const trees: Record<string, TreeState> = {}

  for (const filename of filenames) {
    try {
      const res = await fetch(`${baseUrl}trees/${filename}`)
      if (res.ok) {
        const data = await res.json()
        const parsedTree = parseDeclarativeTree(data)
        trees[parsedTree.id] = parsedTree
      }
    } catch (err) {
      console.warn(`Failed to fetch static tree ${filename}:`, err)
    }
  }

  const treeIds = Object.keys(trees)
  const selectedTreeId = treeIds[0] || ''

  const staticWorkspace: WorkspaceState = {
    selectedTreeId,
    trees,
  }

  if (treeIds.length > 0) {
    saveToLocalStorage(staticWorkspace)
  }

  return staticWorkspace
}

export async function fetchWorkspaceApi(): Promise<WorkspaceState> {
  try {
    const response = await fetch('/api/workspace')
    if (response.ok) {
      return await response.json()
    }
  } catch {
    // API endpoint unreachable (e.g. static hosting on GitHub Pages)
  }

  return fetchStaticWorkspace()
}

export async function createTreeApi(tree: TreeState): Promise<void> {
  try {
    const response = await fetch('/api/trees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tree),
    })
    if (response.ok) return
  } catch {
    // Fallback to local storage
  }

  const local = loadFromLocalStorage()
  if (local) {
    local.trees[tree.id] = tree
    local.selectedTreeId = tree.id
    saveToLocalStorage(local)
  }
}

export async function updateTreeApi(tree: TreeState): Promise<void> {
  try {
    const response = await fetch(`/api/trees/${tree.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tree),
    })
    if (response.ok) return
  } catch {
    // Fallback to local storage
  }

  const local = loadFromLocalStorage()
  if (local) {
    local.trees[tree.id] = tree
    saveToLocalStorage(local)
  }
}

export async function deleteTreeApi(treeId: string): Promise<WorkspaceState> {
  try {
    const response = await fetch(`/api/trees/${treeId}`, {
      method: 'DELETE',
    })
    if (response.ok) {
      return await response.json()
    }
  } catch {
    // Fallback to local storage
  }

  const local = loadFromLocalStorage() || { selectedTreeId: '', trees: {} }
  delete local.trees[treeId]
  if (local.selectedTreeId === treeId) {
    local.selectedTreeId = Object.keys(local.trees)[0] || ''
  }
  saveToLocalStorage(local)
  return local
}

export async function updateSelectedTreeIdApi(selectedTreeId: string): Promise<void> {
  try {
    const response = await fetch('/api/workspace/selected', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedTreeId }),
    })
    if (response.ok) return
  } catch {
    // Fallback to local storage
  }

  const local = loadFromLocalStorage()
  if (local) {
    local.selectedTreeId = selectedTreeId
    saveToLocalStorage(local)
  }
}
