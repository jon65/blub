export type AppView = 'input' | 'results'
export type ResultTab = 'resume' | 'cover'

export interface JobApplicationState {
  resumeText: string
  jobDescription: string
  companyName: string
  tailoredResume: string
  coverLetter: string
}
