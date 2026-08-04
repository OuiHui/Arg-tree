# argTree

> An interactive visual argument mapping and dialectical tree workspace for structuring, analyzing, and exploring complex debates.

---

## Overview

**argTree** is a modern web application built to visualize, map, and decompose complex arguments and debates into intuitive hierarchical trees and graph structures. Whether exploring philosophical questions (such as Free Will & Determinism), technical policy tradeoffs, or multi-faceted debates, **argTree** provides clear visual distinction between claims, supporting arguments, and attacking counter-rebuttals.

---

## Features

- **Interactive Canvas & Graph Visualizer**: Drag, pan, zoom, and rearrange nodes with smooth auto-layout and automatic curve rendering.
- **Dialectical Node Stances**: Categorize arguments into **Claims**, **Support** (green), and **Attack / Rebuttal** (red) stances.
- **Cross-Branch Connections**: Draw directed relationships across separate subtrees to represent counter-rebuttals, cross-cutting evidence, or shared premises.
- **Focus & Subtree Dimming**: Focus on a single argument node to highlight its ancestors, descendants, and direct connections while fading out non-relevant nodes.
- **Glossary & Definitions Drawer**: Attach definitions, term breakdowns, and key conceptual explanations directly to individual trees.
- **Multi-Tree Workspace Manager**: Create, search, duplicate, export, and delete multiple argument maps from a centralized workspace drawer.
- **Full Undo / Redo Engine**: Comprehensive history stack for spatial moves, node edits, and tree restructuring.
- **URL Synchronization**: Share direct links to specific trees via URL parameter syncing.
- **Hybrid Backend Persistence**: RESTful Express API backed by MongoDB, with automatic fallback to an in-memory store if MongoDB is not present.
- **CLI Import Utility**: Script to batch import structured JSON argument trees into the backend.

---

## Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Graph & Flow Engine**: [@xyflow/react](https://reactflow.dev/)
- **Styling**: Modern CSS with CSS Variables & Glassmorphism design tokens

### Backend & Database
- **Server**: [Express 5](https://expressjs.com/) (Node.js)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose 9](https://mongoosejs.com/)
- **Orchestration**: `concurrently` & `wait-on` for synchronous full-stack execution

---

## Repository Structure

```text
argTree/
├── data/
│   └── trees/             # Seed JSON trees (e.g. Free Will & Determinism)
├── server/
│   ├── models/            # Mongoose schemas (Tree, WorkspaceConfig)
│   ├── scripts/           # Import CLI utilities (importTree.js)
│   ├── db.js              # MongoDB connection handler with fallback detection
│   ├── index.js           # REST API routes & server logic
│   └── seed.js            # Initial dataset seeding logic
├── src/
│   ├── components/        # React components (WorkspaceStage, ArgumentNode, Header, etc.)
│   ├── hooks/             # Custom hooks (useWorkspace, useUndoRedo, useUrlTreeSync)
│   ├── styles/            # CSS files & styling rules
│   ├── types/             # TypeScript definitions (argtree.ts)
│   ├── utils/             # Tree manipulation & auto-layout algorithms
│   ├── api.ts             # API client functions
│   ├── App.tsx            # Core App component
│   └── main.tsx           # Application entry point
├── package.json           # Scripts & dependency configuration
└── vite.config.ts         # Vite build configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher recommended)
- **MongoDB** (Optional; if not running, argTree runs seamlessly using the in-memory store)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/OuiHui/Arg-tree.git
   cd Arg-tree
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure environment variables:
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/argtree
   ```

### Running Locally

Start both the backend Express API server and the Vite development frontend concurrently:

```bash
npm run dev
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## Available Scripts

- **`npm run dev`**: Launches both Express backend server and Vite frontend concurrently.
- **`npm run server`**: Runs the Express backend server (`server/index.js`).
- **`npm run build`**: Runs TypeScript type checking and compiles Vite production assets to `dist/`.
- **`npm run preview`**: Previews the production build locally.
- **`npm run lint`**: Runs ESLint across the codebase.
- **`npm run import:tree`**: Runs the JSON tree importer CLI script (`server/scripts/importTree.js`).

---

## API Overview

The Express backend exposes RESTful endpoints for workspace management:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/workspace` | Retrieves current workspace state and all argument trees. |
| `POST` | `/api/trees` | Creates a new argument tree. |
| `PUT` | `/api/trees/:id` | Updates an existing tree (nodes, positions, definitions). |
| `DELETE` | `/api/trees/:id` | Deletes a tree by ID. |
| `PUT` | `/api/workspace/selected` | Updates the active selected tree ID. |

