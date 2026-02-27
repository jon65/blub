import { useCallback } from 'react'
import type { ChatNode } from './types'

interface ThreadViewProps {
  thread: ChatNode[]
  path: string[]
  root: ChatNode
  tipNode?: ChatNode
  onPathChange: (path: string[]) => void
  onBranchFrom: (node: ChatNode) => void
}

export function ThreadView({
  thread,
  path,
  root,
  onPathChange,
  onBranchFrom,
}: ThreadViewProps) {
  const circleBackTo = useCallback(
    (nodeId: string) => {
      const branchPath = getPathToNode(root, nodeId)
      if (branchPath) onPathChange(branchPath)
    },
    [root, onPathChange]
  )

  return (
    <div className="thread-view">
      <div className="thread-scroll">
        {thread.map((node) => {
          const isTip = path[path.length - 1] === node.id
          return (
            <div
              key={node.id}
              className={`bubble ${node.role} ${isTip ? 'tip' : ''}`}
              data-id={node.id}
            >
              <div className="bubble-role">{node.role === 'user' ? 'You' : 'Assistant'}</div>
              <div className="bubble-content">{node.content}</div>
              <div className="bubble-actions">
                <button
                  type="button"
                  className="action"
                  onClick={() => circleBackTo(node.id)}
                  title="Circle back to this message"
                >
                  Go to here
                </button>
                <button
                  type="button"
                  className="action"
                  onClick={() => onBranchFrom(node)}
                  title="Focus this message (then add a branch from graph)"
                >
                  Branch from here
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <style>{`
        .thread-view {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--surface);
        }
        .thread-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .bubble {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid var(--line);
        }
        .bubble.user {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.25);
        }
        .bubble.assistant {
          background: rgba(56, 189, 248, 0.06);
          border-color: rgba(56, 189, 248, 0.2);
        }
        .bubble.tip {
          box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.4);
        }
        .bubble-role {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--muted);
          margin-bottom: 0.35rem;
        }
        .bubble-content {
          font-size: 0.9rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .bubble-actions {
          margin-top: 0.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .bubble .action {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: transparent;
          border: 1px solid var(--line);
          color: var(--muted);
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
        }
        .bubble .action:hover {
          color: var(--text);
          border-color: var(--text);
        }
      `}</style>
    </div>
  )
}

function getPathToNode(node: ChatNode, targetId: string): string[] | null {
  if (node.id === targetId) return [node.id]
  for (const child of node.children) {
    const path = getPathToNode(child, targetId)
    if (path) return [node.id, ...path]
  }
  return null
}
