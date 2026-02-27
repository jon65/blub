import { useCallback, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { FlowChatNode } from './FlowChatNode'
import { parseTranscript } from './parser'
import { getBranchPathToNode, getLinearThread, addChildToNode, type ChatNode } from './types'
import { treeToFlow } from './treeToFlow'
import { v4 as uuid } from 'uuid'
import { ThreadView } from './ThreadView'
import { ImportPanel } from './ImportPanel'
import { TopicsView } from './TopicsView'

const nodeTypes = { chatNode: FlowChatNode }

function getDefaultPath(root: ChatNode): string[] {
  const path: string[] = []
  let current: ChatNode | null = root
  while (current) {
    path.push(current.id)
    current = current.children[0] ?? null
  }
  return path
}

function App() {
  const [root, setRoot] = useState<ChatNode | null>(null)
  const [path, setPath] = useState<string[]>([])
  const [rightTab, setRightTab] = useState<'branch' | 'topics'>('branch')
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const loadTree = useCallback((newRoot: ChatNode) => {
    setRoot(newRoot)
    const defaultPath = getDefaultPath(newRoot)
    setPath(defaultPath)
    const { nodes: n, edges: e } = treeToFlow(newRoot)
    setNodes(n)
    setEdges(e)
  }, [setNodes, setEdges])

  const handleImport = useCallback((text: string) => {
    const parsed = parseTranscript(text)
    if (parsed) loadTree(parsed)
  }, [loadTree])

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (!root) return
    const branchPath = getBranchPathToNode(root, node.id)
    if (branchPath) setPath(branchPath)
  }, [root])

  const handleBranchFrom = useCallback(
    (node: ChatNode) => {
      if (!root) return
      const newChild: ChatNode = {
        id: uuid(),
        role: 'user',
        content: '(new branch — add your question here)',
        parentId: node.id,
        children: [],
        createdAt: Date.now(),
      }
      const newRoot = addChildToNode(root, node.id, newChild)
      const pathToNew = getBranchPathToNode(newRoot, newChild.id)
      if (!pathToNew) return
      setRoot(newRoot)
      setPath(pathToNew)
      const { nodes: n, edges: e } = treeToFlow(newRoot)
      setNodes(n)
      setEdges(e)
    },
    [root, setNodes, setEdges]
  )
  const thread = root ? getLinearThread(root, path) : []

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1 className="title">Blub</h1>
          <p className="subtitle">Branch your chat — circle back to any idea</p>
        </div>
        {root && (
          <button
            type="button"
            className="header-action"
            onClick={() => setRoot(null)}
          >
            Load another
          </button>
        )}
      </header>

      {!root ? (
        <ImportPanel onImport={handleImport} />
      ) : (
        <div className="main">
          <div className="flow-wrap">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              fitView
              className="flow"
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={12} size={1} color="var(--line)" />
              <Controls className="controls" />
              <MiniMap className="minimap" />
            </ReactFlow>
          </div>
          <div className="side">
            <div className="side-tabs">
              <button
                type="button"
                className={`side-tab ${rightTab === 'branch' ? 'active' : ''}`}
                onClick={() => setRightTab('branch')}
              >
                Branch
              </button>
              <button
                type="button"
                className={`side-tab ${rightTab === 'topics' ? 'active' : ''}`}
                onClick={() => setRightTab('topics')}
              >
                Topics
              </button>
            </div>
            <div className="side-body">
              {rightTab === 'branch' ? (
                <ThreadView
                  thread={thread}
                  path={path}
                  root={root}
                  onPathChange={setPath}
                  onBranchFrom={handleBranchFrom}
                />
              ) : (
                <TopicsView
                  root={root}
                  onJumpToPath={setPath}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .app {
          --bg: #0f0f0f;
          --surface: #161616;
          --line: #2a2a2a;
          --text: #e4e4e4;
          --muted: #737373;
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .header-action {
          font-size: 0.8rem;
          color: var(--muted);
          background: none;
          border: 1px solid var(--line);
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
        }
        .header-action:hover { color: var(--text); }
        .title {
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .subtitle {
          font-size: 0.8rem;
          color: var(--muted);
          margin: 0.25rem 0 0;
        }
        .main {
          display: grid;
          grid-template-columns: 1fr 400px;
          height: calc(100vh - 72px);
        }
        .side {
          display: flex;
          flex-direction: column;
          min-width: 0;
          height: 100%;
          background: var(--surface);
        }
        .side-tabs {
          display: flex;
          gap: 0.25rem;
          padding: 0.5rem;
          border-bottom: 1px solid var(--line);
          background: rgba(255,255,255,0.01);
        }
        .side-tab {
          flex: 1;
          padding: 0.45rem 0.75rem;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .side-tab.active {
          color: var(--text);
          border-color: rgba(245, 158, 11, 0.35);
          background: rgba(245, 158, 11, 0.08);
        }
        .side-body {
          flex: 1;
          min-height: 0;
        }
        .flow-wrap {
          position: relative;
          border-right: 1px solid var(--line);
        }
        .flow {
          background: var(--bg);
        }
        .flow .react-flow__controls {
          bottom: 12px;
          left: 12px;
        }
        .flow .react-flow__controls button {
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--line);
        }
        .flow .react-flow__controls button:hover {
          background: #1f1f1f;
        }
        .flow .react-flow__minimap {
          background: var(--surface);
          border-radius: 8px;
          border: 1px solid var(--line);
        }
      `}</style>
    </div>
  )
}

export default App
