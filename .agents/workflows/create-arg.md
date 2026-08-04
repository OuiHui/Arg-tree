---
description: Use the app to create an expansive argument exploring a topic
---

1. **Analyze the Topic**: For the main claim, formulate the strongest supporting arguments (`support`), counterarguments (`attack`), sub-arguments, cross-rebuttals, and key philosophical/technical definitions.
2. **Write Declarative JSON**: Create a declarative tree JSON file in `data/trees/<topic_slug>.json` using the following schema:

```json
{
  "title": "Topic Title",
  "rootClaim": "Central claim statement...",
  "branches": [
    {
      "text": "Supporting or attacking claim text...",
      "stance": "support", // or "attack"
      "children": [
        {
          "text": "Sub-claim text...",
          "stance": "support",
          "targetRebuttalIndex": "0.0" // optional cross-link to another branch by index path
        }
      ]
    }
  ],
  "definitions": [
    {
      "term": "Term Name",
      "description": "Definition text..."
    }
  ]
}
```

3. **Seed Database & Workspace**: Run the importer script to automatically assign UUIDs, compute 2D layout coordinates, and seed MongoDB:

```bash
npm run import:tree data/trees/<topic_slug>.json
```