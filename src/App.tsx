import '@xyflow/react/dist/style.css'
import './App.css'
import { ReactFlowProvider } from '@xyflow/react'
import { useWorkspace } from './hooks/useWorkspace'
import { Header } from './components/Header'
import { WorkspaceStage } from './components/WorkspaceStage'
import { NewTreeModal } from './components/NewTreeModal'

function App() {
  const {
    isLoading,
    selectedTree,
    treeList,
    editingNodeId,
    selectedEdgeId,
    definitionsCollapsed,
    isNewTreeModalOpen,
    setIsNewTreeModalOpen,
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
    resetWorkspace,
    handleSelectNode,
    deleteEdge,
    deleteNode,
    deleteDefinition,
    deleteTree,
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
          onSelectTreeId={handleSelectTreeId}
          onOpenNewTreeModal={() => setIsNewTreeModalOpen(true)}
          onAutoLayout={handleAutoLayout}
          onResetWorkspace={resetWorkspace}
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
      </div>
    </ReactFlowProvider>
  )
}

export default App
