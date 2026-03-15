import { useEffect, useRef, useState } from 'react'
import type { JobStatus } from '../types'
import './StatusSelect.css'

export const STATUS_CONFIG: Record<JobStatus, { label: string; color: string }> = {
  todo:     { label: 'To Do',    color: '#78716c' },
  applied:  { label: 'Applied',  color: '#f59e0b' },
  ghosted:  { label: 'Ghosted',  color: '#fb923c' },
  rejected: { label: 'Rejected', color: '#f87171' },
}

interface Props {
  status: JobStatus
  onChange: (status: JobStatus) => void
}

export function StatusSelect({ status, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const cfg = STATUS_CONFIG[status]

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function select(s: JobStatus, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onChange(s)
    setOpen(false)
  }

  function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setOpen(v => !v)
  }

  return (
    <div className="status-select" ref={ref}>
      <button
        className="status-badge"
        style={{ color: cfg.color, borderColor: cfg.color }}
        onClick={toggle}
      >
        <span className="status-dot" style={{ background: cfg.color }} />
        {cfg.label}
        <svg className="status-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="status-dropdown">
          {(Object.keys(STATUS_CONFIG) as JobStatus[]).map(s => {
            const c = STATUS_CONFIG[s]
            return (
              <button
                key={s}
                className={`status-option${s === status ? ' active' : ''}`}
                onClick={(e) => select(s, e)}
              >
                <span className="status-dot" style={{ background: c.color }} />
                {c.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
