import type { Node, Edge } from 'reactflow'
import type { ChatNode } from './types'

const DX = 240
const DY = 80

function flattenTree(
  node: ChatNode,
  x: number,
  y: number,
  nodes: Node[],
  edges: Edge[],
  parentId?: string
) {
  const id = node.id
  const label = node.role === 'user' ? 'You' : 'Assistant'
  const preview = node.content.slice(0, 40).replace(/\s+/g, ' ') + (node.content.length > 40 ? '…' : '')
  nodes.push({
    id,
    type: 'chatNode',
    position: { x, y },
    data: { label, preview, role: node.role },
  })
  if (parentId) {
    edges.push({ id: `${parentId}-${id}`, source: parentId, target: id })
  }
  node.children.forEach((child, i) => {
    flattenTree(child, x + DX, y + i * DY, nodes, edges, id)
  })
  return { nodes, edges }
}

export function treeToFlow(root: ChatNode): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  flattenTree(root, 0, 0, nodes, edges)
  return { nodes, edges }
}
