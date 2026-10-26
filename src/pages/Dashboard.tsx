import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/apiFetch'
import { formatDate } from '../utils/format'
import type { AnalysisResult } from '../types'
import './Dashboard.css'

const clean = (value: string) => value.replaceAll('_', ' ')

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) {
    return <p className="db-muted">Run two analyses to see your trend.</p>
  }
  const w = 260
  const h = 90
  const pad = 8
  const points = scores.map((score, i) => {
    const x = pad + (i * (w - pad * 2)) / (scores.length - 1)
    const y = h - pad - (Math.min(100, Math.max(0, score)) / 100) * (h - pad * 2)
    return [x, y]
  })
  return (
    <svg className="db-spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Score trend: ${scores.join(', ')}`}>
      <polyline points={points.map((p) => p.join(',')).join(' ')} fill="none" stroke="#ff6a00" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 5 : 3} fill={i === points.length - 1 ? '#ff6a00' : '#0b0b0b'} stroke="#ff6a00" strokeWidth="2" />
      ))}
    </svg>
  )
}

type DashboardPageProps = {
  token: string
  userName?: string
}

export default function Dashboard({ token, userName }: DashboardPageProps) {
  const navigate = useNavigate()
  const [reports, setReports] = useState<AnalysisResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true)
      setError('')
      try {
        const history = await apiFetch<AnalysisResult[]>('/api/v1/resume-analysis', {}, token)
        setReports(history)
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load your recent analyses.')
      } finally {
        setIsLoading(false)
      }
    }
    void loadDashboard()
  }, [token])

  const stats = useMemo(() => {
    if (reports.length === 0) return null
    const scores = reports.map((report) => report.overallScore)
    const latest = reports[0]
    const previous = reports[1]
    return {
      count: reports.length,
      average: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
      best: Math.max(...scores),
      latest,
      delta: previous ? latest.overallScore - previous.overallScore : null,
      trend: [...scores].reverse().slice(-8), // oldest to newest, last 8
    }
  }, [reports])

  const firstName = userName?.trim().split(/\s+/)[0]
  const goUpload = () => navigate('/analysis')
  const goHistory = () => navigate('/analysis/history')

  return (
    <div className="page-shell db-page">
      {isLoading ? (
        <div className="db-grid" aria-label="Loading dashboard">
          <div className="db-skeleton db-span-8 db-tall" />
          <div className="db-skeleton db-span-4 db-tall" />
          <div className="db-skeleton db-span-4" />
          <div className="db-skeleton db-span-4" />
          <div className="db-skeleton db-span-4" />
        </div>
      ) : error ? (
        <div className="db-tile is-light db-error" role="alert">
          <h2>We couldn’t load your dashboard</h2>
          <p>{error}</p>
          <div className="db-actions">
            <button type="button" className="db-btn db-btn-dark" onClick={goHistory}>View saved reports</button>
            <button type="button" className="db-btn db-btn-ghost-dark" onClick={() => window.location.reload()}>Try again</button>
          </div>
        </div>
      ) : !stats ? (
        <section className="db-tile is-dark db-hero db-empty">
          <p className="db-label">WELCOME TO RESUMATCH</p>
          <h1>Your first review starts here.</h1>
          <p className="db-hero-copy">Upload a PDF or DOCX resume to get practical feedback on ATS readability, structure, and impact.</p>
          <div className="db-actions">
            <button type="button" className="db-btn db-btn-orange" onClick={goUpload}>Upload your resume <span aria-hidden="true">↗</span></button>
          </div>
        </section>
      ) : (
        <div className="db-grid">
          {/* Hero */}
          <section className="db-tile is-dark db-hero db-span-8">
            <p className="db-label">YOUR CAREER DASHBOARD</p>
            <h1>{firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}</h1>
            <p className="db-hero-copy">Upload an updated resume and see how your score moves.</p>
            <div className="db-actions">
              <button type="button" className="db-btn db-btn-orange" onClick={goUpload}>Upload resume <span aria-hidden="true">↗</span></button>
              <button type="button" className="db-btn db-btn-ghost" onClick={goHistory}>View history</button>
            </div>
            <div className="db-chips"><span>PDF or DOCX</span><span>Max 2 MB</span></div>
          </section>

          {/* Latest score */}
          <button type="button" className="db-tile is-orange db-interactive db-span-4" onClick={goHistory}>
            <span className="db-label">LATEST SCORE</span>
            <strong className="db-big">{stats.latest.overallScore}<small>%</small></strong>
            <span className="db-pill">{clean(stats.latest.scoreLabel)}</span>
            <span className="db-foot">
              {stats.delta === null ? 'First analysis' : stats.delta === 0 ? 'No change since last' : `${stats.delta > 0 ? '▲ +' : '▼ '}${stats.delta} since last`}
              <i className="db-arrow" aria-hidden="true">→</i>
            </span>
          </button>

          {/* Stats */}
          <button type="button" className="db-tile is-light db-interactive db-span-4" onClick={goHistory}>
            <span className="db-label">RESUMES SCANNED</span>
            <strong className="db-num">{stats.count}</strong>
            <span className="db-foot">Saved reports<i className="db-arrow" aria-hidden="true">→</i></span>
          </button>

          <button type="button" className="db-tile is-light db-interactive db-span-4" onClick={goHistory}>
            <span className="db-label">AVERAGE ATS SCORE</span>
            <strong className="db-num">{stats.average}<small>%</small></strong>
            <div className="db-meter" aria-hidden="true"><span style={{ width: `${stats.average}%` }} /></div>
            <span className="db-foot">Across all analyses<i className="db-arrow" aria-hidden="true">→</i></span>
          </button>

          <button type="button" className="db-tile is-dark db-interactive db-span-4" onClick={goHistory}>
            <span className="db-label">BEST SCORE</span>
            <strong className="db-num">{stats.best}<small>%</small></strong>
            <span className="db-foot">Your personal high<i className="db-arrow" aria-hidden="true">→</i></span>
          </button>

          {/* Recent analyses */}
          <section className="db-tile is-light db-span-8 db-recent">
            <div className="db-tile-head">
              <div>
                <span className="db-label">RECENT ANALYSES</span>
                <h2>Resume feedback at a glance</h2>
              </div>
              <button type="button" className="db-btn db-btn-dark db-btn-sm" onClick={goHistory}>View all</button>
            </div>
            <div className="db-list">
              {reports.slice(0, 4).map((report) => (
                <button key={report.id ?? report.originalFilename} type="button" className="db-row" onClick={goHistory}>
                  <span className="db-row-score">{report.overallScore}%</span>
                  <span className="db-row-main">
                    <strong>{report.originalFilename}</strong>
                    <small>{formatDate(report.createdAt)} · {clean(report.scoreLabel)}</small>
                    <span className="db-meter" aria-hidden="true"><span style={{ width: `${report.overallScore}%` }} /></span>
                  </span>
                  <i className="db-arrow" aria-hidden="true">→</i>
                </button>
              ))}
            </div>
          </section>

          {/* Trend */}
          <section className="db-tile is-dark db-span-4">
            <span className="db-label">SCORE TREND</span>
            <h2>Your last {stats.trend.length} analyses</h2>
            <Sparkline scores={stats.trend} />
          </section>

          {/* CTA */}
          <button type="button" className="db-tile is-orange db-interactive db-span-4" onClick={goUpload}>
            <span className="db-label">CONTINUE IMPROVING</span>
            <h2>Ready for another review?</h2>
            <span className="db-foot">Upload a resume<i className="db-arrow" aria-hidden="true">↗</i></span>
          </button>
        </div>
      )}
    </div>
  )
}