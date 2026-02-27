export type Role = 'user' | 'assistant'

export interface ChatNode {
  id: string
  role: Role
  content: string
  parentId: string | null
  children: ChatNode[]
  createdAt: number
}

export interface BranchPath {
  nodeIds: string[]
}

export function getBranchPathToNode(root: ChatNode, targetId: string): string[] | null {
  if (root.id === targetId) return [root.id]
  for (const child of root.children) {
    const path = getBranchPathToNode(child, targetId)
    if (path) return [root.id, ...path]
  }
  return null
}

export function getLinearThread(root: ChatNode, path: string[]): ChatNode[] {
  const out: ChatNode[] = []
  for (const id of path) {
    const node = findNode(root, id)
    if (node) out.push(node)
  }
  return out
}

export function findNode(node: ChatNode, id: string): ChatNode | undefined {
  if (node.id === id) return node
  for (const child of node.children) {
    const found = findNode(child, id)
    if (found) return found
  }
  return undefined
}

export function nodeDepth(node: ChatNode, id: string, d = 0): number {
  if (node.id === id) return d
  for (const child of node.children) {
    const x = nodeDepth(child, id, d + 1)
    if (x >= 0) return x
  }
  return -1
}

/** Clone tree and add a new child to the node with the given id. Returns new root. */
export function addChildToNode(
  root: ChatNode,
  parentId: string,
  child: ChatNode
): ChatNode {
  function clone(n: ChatNode): ChatNode {
    const isTarget = n.id === parentId
    const newChildren = isTarget
      ? [...n.children, child]
      : n.children.map(clone)
    return {
      ...n,
      children: newChildren,
    }
  }
  return clone(root)
}

export function flattenNodes(root: ChatNode): ChatNode[] {
  const out: ChatNode[] = []
  const stack: ChatNode[] = [root]
  while (stack.length) {
    const n = stack.pop()!
    out.push(n)
    for (let i = n.children.length - 1; i >= 0; i--) {
      stack.push(n.children[i])
    }
  }
  return out
}
