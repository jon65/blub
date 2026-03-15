import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getJobs, updateJob } from '../lib/jobStorage'
import { StatusSelect } from '../components/StatusSelect'
import type { JobStatus } from '../types'
import './Jobs.css'

function scoreColor(n: number) {
  if (n >= 70) return '#4ade80'
  if (n >= 50) return '#f59e0b'
  return '#f87171'
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Jobs() {
  const [jobs, setJobs] = useState(() => getJobs())

  function handleStatusChange(id: string, status: JobStatus) {
    updateJob(id, { status })
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j))
  }

  return (
    <div className="jobs-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="page-subtitle">Your job match analyses.</p>
        </div>
        <Link to="/jobs/new" className="btn-primary">Analyse New Job</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <p className="empty-text">No analyses yet.</p>
          <Link to="/jobs/new" className="empty-link">Analyse your first job →</Link>
        </div>
      ) : (
        <div className="jobs-list">
          {jobs.map(job => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="job-card">
              <div className="job-card-info">
                <div className="job-role">{job.analysis.role}</div>
                {job.analysis.companyName && (
                  <div className="job-company">{job.analysis.companyName}</div>
                )}
              </div>
              <div className="job-card-right">
                <StatusSelect
                  status={job.status ?? 'todo'}
                  onChange={s => handleStatusChange(job.id, s)}
                />
                <span className="match-pill" style={{ color: scoreColor(job.analysis.matchScore), borderColor: scoreColor(job.analysis.matchScore) }}>
                  {job.analysis.matchScore}% match
                </span>
                <span className="job-date">{formatDate(job.addedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
