import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api/apiFetch'
import { formatDate } from '../utils/format'
import type { AnalysisResult } from '../types'

type AnalysisHistoryPageProps = {
  token: string
}

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
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Saved reports</p>
          <h2>Analysis history</h2>
        </div>
        <button type="button" className="secondary-button" onClick={() => void loadHistory()} disabled={loading}>
          Refresh
        </button>
      </div>

      {error ? <div className="inline-banner" role="alert">{error}</div> : null}

      {loading ? (
        <div className="empty-state compact"><h3>Loading reports…</h3></div>
      ) : reports.length === 0 ? (
        <div className="empty-state compact">
          <h3>No saved analyses yet</h3>
          <p>Run an analysis while signed in and it will appear here.</p>
        </div>
      ) : (
        <div className="table-panel">
          <table>
            <thead>
              <tr><th>Resume</th><th>Score</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.originalFilename}</td>
                  <td>{report.overallScore}% · {report.scoreLabel}</td>
                  <td>{formatDate(report.createdAt)}</td>
                  <td>
                    <div className="mini-actions">
                      <button type="button" className="secondary-button" onClick={() => report.id !== null && void openReport(report.id)}>Open</button>
                      <button type="button" className="danger-button" onClick={() => report.id !== null && void deleteReport(report.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport ? (
        <div className="panel">
          <div className="page-header narrow-header">
            <div>
              <p className="eyebrow">Report detail</p>
              <h3>{selectedReport.originalFilename} · {selectedReport.overallScore}%</h3>
            </div>
            <button type="button" className="secondary-button" onClick={() => setSelectedReport(null)}>Close</button>
          </div>
          <section className="analysis-details">
            <h3>Summary</h3>
            <p>{selectedReport.report.summary}</p>
          </section>
          {selectedReport.report.parameters.length > 0 ? (
            <section className="analysis-details">
              <h3>Score breakdown</h3>
              {selectedReport.report.parameters.map((parameter) => (
                <div key={parameter.parameter}>
                  <strong>{parameter.parameter.replaceAll('_', ' ')} · {parameter.score}%</strong>
                  <p>{parameter.summary}</p>
                </div>
              ))}
            </section>
          ) : null}
          {selectedReport.report.issues.map((issue, index) => (
            <section className="analysis-details" key={`${issue.parameter}-${index}`}>
              <h3>{issue.parameter.replaceAll('_', ' ')}</h3>
              <p>{issue.problem}</p>
              <p><strong>Fix:</strong> {issue.fix}</p>
              {issue.rewrite ? <p><strong>Suggested rewrite:</strong> {issue.rewrite}</p> : null}
            </section>
          ))}
          {selectedReport.report.missingMaterial.length > 0 ? (
            <section className="analysis-details">
              <h3>Missing material</h3>
              {selectedReport.report.missingMaterial.map((item) => (
                <div key={item.type}>
                  <strong>{item.type.replaceAll('_', ' ')}</strong>
                  <p>{item.whyItMatters}</p>
                  <p><strong>How to add it:</strong> {item.howToAdd}</p>
                </div>
              ))}
            </section>
          ) : null}
          {selectedReport.report.actionPlan.length > 0 ? (
            <section className="analysis-details">
              <h3>Action plan</h3>
              {selectedReport.report.actionPlan.map((action) => (
                <div key={`${action.priority}-${action.title}`}>
                  <strong>{action.priority}. {action.title} · {action.impact}</strong>
                  <p>{action.details} {action.timeEstimate ? `(${action.timeEstimate})` : ''}</p>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}