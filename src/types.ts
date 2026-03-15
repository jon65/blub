export interface ResumeExperience {
  company: string
  role: string
  period: string
  bullets: string[]
}

export interface ResumeEducation {
  institution: string
  degree: string
  year?: string | null
}

export interface ResumeProject {
  name: string
  description: string
  tech?: string[]
}

export interface ParsedResume {
  name?: string | null
  email?: string | null
  phone?: string | null
  summary?: string | null
  experience: ResumeExperience[]
  education: ResumeEducation[]
  skills: string[]
  projects: ResumeProject[]
}

export interface JobMatchAnalysis {
  matchScore: number
  matchSummary: string
  role: string
  companyName: string | null
  advantages: string[]
  standoutSkills: string[]
  weaknesses: string[]
}

export type JobStatus = 'todo' | 'applied' | 'ghosted' | 'rejected'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  proposedCoverLetter?: string
  proposedResume?: string
}

export interface JobRecord {
  id: string
  jobDescription: string
  addedAt: number
  analysis: JobMatchAnalysis
  coverLetter: string
  tailoredResume: string
  tailoredResumeParsed: ParsedResume
  status?: JobStatus
  chatHistory?: ChatMessage[]
}
