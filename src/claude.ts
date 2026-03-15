import Anthropic from '@anthropic-ai/sdk'

export async function tailorResume(
  apiKey: string,
  resume: string,
  jobDescription: string,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system:
      'You are an expert resume writer. Tailor the provided resume to the job description by reordering and reframing existing experience, highlighting relevant skills, and using keywords from the job description. Never fabricate experience, credentials, or skills not present in the original resume. Return only the full rewritten resume text, no commentary.',
    messages: [
      {
        role: 'user',
        content: `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nReturn the tailored resume.`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text
}

export async function generateCoverLetter(
  apiKey: string,
  resume: string,
  jobDescription: string,
  companyName?: string,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const company = companyName ? `at ${companyName}` : 'for this role'

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system:
      'You are an expert career coach and professional writer. Write compelling, authentic cover letters that connect the candidate\'s real experience to the specific role. Be concise and genuine — avoid clichés. Return only the cover letter text, no commentary.',
    messages: [
      {
        role: 'user',
        content: `Write a 3–4 paragraph cover letter ${company} based on this resume and job description.\n\nRESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return block.text
}
