import Anthropic from '@anthropic-ai/sdk'
import type { ParsedResume } from '../types'

const SYSTEM = `You are a resume parser. Extract structured information from resume text.
Return ONLY a valid JSON object — no markdown fences, no explanation, nothing else.`

const SCHEMA = `{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "summary": "string or null",
  "experience": [
    { "company": "string", "role": "string", "period": "string", "bullets": ["string"] }
  ],
  "education": [
    { "institution": "string", "degree": "string", "year": "string or null" }
  ],
  "skills": ["string"],
  "projects": [
    { "name": "string", "description": "string", "tech": ["string"] }
  ]
}`

export async function parseResume(apiKey: string, rawText: string): Promise<ParsedResume> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Parse this resume and return the JSON object matching this schema:\n${SCHEMA}\n\nRESUME:\n${rawText}`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')

  try {
    return JSON.parse(block.text) as ParsedResume
  } catch {
    throw new Error('Failed to parse Claude response as JSON.')
  }
}
