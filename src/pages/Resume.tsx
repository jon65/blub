import { useRef, useState } from 'react'
import { useApiKey } from '../context/ApiKeyContext'
import { parseResume } from '../lib/resumeParser'
import { downloadResumePdf } from '../lib/downloadPdf'
import type { ParsedResume } from '../types'
import './Resume.css'

const STORAGE_RAW = 'blub_resume_raw'
const STORAGE_PARSED = 'blub_resume_parsed'

function loadParsed(): ParsedResume | null {
  try {
    const s = localStorage.getItem(STORAGE_PARSED)
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

export default function Resume() {
  const { apiKey } = useApiKey()
  const [view, setView] = useState<'edit' | 'profile'>(() => (loadParsed() ? 'profile' : 'edit'))
  const [rawText, setRawText] = useState(() => localStorage.getItem(STORAGE_RAW) ?? '')
  const [parsed, setParsed] = useState<ParsedResume | null>(loadParsed)
  const [extracting, setExtracting] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    setExtracting(true)
    setError(null)
    try {
      let text = ''
      if (ext === 'pdf') {
        const { extractPdfText } = await import('../pdfExtract')
        text = await extractPdfText(file)
      } else if (ext === 'docx') {
        const mammoth = await import('mammoth')
        const buf = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer: buf })
        text = result.value
      } else {
        throw new Error('Only PDF and .docx files are supported.')
      }
      setRawText(text)
      localStorage.setItem(STORAGE_RAW, text)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read file.')
    } finally {
      setExtracting(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function analyse() {
    if (!rawText.trim()) return
    if (!apiKey) { setError('Add your Claude API key in the sidebar.'); return }
    setAnalysing(true)
    setError(null)
    try {
      const result = await parseResume(apiKey, rawText)
      setParsed(result)
      localStorage.setItem(STORAGE_PARSED, JSON.stringify(result))
      setView('profile')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed.')
    } finally {
      setAnalysing(false)
    }
  }

  // ── Edit view ──────────────────────────────────────────────────────────────
  if (view === 'edit') {
    return (
      <div className="resume-page">
        <div className="page-header">
          <h1 className="page-title">Resume</h1>
          {parsed && (
            <button className="btn-ghost" onClick={() => setView('profile')}>
              View profile →
            </button>
          )}
        </div>

        <div
          className={`drop-zone${dragging ? ' dragging' : ''}${extracting ? ' loading' : ''}`}
          onClick={() => !extracting && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={onFileChange} />
          {extracting
            ? <><div className="spinner-sm" /><span>Reading file…</span></>
            : <><span className="drop-icon">↑</span><span>Drop PDF or .docx here, or <u>click to upload</u></span></>
          }
        </div>

        {error && <p className="error-text">{error}</p>}

        <textarea
          className="resume-textarea"
          placeholder="Resume text will appear here after upload — or paste directly…"
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value)
            localStorage.setItem(STORAGE_RAW, e.target.value)
          }}
          spellCheck={false}
        />

        <div className="edit-actions">
          <button
            className="btn-primary"
            onClick={analyse}
            disabled={!rawText.trim() || analysing}
          >
            {analysing ? 'Analysing…' : 'Analyse Resume →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Profile view ───────────────────────────────────────────────────────────
  if (!parsed) return null

  return (
    <div className="resume-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{parsed.name ?? 'Resume'}</h1>
          <div className="contact-row">
            {parsed.email && <span>{parsed.email}</span>}
            {parsed.phone && <span>{parsed.phone}</span>}
          </div>
        </div>
        <div className="profile-actions">
          <button
            className="btn-ghost"
            onClick={() => downloadResumePdf(parsed, `${(parsed.name ?? 'resume').toLowerCase().replace(/\s+/g, '-')}.pdf`)}
          >
            Download PDF
          </button>
          <button className="btn-ghost" onClick={() => setView('edit')}>Edit resume</button>
        </div>
      </div>

      {parsed.summary && (
        <p className="resume-summary">{parsed.summary}</p>
      )}

      <div className="resume-sections">
        {parsed.experience.length > 0 && (
          <section className="resume-section">
            <h2 className="section-heading">Experience</h2>
            <div className="experience-list">
              {parsed.experience.map((exp, i) => (
                <div key={i} className="exp-item">
                  <div className="exp-header">
                    <div>
                      <div className="exp-role">{exp.role}</div>
                      <div className="exp-company">{exp.company}</div>
                    </div>
                    <div className="exp-period">{exp.period}</div>
                  </div>
                  {exp.bullets.length > 0 && (
                    <ul className="exp-bullets">
                      {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {parsed.education.length > 0 && (
          <section className="resume-section">
            <h2 className="section-heading">Education</h2>
            <div className="education-list">
              {parsed.education.map((edu, i) => (
                <div key={i} className="edu-item">
                  <div className="edu-degree">{edu.degree}</div>
                  <div className="edu-meta">{edu.institution}{edu.year ? ` · ${edu.year}` : ''}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {parsed.skills.length > 0 && (
          <section className="resume-section">
            <h2 className="section-heading">Skills</h2>
            <div className="skills-list">
              {parsed.skills.map((s, i) => <span key={i} className="skill-tag">{s}</span>)}
            </div>
          </section>
        )}

        {parsed.projects.length > 0 && (
          <section className="resume-section">
            <h2 className="section-heading">Projects</h2>
            <div className="projects-list">
              {parsed.projects.map((proj, i) => (
                <div key={i} className="proj-item">
                  <div className="proj-name">{proj.name}</div>
                  <p className="proj-desc">{proj.description}</p>
                  {proj.tech && proj.tech.length > 0 && (
                    <div className="proj-tech">
                      {proj.tech.map((t, j) => <span key={j} className="tech-tag">{t}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
