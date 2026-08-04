---
description: Deepen and expand an existing argument tree with more sub-arguments, counter-rebuttals, and definitions
---

1. **Locate the Target Tree**: Identify the tree file in `data/trees/<topic_slug>.json` (or inspect active trees via database query).
2. **Analyze Expansion Opportunities**:
   - Identify existing nodes that lack deep evidence or sub-arguments.
   - Formulate strong counterarguments (`attack`) to support nodes, or counter-rebuttals (`targetRebuttalIndex`).
   - Identify specialized terminology requiring new entry items in `"definitions"`.
3. **Update Declarative JSON**: Add the new sub-branches and definitions into `data/trees/<topic_slug>.json`.
4. **Re-Import & Auto-Layout**: Copy the updated file to `public/trees/<topic_slug>.json` to sync static hosting, then run the importer script:

```bash
npm run import:tree data/trees/<topic_slug>.json
```
