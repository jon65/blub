import { useCallback, useRef, useState } from 'react'

interface ImportPanelProps {
  onImport: (text: string) => void
}

export function ImportPanel({ onImport }: ImportPanelProps) {
  const [paste, setPaste] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePasteSubmit = useCallback(() => {
    const t = paste.trim()
    if (!t) {
      setError('Paste some transcript text first.')
      return
    }
    setError(null)
    onImport(t)
  }, [paste, onImport])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = String(reader.result ?? '')
        if (text.trim()) onImport(text)
        setError(null)
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [onImport]
  )

  return (
    <div className="import-panel">
      <div className="import-card">
        <h2>Load a chat transcript</h2>
        <p className="import-hint">
          Paste a Cursor-style transcript (lines starting with <code>user:</code> and{' '}
          <code>assistant:</code>) or upload a .txt file.
        </p>
        <textarea
          className="import-textarea"
          placeholder="user:&#10;What is the capital of France?&#10;&#10;assistant:&#10;Paris."
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          rows={8}
        />
        {error && <p className="import-error">{error}</p>}
        <div className="import-actions">
          <button type="button" className="btn primary" onClick={handlePasteSubmit}>
            Load from paste
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.jsonl,text/*"
            className="hidden"
            aria-label="Upload transcript file"
            onChange={handleFileChange}
          />
        </div>
      </div>
      <style>{`
        .import-panel {
          padding: 2rem;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          min-height: 60vh;
        }
        .import-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 1.5rem;
          max-width: 520px;
          width: 100%;
        }
        .import-card h2 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }
        .import-hint {
          font-size: 0.85rem;
          color: var(--muted);
          margin: 0 0 1rem;
        }
        .import-hint code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8em;
          background: rgba(255,255,255,0.06);
          padding: 0.1em 0.35em;
          border-radius: 4px;
        }
        .import-textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 0.75rem;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          resize: vertical;
          margin-bottom: 0.75rem;
        }
        .import-textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .import-error {
          color: #f87171;
          font-size: 0.85rem;
          margin: 0 0 0.75rem;
        }
        .import-actions {
          display: flex;
          gap: 0.5rem;
        }
        .btn {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          font-family: inherit;
        }
        .btn.primary {
          background: #f59e0b;
          color: #0f0f0f;
        }
        .btn.primary:hover { background: #eab308; }
        .btn.secondary {
          background: var(--line);
          color: var(--text);
        }
        .btn.secondary:hover { background: #333; }
        .hidden { position: absolute; opacity: 0; pointer-events: none; }
      `}</style>
    </div>
  )
}
