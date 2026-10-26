import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api/apiFetch'
import { formatDate } from '../utils/format'
import type { AnalysisResult } from '../types'
import './AnalysisHistoryPage.css'

type AnalysisHistoryPageProps = {
  token: string
}

const clean = (value: string) => value.replaceAll('_', ' ')

export default function AnalysisHistoryPage({ token }: AnalysisHistoryPageProps) {
  const [reports, setReports] = useState<AnalysisResult[]>([])
  const [selectedReport, setSelectedReport] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const items = await apiFetch<AnalysisResult[]>('/api/v1/resume-analysis', {}, token)
      setReports(items)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load your analysis history.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const openReport = async (id: number) => {
    setError('')
    try {
      const report = await apiFetch<AnalysisResult>(`/api/v1/resume-analysis/${id}`, {}, token)
      setSelectedReport(report)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to open this report.')
    }
  }

  const deleteReport = async (id: number) => {
    if (!window.confirm('Delete this saved analysis permanently?')) return

    setError('')
    try {
      await apiFetch<void>(`/api/v1/resume-analysis/${id}`, { method: 'DELETE' }, token)
      setReports((current) => current.filter((report) => report.id !== id))
      if (selectedReport?.id === id) setSelectedReport(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete this report.')
    }
  }

  return (
    <div className="page-shell ah-page">
      <header className="ah-header">
        <div>
          <p className="ah-status"><span aria-hidden="true" /> SAVED REPORTS</p>
          <h2>Analysis history</h2>
        </div>
        <button type="button" className="ah-btn" onClick={() => void loadHistory()} disabled={loading}>
          Refresh
        </button>
      </header>

      {error ? <div className="ah-error" role="alert">{error}</div> : null}

      {loading ? (
        <div className="ah-empty"><p className="ah-label">LOADING REPORTS…</p></div>
      ) : reports.length === 0 ? (
        <div className="ah-empty">
          <p className="ah-label">NOTHING SAVED YET</p>
          <h3>No saved analyses yet</h3>
          <p>Run an analysis while signed in and it will appear here.</p>
        </div>
      ) : (
        <div className="ah-table-wrap">
          <table className="ah-table">
            <thead>
              <tr><th>Resume</th><th>Score</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="ah-file">{report.originalFilename}</td>
                  <td>
                    <span className="ah-score">{report.overallScore}%</span>
                    <span className="ah-score-label">{clean(report.scoreLabel)}</span>
                  </td>
                  <td>{formatDate(report.createdAt)}</td>
                  <td>
                    <div className="ah-actions">
                      <button type="button" className="ah-btn" onClick={() => report.id !== null && void openReport(report.id)}>Open</button>
                      <button type="button" className="ah-btn ah-btn-danger" onClick={() => report.id !== null && void deleteReport(report.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport ? (
        <section className="ah-detail" aria-label="Report detail">
          <div className="ah-detail-head">
            <div>
              <p className="ah-label">REPORT DETAIL</p>
              <h3>{selectedReport.originalFilename} · <b>{selectedReport.overallScore}%</b></h3>
            </div>
            <button type="button" className="ah-btn" onClick={() => setSelectedReport(null)}>Close</button>
          </div>

          <div className="ah-section">
            <h4>Summary</h4>
            <p>{selectedReport.report.summary}</p>
          </div>

          {selectedReport.report.parameters.length > 0 ? (
            <div className="ah-section">
              <h4>Score breakdown</h4>
              <div>
                {selectedReport.report.parameters.map((parameter) => (
                  <div className="ah-entry" key={parameter.parameter}>
                    <p><strong>{clean(parameter.parameter)} · {parameter.score}%</strong></p>
                    <p>{parameter.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {selectedReport.report.issues.map((issue, index) => (
            <div className="ah-section" key={`${issue.parameter}-${index}`}>
              <h4>{clean(issue.parameter)}</h4>
              <div>
                <p>{issue.problem}</p>
                <p><strong>Fix:</strong> {issue.fix}</p>
                {issue.rewrite ? <p><strong>Suggested rewrite:</strong> {issue.rewrite}</p> : null}
              </div>
            </div>
          ))}

          {selectedReport.report.missingMaterial.length > 0 ? (
            <div className="ah-section">
              <h4>Missing material</h4>
              <div>
                {selectedReport.report.missingMaterial.map((item) => (
                  <div className="ah-entry" key={item.type}>
                    <p><strong>{clean(item.type)}</strong></p>
                    <p>{item.whyItMatters}</p>
                    <p><strong>How to add it:</strong> {item.howToAdd}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {selectedReport.report.actionPlan.length > 0 ? (
            <div className="ah-section">
              <h4>Action plan</h4>
              <div>
                {selectedReport.report.actionPlan.map((action) => (
                  <div className="ah-entry" key={`${action.priority}-${action.title}`}>
                    <p><strong>{action.priority}. {action.title} · {action.impact}</strong></p>
                    <p>{action.details} {action.timeEstimate ? `(${action.timeEstimate})` : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}