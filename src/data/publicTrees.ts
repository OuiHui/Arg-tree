import type { DeclarativeTreeSpec } from '../utils/parseDeclarativeTree'

const treeModules = import.meta.glob<string>('./trees/*.json', {
  query: '?raw',
  eager: true,
  import: 'default',
})

export function getPublicTreeSpecs(): DeclarativeTreeSpec[] {
  return Object.values(treeModules)
    .map((raw) => {
      try {
        return typeof raw === 'string' ? (JSON.parse(raw) as DeclarativeTreeSpec) : (raw as unknown as DeclarativeTreeSpec)
      } catch {
        return null
      }
    })
    .filter((spec): spec is DeclarativeTreeSpec => Boolean(spec && spec.title))
}
