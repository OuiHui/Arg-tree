import type { TreeState, WorkspaceState } from './argtree'
import { getPublicTreeSpecs } from './data/publicTrees'
import { parseDeclarativeTree } from './utils/parseDeclarativeTree'

const STORAGE_KEY = 'argtree_workspace'

function getApiBaseUrl(): string | null {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  if (configuredBaseUrl) {
    return configuredBaseUrl.endsWith('/') ? configuredBaseUrl : `${configuredBaseUrl}/`
  }

  // Keep local development working with the Vite proxy, but avoid making
  // doomed API requests on static deployments such as GitHub Pages.
  if (import.meta.env.DEV) {
    return '/api/'
  }

  return null
}

function buildApiUrl(path: string): string | null {
  const baseUrl = getApiBaseUrl()
  if (!baseUrl) return null
  return new URL(path.replace(/^\//, ''), baseUrl).toString()
}

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

export function deduplicateWorkspaceTrees(workspace: WorkspaceState): WorkspaceState {
  const treeList = Object.values(workspace.trees)
  if (treeList.length <= 1) return workspace

  const groupedByTitle: Record<string, TreeState[]> = {}
  treeList.forEach((tree) => {
    const key = tree.title.trim().toLowerCase()
    if (!groupedByTitle[key]) groupedByTitle[key] = []
    groupedByTitle[key].push(tree)
  })

  const keptTrees: Record<string, TreeState> = {}
  const removedIds: string[] = []

  Object.values(groupedByTitle).forEach((trees) => {
    if (trees.length === 1) {
      keptTrees[trees[0].id] = trees[0]
      return
    }

    let bestTree = trees[0]
    for (const tree of trees) {
      if (tree.id === workspace.selectedTreeId) {
        bestTree = tree
        break
      }
      const currentBestCount = Object.keys(bestTree.nodes).length
      const treeNodeCount = Object.keys(tree.nodes).length
      if (treeNodeCount > currentBestCount) {
        bestTree = tree
      }
    }

    keptTrees[bestTree.id] = bestTree
    trees.forEach((t) => {
      if (t.id !== bestTree.id) {
        removedIds.push(t.id)
      }
    })
  })

  if (removedIds.length === 0) return workspace

  let selectedTreeId = workspace.selectedTreeId
  if (!keptTrees[selectedTreeId]) {
    selectedTreeId = Object.keys(keptTrees)[0] || selectedTreeId
  }

  const updated: WorkspaceState = {
    selectedTreeId,
    trees: keptTrees,
  }

  saveToLocalStorage(updated)
  return updated
}

async function fetchStaticWorkspace(): Promise<WorkspaceState> {
  const local = loadFromLocalStorage()
  if (local) return deduplicateWorkspaceTrees(local)

  const treeSpecs = getPublicTreeSpecs()

  const trees: Record<string, TreeState> = {}

  for (const spec of treeSpecs) {
    try {
      const parsedTree = parseDeclarativeTree(spec)
      trees[parsedTree.id] = parsedTree
    } catch (err) {
      console.warn(`Failed to parse static tree ${spec.title}:`, err)
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

  return deduplicateWorkspaceTrees(staticWorkspace)
}

export async function fetchWorkspaceApi(): Promise<WorkspaceState> {
  const workspaceUrl = buildApiUrl('workspace')
  if (!workspaceUrl) {
    return fetchStaticWorkspace()
  }

  try {
    const response = await fetch(workspaceUrl)
    if (response.ok) {
      const workspace = await response.json()
      return deduplicateWorkspaceTrees(workspace)
    }
  } catch {
    // API endpoint unreachable (e.g. static hosting on GitHub Pages)
  }

  return fetchStaticWorkspace()
}

export async function createTreeApi(tree: TreeState): Promise<void> {
  const createTreeUrl = buildApiUrl('trees')
  if (!createTreeUrl) {
    const local = loadFromLocalStorage()
    if (local) {
      local.trees[tree.id] = tree
      local.selectedTreeId = tree.id
      saveToLocalStorage(local)
    }
    return
  }

  try {
    const response = await fetch(createTreeUrl, {
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
  const updateTreeUrl = buildApiUrl(`trees/${tree.id}`)
  if (!updateTreeUrl) {
    const local = loadFromLocalStorage()
    if (local) {
      local.trees[tree.id] = tree
      saveToLocalStorage(local)
    }
    return
  }

  try {
    const response = await fetch(updateTreeUrl, {
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
  const deleteTreeUrl = buildApiUrl(`trees/${treeId}`)
  if (!deleteTreeUrl) {
    const local = loadFromLocalStorage() || { selectedTreeId: '', trees: {} }
    delete local.trees[treeId]
    if (local.selectedTreeId === treeId) {
      local.selectedTreeId = Object.keys(local.trees)[0] || ''
    }
    saveToLocalStorage(local)
    return local
  }

  try {
    const response = await fetch(deleteTreeUrl, {
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
  const updateSelectedUrl = buildApiUrl('workspace/selected')
  if (!updateSelectedUrl) {
    const local = loadFromLocalStorage()
    if (local) {
      local.selectedTreeId = selectedTreeId
      saveToLocalStorage(local)
    }
    return
  }

  try {
    const response = await fetch(updateSelectedUrl, {
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
