import Anthropic from '@anthropic-ai/sdk'
import type { ChatMessage } from '../types'

function buildSystem(jobDescription: string, coverLetter: string, resumeText: string): string {
  return `You are a career advisor helping a candidate refine their job application.

CURRENT JOB DESCRIPTION:
${jobDescription}

CURRENT COVER LETTER:
${coverLetter}

CURRENT TAILORED RESUME:
${resumeText}

INSTRUCTIONS:
- Give specific, actionable advice grounded in the candidate's actual materials
- If asked to rewrite or improve the cover letter: briefly explain what you changed (1–2 sentences), then output the full new cover letter wrapped exactly like this:
<<<COVER_LETTER>>>
[full cover letter text]
<<<END>>>
- If asked to rewrite, update, or add to the resume: briefly explain the change, then output the full new resume text wrapped exactly like this:
<<<RESUME>>>
[full resume text]
<<<END>>>
- If the user mentions new experience or skills to add, incorporate them authentically — do not invent details beyond what they describe
- Be direct and honest about what will and won't improve their chances
- Never output both document blocks in the same response unless the user explicitly asks for both`
}

export function parseResponse(text: string): {
  content: string
  proposedCoverLetter?: string
  proposedResume?: string
} {
  let content = text
  let proposedCoverLetter: string | undefined
  let proposedResume: string | undefined

  const coverMatch = text.match(/<<<COVER_LETTER>>>\n?([\s\S]+?)<<<END>>>/)
  if (coverMatch) {
    proposedCoverLetter = coverMatch[1].trim()
    content = content.replace(coverMatch[0], '').trim()
  }

  const resumeMatch = text.match(/<<<RESUME>>>\n?([\s\S]+?)<<<END>>>/)
  if (resumeMatch) {
    proposedResume = resumeMatch[1].trim()
    content = content.replace(resumeMatch[0], '').trim()
  }

  return { content, proposedCoverLetter, proposedResume }
}

export async function streamJobChat(
  apiKey: string,
  jobDescription: string,
  coverLetter: string,
  resumeText: string,
  history: ChatMessage[],
  onChunk: (text: string) => void,
): Promise<void> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: buildSystem(jobDescription, coverLetter, resumeText),
    messages: history.map(m => ({ role: m.role, content: m.content })),
  })

  stream.on('text', onChunk)
  await stream.finalMessage()
}
