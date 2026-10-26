import { useEffect, useRef, useState } from 'react'
import type { DragEvent, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { apiFetch } from '../api/apiFetch'
import { ANALYSIS_LOADING_MESSAGES } from '../constant/analysis'
import ReportView from '../components/ReportView'
import type { AnalysisResult } from '../types'
import './ResumeAnalysisPage.css'

const MAX_SIZE = 2 * 1024 * 1024

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

function validateFile(file: File): string {
  if (!/\.(pdf|docx)$/i.test(file.name)) return 'Only PDF and DOCX files are supported.'
  if (file.size > MAX_SIZE) return 'Please upload a file under 2 MB.'
  return ''
}

type ResumeAnalysisPageProps = {
  onResult: (result: AnalysisResult | null) => void
  initialResult: AnalysisResult | null
  token: string | null
}

export default function ResumeAnalysisPage({ onResult, initialResult, token }: ResumeAnalysisPageProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const interval = window.setInterval(() => {
      setLoadingStep((current) => (current + 1) % ANALYSIS_LOADING_MESSAGES.length)
    }, 1100)
    return () => window.clearInterval(interval)
  }, [loading])

  const pickFile = (next: File | null) => {
    if (!next) {
      setFile(null)
      setError('')
      return
    }
    const problem = validateFile(next)
    setFile(problem ? null : next)
    setError(problem)
  }

  const clearFile = () => {
    pickFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (loading) return
    pickFile(event.dataTransfer.files?.[0] ?? null)
  }

  const handleZoneKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Choose a PDF or DOCX resume to continue.')
      return
    }
    const problem = validateFile(file)
    if (problem) {
      setError(problem)
      return
    }

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await apiFetch<AnalysisResult>('/api/v1/resume-analysis/analyze', {
        method: 'POST',
        body: formData,
      }, token)
      onResult(result)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 429) {
        setError('You have reached your current analysis limit. Please try again after your limit resets.')
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Unable to analyze this resume. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }
const STEPS = ['Upload', 'Analyze', 'Report']
const currentStep = initialResult ? 2 : loading ? 1 : 0
  return (
    <div className="page-shell ra-page">
      <header className="ra-header">
  <h2>Get a detailed resume review</h2>
  <ul className="ra-chips">
    <li>PDF or DOCX</li>
    <li>Max 2 MB</li>
    <li>Results in under a minute</li>
  </ul>
</header>

<nav className="ra-topbar" aria-label="Analysis progress">
  <ol className="ra-steps">
    {STEPS.map((label, index) => (
      <li
        key={label}
        className={index < currentStep ? 'is-done' : index === currentStep ? 'is-current' : ''}
        aria-current={index === currentStep ? 'step' : undefined}
      >
        <span className="ra-step-num">{index < currentStep ? '✓' : index + 1}</span>
        {label}
      </li>
    ))}
  </ol>
  <span className="ra-topbar-status">
    {initialResult ? `${initialResult.overallScore}% · ${initialResult.scoreLabel}` : file ? file.name : 'No file selected'}
  </span>
</nav>

      <section className="ra-upload">
        <div
          className={`ra-dropzone${dragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}${loading ? ' is-loading' : ''}`}
          role="button"
          tabIndex={loading ? -1 : 0}
          aria-label="Upload your resume. Click or drop a file."
          onClick={() => !loading && !file && inputRef.current?.click()}
          onKeyDown={handleZoneKey}
          onDragOver={(event) => { event.preventDefault(); if (!loading) setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            className="ra-input"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
            tabIndex={-1}
          />

          {loading ? (
            <div className="scan-status" role="status" aria-live="polite">
              <div className="scan-frame">
                <span className="scan-corner scan-corner-tl" />
                <span className="scan-corner scan-corner-tr" />
                <span className="scan-corner scan-corner-bl" />
                <span className="scan-corner scan-corner-br" />
                <span className="scan-document-mark">CV</span>
              </div>
              <p className="ra-loading-text">{ANALYSIS_LOADING_MESSAGES[loadingStep]}</p>
            </div>
          ) : file ? (
            <div className="ra-file">
              <span className="ra-file-icon" aria-hidden="true">{file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'}</span>
              <div className="ra-file-meta">
                <strong>{file.name}</strong>
                <span>{formatSize(file.size)} · ready to analyze</span>
              </div>
              <button
                type="button"
                className="ra-remove"
                onClick={(event) => { event.stopPropagation(); clearFile() }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="ra-empty">
              <span className="ra-upload-icon" aria-hidden="true">↑</span>
              <strong>{dragging ? 'Drop it here' : 'Drag your resume here'}</strong>
              <span>or <u>browse files</u> · text-based PDF or DOCX</span>
            </div>
          )}
        </div>

        {error ? <div className="ra-error" role="alert">{error}</div> : null}

        <button type="button" className="ra-analyze" onClick={() => void handleAnalyze()} disabled={loading || !file}>
          {loading ? 'Analyzing…' : 'Analyze resume'} <span aria-hidden="true">↗</span>
        </button>
      </section>

      <div className="ra-results">
        {initialResult ? (
          <>
            <ReportView result={initialResult} />
            {!token ? (
              <section className="ra-register">
                <div>
                  <span className="mono-label">SAVE YOUR PROGRESS</span>
                  <h3>Register for saved reports</h3>
                  <p>Create an account to keep your analysis history and access career-management tools.</p>
                </div>
                <button type="button" className="ra-analyze" onClick={() => navigate('/auth')}>Create account</button>
              </section>
            ) : null}
          </>
        ) : (
          <div className="ra-placeholder">
            <span className="mono-label">YOUR REPORT WILL APPEAR HERE</span>
            <div className="ra-ghost-grid" aria-hidden="true">
              <i className="g1" /><i className="g2" /><i className="g3" /><i className="g4" /><i className="g5" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}