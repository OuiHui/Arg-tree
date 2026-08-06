import type { DeclarativeTreeSpec } from '../utils/parseDeclarativeTree'

const treeModules = import.meta.glob<DeclarativeTreeSpec>('../../data/trees/*.json', {
  eager: true,
  import: 'default',
})

export function getPublicTreeSpecs(): DeclarativeTreeSpec[] {
  return Object.entries(treeModules)
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
    .map(([, spec]) => spec)
}
