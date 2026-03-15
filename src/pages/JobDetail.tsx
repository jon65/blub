import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { getJob, updateJob } from '../lib/jobStorage'
import { downloadResumePdf } from '../lib/downloadPdf'
import { JobChat } from '../components/JobChat'
import { StatusSelect } from '../components/StatusSelect'
import type { JobStatus } from '../types'
import './JobDetail.css'

function scoreColor(n: number) {
  if (n >= 70) return '#4ade80'
  if (n >= 50) return '#f59e0b'
  return '#f87171'
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function slug(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function InsightCard({ title, items, variant }: { title: string; items: string[]; variant: 'positive' | 'accent' | 'negative' }) {
  if (items.length === 0) return null
  return (
    <div className="insight-card" data-variant={variant}>
      <div className="insight-title">{title}</div>
      <ul className="insight-list">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  )
}

interface EditableSectionProps {
  title: string
  text: string
  filename: string
  onSave: (text: string) => void
  onDownloadPdf?: () => Promise<void>
}

function EditableSection({ title, text, filename, onSave, onDownloadPdf }: EditableSectionProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  // Sync draft when text updated externally (e.g. chat applies a proposal)
  useEffect(() => {
    if (!editing) setDraft(text)
  }, [text, editing])

  function save() { onSave(draft); setEditing(false) }
  function cancel() { setDraft(text); setEditing(false) }

  async function handleDownloadPdf() {
    if (!onDownloadPdf) return
    setPdfLoading(true)
    try { await onDownloadPdf() } finally { setPdfLoading(false) }
  }

  return (
    <section className="text-section">
      <div className="text-section-header">
        <h2 className="section-heading">{title}</h2>
        <div className="text-section-actions">
          {editing ? (
            <>
              <button className="btn-ghost-sm" onClick={cancel}>Cancel</button>
              <button className="btn-accent-sm" onClick={save}>Save</button>
            </>
          ) : (
            <>
              <button className="btn-ghost-sm" onClick={() => { setDraft(text); setEditing(true) }}>Edit</button>
              <button className="btn-ghost-sm" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn-ghost-sm" onClick={() => downloadText(filename, text)}>
                Download .txt
              </button>
              {onDownloadPdf && (
                <button className="btn-ghost-sm" onClick={handleDownloadPdf} disabled={pdfLoading}>
                  {pdfLoading ? 'Generating…' : 'Download PDF'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {editing ? (
        <textarea
          className="edit-textarea"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          autoFocus
          spellCheck={false}
        />
      ) : (
        <pre className="text-content">{text}</pre>
      )}
    </section>
  )
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const job = getJob(id!)
  if (!job) return <Navigate to="/jobs" replace />
  return <JobDetailView job={job} />
}

function JobDetailView({ job }: { job: NonNullable<ReturnType<typeof getJob>> }) {
  const { analysis, tailoredResumeParsed } = job
  const color = scoreColor(analysis.matchScore)

  const [status, setStatus] = useState<JobStatus>(job.status ?? 'todo')
  const [coverLetter, setCoverLetter] = useState(job.coverLetter)
  const [tailoredResume, setTailoredResume] = useState(job.tailoredResume)

  function handleStatusChange(s: JobStatus) {
    setStatus(s)
    updateJob(job.id, { status: s })
  }

  function handleUpdateCoverLetter(text: string) {
    setCoverLetter(text)
    updateJob(job.id, { coverLetter: text })
  }

  function handleUpdateResume(text: string) {
    setTailoredResume(text)
    updateJob(job.id, { tailoredResume: text })
  }

  async function handleDownloadResumePdf() {
    await downloadResumePdf(tailoredResumeParsed, `resume-${slug(analysis.role)}.pdf`)
  }

  return (
    <>
      <div className="job-detail">
        <div className="detail-header">
          <Link to="/jobs" className="btn-ghost-sm">← Jobs</Link>
          <div className="detail-title-row">
            <div>
              <h1 className="page-title">{analysis.role}</h1>
              {analysis.companyName && <p className="detail-company">{analysis.companyName}</p>}
            </div>
            <StatusSelect status={status} onChange={handleStatusChange} />
          </div>
        </div>

        {/* Match score */}
        <div className="match-card">
          <div className="match-score-row">
            <span className="match-score-num" style={{ color }}>{analysis.matchScore}</span>
            <span className="match-score-label">% match</span>
          </div>
          <div className="match-bar-track">
            <div className="match-bar-fill" style={{ width: `${analysis.matchScore}%`, background: color }} />
          </div>
          <p className="match-summary">{analysis.matchSummary}</p>
        </div>

        {/* Insights */}
        <div className="insight-grid">
          <InsightCard title="Advantages" items={analysis.advantages} variant="positive" />
          <InsightCard title="Standout Skills" items={analysis.standoutSkills} variant="accent" />
          <InsightCard title="Weaknesses" items={analysis.weaknesses} variant="negative" />
        </div>

        {/* Editable documents */}
        <EditableSection
          title="Cover Letter"
          text={coverLetter}
          filename={`cover-letter-${slug(analysis.role)}.txt`}
          onSave={handleUpdateCoverLetter}
        />
        <EditableSection
          title="Tailored Resume"
          text={tailoredResume}
          filename={`resume-${slug(analysis.role)}.txt`}
          onSave={handleUpdateResume}
          onDownloadPdf={handleDownloadResumePdf}
        />
      </div>

      {/* Floating chat */}
      <JobChat
        job={job}
        currentCoverLetter={coverLetter}
        currentResume={tailoredResume}
        onUpdateCoverLetter={handleUpdateCoverLetter}
        onUpdateResume={handleUpdateResume}
      />
    </>
  )
}
