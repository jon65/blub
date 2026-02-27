import { useMemo, useState } from 'react'
import type { ChatNode } from './types'
import { flattenNodes, getBranchPathToNode } from './types'
import { clusterConversationTopics } from './topicCluster'

interface TopicsViewProps {
  root: ChatNode
  onJumpToPath: (path: string[]) => void
}

export function TopicsView({ root, onJumpToPath }: TopicsViewProps) {
  const all = useMemo(() => flattenNodes(root), [root])
  const [k, setK] = useState<number>(() => Math.min(6, Math.max(2, Math.round(Math.sqrt(all.length / 2))))) // initial

  const clusters = useMemo(() => {
    return clusterConversationTopics(all, { k })
  }, [all, k])

  return (
    <div className="topics">
      <div className="topics-controls">
        <div className="topics-title">Topics</div>
        <div className="topics-k">
          <span className="topics-k-label">Clusters</span>
          <input
            type="range"
            aria-label="Number of topic clusters"
            min={2}
            max={Math.min(10, Math.max(2, all.length))}
            value={Math.min(k, Math.min(10, Math.max(2, all.length)))}
            onChange={(e) => setK(Number(e.target.value))}
          />
          <span className="topics-k-value">{k}</span>
        </div>
      </div>

      <div className="topics-scroll">
        {clusters.length === 0 ? (
          <div className="topics-empty">No messages to cluster yet.</div>
        ) : (
          clusters.map((c) => (
            <TopicClusterCard
              key={c.id}
              cluster={c}
              allById={all}
              onJump={(nodeId) => {
                const p = getBranchPathToNode(root, nodeId)
                if (p) onJumpToPath(p)
              }}
            />
          ))
        )}
      </div>

      <style>{`
        .topics {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--surface);
        }
        .topics-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--line);
        }
        .topics-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
        }
        .topics-k {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--muted);
          font-size: 0.8rem;
        }
        .topics-k-label { opacity: 0.9; }
        .topics-k input[type='range'] { width: 140px; }
        .topics-k-value {
          min-width: 1.5rem;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
        .topics-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .topics-empty {
          color: var(--muted);
          font-size: 0.9rem;
          padding: 0.5rem;
        }
      `}</style>
    </div>
  )
}

function TopicClusterCard({
  cluster,
  allById,
  onJump,
}: {
  cluster: { label: string; nodeIds: string[] }
  allById: ChatNode[]
  onJump: (nodeId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const nodes = useMemo(() => {
    const map = new Map(allById.map((n) => [n.id, n] as const))
    return cluster.nodeIds.map((id) => map.get(id)).filter(Boolean) as ChatNode[]
  }, [allById, cluster.nodeIds])

  const shown = expanded ? nodes : nodes.slice(0, 5)

  return (
    <div className="topic-card">
      <button type="button" className="topic-head" onClick={() => setExpanded((v) => !v)}>
        <div className="topic-label">{cluster.label}</div>
        <div className="topic-meta">
          <span>{cluster.nodeIds.length} msgs</span>
          <span className="topic-chevron">{expanded ? '▾' : '▸'}</span>
        </div>
      </button>
      <div className="topic-items">
        {shown.map((n) => (
          <button key={n.id} type="button" className="topic-item" onClick={() => onJump(n.id)}>
            <span className={`pill ${n.role}`}>{n.role === 'user' ? 'You' : 'Asst'}</span>
            <span className="topic-item-text">{preview(n.content)}</span>
          </button>
        ))}
        {!expanded && nodes.length > 5 && (
          <button type="button" className="topic-more" onClick={() => setExpanded(true)}>
            Show {nodes.length - 5} more…
          </button>
        )}
      </div>
      <style>{`
        .topic-card {
          border: 1px solid var(--line);
          border-radius: 10px;
          overflow: hidden;
          background: rgba(255,255,255,0.02);
        }
        .topic-head {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          padding: 0.75rem 0.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          cursor: pointer;
        }
        .topic-label {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text);
          line-height: 1.2;
        }
        .topic-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--muted);
          flex-shrink: 0;
        }
        .topic-items {
          padding: 0.25rem 0.5rem 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .topic-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.5rem;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          color: var(--text);
          text-align: left;
        }
        .topic-item:hover {
          border-color: var(--line);
          background: rgba(255,255,255,0.03);
        }
        .pill {
          font-size: 0.7rem;
          padding: 0.1rem 0.35rem;
          border-radius: 999px;
          border: 1px solid var(--line);
          color: var(--muted);
          flex-shrink: 0;
        }
        .pill.user { border-color: rgba(245, 158, 11, 0.3); color: rgba(245, 158, 11, 0.9); }
        .pill.assistant { border-color: rgba(56, 189, 248, 0.25); color: rgba(56, 189, 248, 0.9); }
        .topic-item-text {
          font-size: 0.85rem;
          color: #d4d4d4;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .topic-more {
          margin-top: 0.25rem;
          align-self: flex-start;
          font-size: 0.8rem;
          background: transparent;
          color: var(--muted);
          border: none;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
        }
        .topic-more:hover { color: var(--text); }
      `}</style>
    </div>
  )
}

function preview(s: string) {
  const one = s.replace(/\s+/g, ' ').trim()
  return one.length > 120 ? one.slice(0, 120) + '…' : one
}

