import '@xyflow/react/dist/style.css'
import './App.css'
import { ReactFlowProvider } from '@xyflow/react'
import { useWorkspace } from './hooks/useWorkspace'
import { Header } from './components/Header'
import { WorkspaceStage } from './components/WorkspaceStage'
import { NewTreeModal } from './components/NewTreeModal'
import { TreeManagerModal } from './components/TreeManagerModal'

function App() {
  const {
    isLoading,
    selectedTree,
    treeList,
    editingNodeId,
    selectedEdgeId,
    definitionsCollapsed,
    isNewTreeModalOpen,
    isTreeManagerOpen,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    setIsNewTreeModalOpen,
    setIsTreeManagerOpen,
    setEditingNodeId,
    handleSelectTreeId,
    handleEditNode,
    updateNodeText,
    addBranchFromNode,
    addConnection,
    linkChildNode,
    handleAutoLayout,
    updateNodePosition,
    addDefinition,
    createTree,
    handleSelectNode,
    deleteEdge,
    deleteNode,
    deleteDefinition,
    deleteTree,
    deleteMultipleTrees,
    renameTree,
    duplicateTree,
    cleanUpEmptyTrees,
    setSelectedEdgeId,
    setDefinitionsCollapsed,
  } = useWorkspace()

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading workspace...</p>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <div className="app-layout">
        <Header
          treeList={treeList}
          selectedTreeId={selectedTree.id}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSelectTreeId={handleSelectTreeId}
          onRenameTree={renameTree}
          onOpenNewTreeModal={() => setIsNewTreeModalOpen(true)}
          onOpenTreeManager={() => setIsTreeManagerOpen(true)}
          onAutoLayout={handleAutoLayout}
          onDeleteTree={deleteTree}
        />

        <WorkspaceStage
          selectedTree={selectedTree}
          editingNodeId={editingNodeId}
          onEditNode={handleEditNode}
          onStopEditingNode={() => setEditingNodeId(null)}
          onUpdateNodeText={updateNodeText}
          onDeleteNode={deleteNode}
          onSelectNode={handleSelectNode}
          onAddBranchFromNode={addBranchFromNode}
          onAddConnection={addConnection}
          onLinkChildNode={linkChildNode}
          definitionsCollapsed={definitionsCollapsed}
          onToggleDefinitionsCollapsed={() => setDefinitionsCollapsed((prev) => !prev)}
          onUpdateNodePosition={updateNodePosition}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={setSelectedEdgeId}
          onDeleteEdge={deleteEdge}
          onAddDefinition={addDefinition}
          onDeleteDefinition={deleteDefinition}
        />

        <NewTreeModal
          isOpen={isNewTreeModalOpen}
          onClose={() => setIsNewTreeModalOpen(false)}
          onCreateTree={createTree}
        />

        <TreeManagerModal
          isOpen={isTreeManagerOpen}
          treeList={treeList}
          selectedTreeId={selectedTree.id}
          onClose={() => setIsTreeManagerOpen(false)}
          onSelectTree={handleSelectTreeId}
          onRenameTree={renameTree}
          onDuplicateTree={duplicateTree}
          onDeleteTree={deleteTree}
          onDeleteMultipleTrees={deleteMultipleTrees}
          onCleanUpEmptyTrees={cleanUpEmptyTrees}
          onOpenNewTreeModal={() => setIsNewTreeModalOpen(true)}
        />
      </div>
    </ReactFlowProvider>
  )
}

export default App
