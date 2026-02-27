import type { ChatNode } from './types'
import { v4 as uuid } from 'uuid'

type Block = { role: 'user' | 'assistant'; content: string }

/**
 * Parse various chat log formats into a linear thread (one branch):
 * 1. Cursor-style: lines "user:" / "assistant:" then content
 * 2. Section separators: "---" splits segments; alternating assistant/user
 * 3. Fallback: entire text as one assistant message
 */
export function parseTranscript(text: string): ChatNode | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  let blocks = parseExplicitRoles(trimmed)
  if (blocks.length === 0) {
    blocks = parseSectionSeparators(trimmed)
  }
  if (blocks.length === 0) {
    blocks = [{ role: 'assistant' as const, content: trimmed }]
  }

  return buildTree(blocks)
}

/** Cursor-style: "user:" / "assistant:" on their own line, then content. */
function parseExplicitRoles(text: string): Block[] {
  const blocks: Block[] = []
  const lines = text.split(/\r?\n/)
  let currentRole: 'user' | 'assistant' | null = null
  let currentContent: string[] = []

  const flush = () => {
    if (currentRole && currentContent.length) {
      blocks.push({ role: currentRole, content: currentContent.join('\n').trim() })
      currentContent = []
    }
  }

  for (const line of lines) {
    const userMatch = /^user:\s*$/i.exec(line)
    const assistantMatch = /^assistant:\s*$/i.exec(line)
    if (userMatch) {
      flush()
      currentRole = 'user'
    } else if (assistantMatch) {
      flush()
      currentRole = 'assistant'
    } else if (currentRole) {
      currentContent.push(line)
    }
  }
  flush()
  return blocks
}

/** Split on "---" (horizontal rule); segments alternate assistant, user, assistant, ... */
function parseSectionSeparators(text: string): Block[] {
  const parts = text.split(/\n\s*---\s*\n/).map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return []
  return parts.map((content, i) => ({
    role: (i % 2 === 0 ? 'assistant' : 'user') as 'user' | 'assistant',
    content,
  }))
}

function buildTree(blocks: Block[]): ChatNode {
  const now = Date.now()
  let root: ChatNode | null = null
  let parent: ChatNode | null = null

  for (const block of blocks) {
    const node: ChatNode = {
      id: uuid(),
      role: block.role,
      content: block.content,
      parentId: parent?.id ?? null,
      children: [],
      createdAt: now,
    }
    if (!root) {
      root = node
    } else if (parent) {
      parent.children.push(node)
    }
    parent = node
  }

  return root!
}
