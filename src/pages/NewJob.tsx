import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { useApiKey } from '../context/ApiKeyContext'
import { analyzeJob } from '../lib/jobAnalyzer'
import { saveJob } from '../lib/jobStorage'
import './NewJob.css'

export default function NewJob() {
  const { apiKey } = useApiKey()
  const navigate = useNavigate()
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rawResume = localStorage.getItem('blub_resume_raw') ?? ''
  const parsedResume = (() => {
    try { return JSON.parse(localStorage.getItem('blub_resume_parsed') ?? 'null') } catch { return null }
  })()
  const hasResume = rawResume.trim().length > 0
  const hasParsed = parsedResume !== null

  async function handleAnalyse() {
    if (!jd.trim() || !hasResume) return
    if (!hasParsed) { setError('Analyse your resume first so we can tailor it properly.'); return }
    if (!apiKey) { setError('Add your Claude API key in the sidebar first.'); return }

    setLoading(true)
    setError(null)

    try {
      const { analysis, coverLetter, tailoredResume, tailoredResumeParsed } = await analyzeJob(apiKey, rawResume, jd, parsedResume)
      const job = { id: uuid(), jobDescription: jd, addedAt: Date.now(), analysis, coverLetter, tailoredResume, tailoredResumeParsed }
      saveJob(job)
      navigate(`/jobs/${job.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed.')
      setLoading(false)
    }
  }

  if (!hasResume) {
    return (
      <div className="new-job-page">
        <h1 className="page-title">Analyse Job</h1>
        <div className="no-resume-notice">
          <p>You need a resume saved before analysing jobs.</p>
          <Link to="/resume" className="btn-primary">Add Resume →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="new-job-page">
      <div className="new-job-header">
        <Link to="/jobs" className="btn-ghost">← Jobs</Link>
        <h1 className="page-title">Analyse Job</h1>
        <p className="page-subtitle">Paste a job description and Claude will analyse your match, write a cover letter, and tailor your resume.</p>
      </div>

      <textarea
        className="jd-textarea"
        placeholder="Paste the job description here…"
        value={jd}
        onChange={e => setJd(e.target.value)}
        disabled={loading}
      />

      {error && <p className="error-text">{error}</p>}

      <div className="new-job-actions">
        <button
          className="btn-primary"
          onClick={handleAnalyse}
          disabled={!jd.trim() || loading}
        >
          {loading ? 'Analysing…' : 'Analyse Match →'}
        </button>
      </div>

      {loading && (
        <div className="analyse-status">
          <div className="spinner-sm" />
          <span>Running 3 analyses in parallel — match score, cover letter, tailored resume…</span>
        </div>
      )}
    </div>
  )
}
