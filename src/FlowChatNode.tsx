import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

export interface FlowChatNodeData {
  label: string
  preview: string
  role: 'user' | 'assistant'
}

function FlowChatNodeComponent({ data, selected }: NodeProps<FlowChatNodeData>) {
  const isUser = data.role === 'user'
  return (
    <>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 8, height: 8 }} />
      <div
        className="flow-chat-node"
        data-role={data.role}
        data-selected={selected ? 'true' : undefined}
        style={{
          padding: '6px 12px',
          borderRadius: 8,
          border: '2px solid',
          minWidth: 180,
          maxWidth: 220,
          background: isUser ? 'rgba(245, 158, 11, 0.1)' : 'rgba(56, 189, 248, 0.1)',
          borderColor: isUser ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.3)',
          boxShadow: selected ? '0 0 0 2px var(--bg), 0 0 0 4px rgba(245, 158, 11, 0.5)' : undefined,
        }}
      >
        <div className="flow-chat-node-label">{data.label}</div>
        <div className="flow-chat-node-preview">{data.preview}</div>
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 8, height: 8 }} />
      <style>{`
        .flow-chat-node-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted, #737373);
          font-weight: 500;
          margin-bottom: 2px;
        }
        .flow-chat-node-preview {
          font-size: 12px;
          color: #d4d4d4;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-family: 'JetBrains Mono', monospace;
        }
      `}</style>
    </>
  )
}

export const FlowChatNode = memo(FlowChatNodeComponent)
