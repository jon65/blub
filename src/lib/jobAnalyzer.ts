import Anthropic from '@anthropic-ai/sdk'
import type { JobMatchAnalysis, ParsedResume } from '../types'

const ANALYSIS_SYSTEM = `You are a senior hiring manager and career advisor with 20+ years of experience across tech, finance, and operations. Assess candidate fit with brutal honesty. Be specific and evidence-based — no generic phrases. If a candidate has a genuine standout quality versus typical applicants, say so clearly. If they have real gaps, name them directly.`

const COVER_SYSTEM = `You are an expert cover letter writer. Write authentic, specific cover letters that sound human. Avoid: "I am excited to apply", "I am passionate about", "dynamic team", "fast-paced environment". Ground every claim in the candidate's actual experience.`

const TAILOR_SYSTEM = `You are an expert resume writer specialising in ATS optimisation and role-specific positioning. Your job is to make the candidate's real experience resonate as strongly as possible for a specific role — without fabricating anything.`

const ANALYSIS_SCHEMA = `{
  "matchScore": integer 0–100,
  "matchSummary": "2–3 sentences: direct, honest overall assessment of fit",
  "role": "job title extracted from description",
  "companyName": "company name from description, or null",
  "advantages": ["specific advantage backed by resume evidence — 3 to 5 items"],
  "standoutSkills": ["genuinely distinctive quality vs typical applicants — empty array if none"],
  "weaknesses": ["honest gap or risk a hiring manager would flag — 2 to 4 items"]
}`

const PARSED_RESUME_SCHEMA = `{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "summary": "string or null",
  "experience": [{ "company": "string", "role": "string", "period": "string", "bullets": ["string"] }],
  "education": [{ "institution": "string", "degree": "string", "year": "string or null" }],
  "skills": ["string"],
  "projects": [{ "name": "string", "description": "string", "tech": ["string"] }]
}`

function tailorPrompt(parsedResume: ParsedResume, jobDescription: string): string {
  return `Tailor the candidate's resume for the job description below. Follow every rule precisely:

TAILORING RULES:
1. Rewrite "summary" to open with this specific role and mirror the JD's top priorities — keep it to 2–3 sentences
2. For each experience entry: reorder bullets so the most JD-relevant ones are first; rewrite bullet language to use exact terminology from the JD wherever it accurately describes what the candidate did (do not change the facts, only the framing and word choice)
3. Reorder "skills" so skills explicitly named in the JD appear first
4. Do NOT add experience, credentials, or skills not present in the original
5. Do NOT remove any experience entries — reframe, never delete
6. Preserve all original dates, company names, and job titles exactly

Return ONLY valid JSON matching this schema — no markdown fences, no commentary:
${PARSED_RESUME_SCHEMA}

CANDIDATE'S RESUME (structured):
${JSON.stringify(parsedResume, null, 2)}

JOB DESCRIPTION:
${jobDescription}`
}

export async function analyzeJob(
  apiKey: string,
  rawResume: string,
  jobDescription: string,
  parsedResume: ParsedResume,
): Promise<{ analysis: JobMatchAnalysis; coverLetter: string; tailoredResume: string; tailoredResumeParsed: ParsedResume }> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const [analysisRes, coverRes, tailorRes] = await Promise.all([
    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: ANALYSIS_SYSTEM,
      messages: [{
        role: 'user',
        content: `Analyze the fit between this candidate and the job. Return ONLY valid JSON matching this schema:\n${ANALYSIS_SCHEMA}\n\nRESUME:\n${rawResume}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      }],
    }),
    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: COVER_SYSTEM,
      messages: [{
        role: 'user',
        content: `Write a 3–4 paragraph cover letter for this candidate. Be specific, cite their actual work.\n\nRESUME:\n${rawResume}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      }],
    }),
    client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: TAILOR_SYSTEM,
      messages: [{ role: 'user', content: tailorPrompt(parsedResume, jobDescription) }],
    }),
  ])

  const analysisBlock = analysisRes.content[0]
  const coverBlock = coverRes.content[0]
  const tailorBlock = tailorRes.content[0]

  if (analysisBlock.type !== 'text' || coverBlock.type !== 'text' || tailorBlock.type !== 'text') {
    throw new Error('Unexpected response type from Claude.')
  }

  let analysis: JobMatchAnalysis
  try {
    const json = analysisBlock.text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    analysis = JSON.parse(json)
  } catch {
    throw new Error('Failed to parse match analysis. Try again.')
  }

  let tailoredResumeParsed: ParsedResume
  try {
    const json = tailorBlock.text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    tailoredResumeParsed = JSON.parse(json)
  } catch {
    throw new Error('Failed to parse tailored resume. Try again.')
  }

  // Produce a readable plain-text version from the structured data for preview/copy
  const tailoredResume = structuredToText(tailoredResumeParsed)

  return { analysis, coverLetter: coverBlock.text, tailoredResume, tailoredResumeParsed }
}

function structuredToText(r: ParsedResume): string {
  const lines: string[] = []
  if (r.name) lines.push(r.name)
  const contact = [r.email, r.phone].filter(Boolean).join('  |  ')
  if (contact) lines.push(contact)
  if (r.summary) { lines.push('', r.summary) }

  if (r.experience.length > 0) {
    lines.push('', 'EXPERIENCE')
    for (const exp of r.experience) {
      lines.push('', `${exp.role} — ${exp.company}  (${exp.period})`)
      for (const b of exp.bullets) lines.push(`  • ${b}`)
    }
  }
  if (r.education.length > 0) {
    lines.push('', 'EDUCATION')
    for (const edu of r.education) {
      lines.push(`${edu.degree}, ${edu.institution}${edu.year ? `  (${edu.year})` : ''}`)
    }
  }
  if (r.skills.length > 0) {
    lines.push('', 'SKILLS')
    lines.push(r.skills.join('  ·  '))
  }
  if (r.projects.length > 0) {
    lines.push('', 'PROJECTS')
    for (const p of r.projects) {
      lines.push('', p.name)
      lines.push(p.description)
      if (p.tech?.length) lines.push(p.tech.join(', '))
    }
  }
  return lines.join('\n')
}
