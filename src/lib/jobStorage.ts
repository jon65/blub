import type { JobRecord } from '../types'

const KEY = 'blub_jobs'

export function getJobs(): JobRecord[] {
  try {
    const s = localStorage.getItem(KEY)
    return s ? JSON.parse(s) : []
  } catch { return [] }
}

export function getJob(id: string): JobRecord | null {
  return getJobs().find(j => j.id === id) ?? null
}

export function saveJob(job: JobRecord): void {
  const jobs = getJobs().filter(j => j.id !== job.id)
  localStorage.setItem(KEY, JSON.stringify([job, ...jobs]))
}

export function updateJob(id: string, updates: Partial<JobRecord>): void {
  const jobs = getJobs()
  const idx = jobs.findIndex(j => j.id === id)
  if (idx >= 0) {
    jobs[idx] = { ...jobs[idx], ...updates }
    localStorage.setItem(KEY, JSON.stringify(jobs))
  }
}

export function deleteJob(id: string): void {
  const jobs = getJobs().filter(j => j.id !== id)
  localStorage.setItem(KEY, JSON.stringify(jobs))
}
