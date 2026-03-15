import { useEffect, useRef, useState } from 'react'
import { useApiKey } from '../context/ApiKeyContext'
import { streamJobChat, parseResponse } from '../lib/jobChat'
import { updateJob } from '../lib/jobStorage'
import type { ChatMessage, JobRecord } from '../types'
import './JobChat.css'

const SUGGESTED_PROMPTS = [
  'How can I better position my resume for this role?',
  'Rewrite the cover letter to sound more natural',
  'What skills should I highlight more prominently?',
  'What would a hiring manager flag as concerns?',
  'I have extra experience to add — can you help include it?',
]

interface Props {
  job: JobRecord
  currentCoverLetter: string
  currentResume: string
  onUpdateCoverLetter: (text: string) => void
  onUpdateResume: (text: string) => void
}

export function JobChat({ job, currentCoverLetter, currentResume, onUpdateCoverLetter, onUpdateResume }: Props) {
  const { apiKey } = useApiKey()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => job.chatHistory ?? [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<Record<number, 'cover' | 'resume' | null>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [isOpen, messages.length])

  async function send(content: string) {
    if (!content.trim() || loading) return
    if (!apiKey) { setError('Add your API key in the sidebar.'); return }

    const userMsg: ChatMessage = { role: 'user', content }
    const historyForRequest = [...messages, userMsg]

    setMessages([...historyForRequest, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)
    setError(null)

    let fullText = ''

    try {
      await streamJobChat(
        apiKey,
        job.jobDescription,
        currentCoverLetter,
        currentResume,
        historyForRequest,
        (chunk) => {
          fullText += chunk
          setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: fullText }])
        },
      )

      const parsed = parseResponse(fullText)
      const finalMsg: ChatMessage = {
        role: 'assistant',
        content: parsed.content,
        proposedCoverLetter: parsed.proposedCoverLetter,
        proposedResume: parsed.proposedResume,
      }
      const finalMessages = [...historyForRequest, finalMsg]
      setMessages(finalMessages)
      updateJob(job.id, { chatHistory: finalMessages })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setMessages(historyForRequest)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  function applyProposal(idx: number, type: 'cover' | 'resume', text: string) {
    if (type === 'cover') onUpdateCoverLetter(text)
    else onUpdateResume(text)
    setApplied(prev => ({ ...prev, [idx]: type }))
  }

  const isEmpty = messages.length === 0

  return (
    <>
      {/* Floating button */}
      <button
        className={`chat-fab${isOpen ? ' is-open' : ''}`}
        onClick={() => setIsOpen(v => !v)}
        aria-label="Chat with Claude"
      >
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        )}
      </button>

      {/* Chat panel */}
      <div className={`chat-panel${isOpen ? ' is-open' : ''}`}>
        <div className="chat-panel-header">
          <div>
            <div className="chat-panel-title">Ask Claude</div>
            <div className="chat-panel-subtitle">{job.analysis.role}{job.analysis.companyName ? ` · ${job.analysis.companyName}` : ''}</div>
          </div>
          <button className="chat-panel-close" onClick={() => setIsOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="chat-messages-wrap">
          {isEmpty ? (
            <div className="suggested-wrap">
              <p className="suggested-label">Suggested prompts</p>
              <div className="suggested-list">
                {SUGGESTED_PROMPTS.map(p => (
                  <button key={p} className="suggested-chip" onClick={() => send(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
                  {msg.content && <p className="chat-msg-text">{msg.content}</p>}
                  {msg.proposedCoverLetter && (
                    <div className="proposal-card">
                      <span className="proposal-label">Updated Cover Letter</span>
                      <button
                        className={`proposal-apply${applied[i] === 'cover' ? ' applied' : ''}`}
                        onClick={() => applyProposal(i, 'cover', msg.proposedCoverLetter!)}
                        disabled={applied[i] === 'cover'}
                      >
                        {applied[i] === 'cover' ? 'Applied ✓' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {msg.proposedResume && (
                    <div className="proposal-card">
                      <span className="proposal-label">Updated Resume</span>
                      <button
                        className={`proposal-apply${applied[i] === 'resume' ? ' applied' : ''}`}
                        onClick={() => applyProposal(i, 'resume', msg.proposedResume!)}
                        disabled={applied[i] === 'resume'}
                      >
                        {applied[i] === 'resume' ? 'Applied ✓' : 'Apply'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {error && <p className="chat-error">{error}</p>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask about this job, request edits…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={3}
          />
          <button
            className="chat-send"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <div className="chat-spinner" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
