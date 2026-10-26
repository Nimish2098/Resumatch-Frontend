import type { AnalysisResult } from '../types'
import './ReportView.css'

const SIZE_PATTERN = ['a', 'b', 'c', 'd', 'b', 'a'] as const
const clean = (value: string) => value.replaceAll('_', ' ')

type ReportViewProps = { result: AnalysisResult }

export default function ReportView({ result }: ReportViewProps) {
  const { report } = result
  const highCount = report.issues.filter((issue) => issue.severity === 'HIGH').length

  return (
    <div className="bento-wrap">
      <h3 className="bento-title">Summary</h3>

      <div className="bento">
        {/* Hero: score */}
        <section className="tile tile-dark tile-score">
          <span className="tile-label">RESUME SCORE</span>
          <strong className="tile-score-value">{result.overallScore}<small>%</small></strong>
          <span className="tile-pill">{result.scoreLabel}</span>
        </section>

        {/* Hero: summary */}
        <section className="tile tile-orange tile-summary">
          <span className="tile-label">01 / SUMMARY</span>
          <h4>What to focus on</h4>
          <p>{report.summary}</p>
        </section>

        {/* Quick stats */}
        <section className="tile tile-dark tile-stat">
          <span className="tile-label">ISSUES FOUND</span>
          <strong>{report.issues.length}</strong>
          <p>{highCount} high severity</p>
        </section>
        <section className="tile tile-orange tile-stat">
          <span className="tile-label">ACTION STEPS</span>
          <strong>{report.actionPlan.length}</strong>
          <p>in your plan</p>
        </section>

        {/* One tile per parameter */}
        {report.parameters.map((item, index) => {
          const strong = item.score >= 75
          return (
            <section
              key={item.parameter}
              className={`tile tile-param size-${SIZE_PATTERN[index % SIZE_PATTERN.length]} ${strong ? 'tile-dark' : 'tile-orange'}`}
            >
              <span className="tile-label">{String(index + 1).padStart(2, '0')} / {strong ? 'STRONG' : 'NEEDS WORK'}</span>
              <h4>{clean(item.parameter)}</h4>
              <strong className="param-score">{item.score}<small>%</small></strong>
              <div className="param-bar" aria-hidden="true">
                <span style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }} />
              </div>
              <p>{item.summary}</p>
            </section>
          )
        })}

        {report.parameters.length === 0 ? (
          <section className="tile tile-dark tile-wide">
            <p>No parameter scores were returned for this analysis.</p>
          </section>
        ) : null}

        {/* Priority fixes */}
        <section className="tile tile-dark tile-half">
          <span className="tile-label">PRIORITY FIXES</span>
          <h4>Make the biggest improvements first</h4>
          {report.issues.map((issue, index) => (
            <div className="entry" key={`${issue.parameter}-${index}`}>
              <div className="entry-title">
                <strong>{clean(issue.parameter)}</strong>
                <span className={`tile-pill ${issue.severity === 'HIGH' ? 'pill-hot' : ''}`}>{issue.severity}</span>
              </div>
              <p>{issue.problem}</p>
              <p><b>Fix:</b> {issue.fix}</p>
              {issue.rewrite ? <p><b>Suggested rewrite:</b> {issue.rewrite}</p> : null}
            </div>
          ))}
        </section>

        {/* Action plan */}
        <section className="tile tile-orange tile-half">
          <span className="tile-label">ACTION PLAN</span>
          <h4>Next steps</h4>
          {report.actionPlan.map((action) => (
            <div className="entry" key={`${action.priority}-${action.title}`}>
              <div className="entry-title">
                <strong>{action.priority}. {action.title}</strong>
                <span className="tile-pill">{action.impact}</span>
              </div>
              <p>{action.details} {action.timeEstimate ? `(${action.timeEstimate})` : ''}</p>
            </div>
          ))}
        </section>

        {/* Missing material */}
        {report.missingMaterial.length > 0 ? (
          <section className="tile tile-dark tile-wide">
            <span className="tile-label">MISSING MATERIAL</span>
            <h4>Strengthen the evidence</h4>
            <div className="missing-grid">
              {report.missingMaterial.map((item) => (
                <div className="entry" key={item.type}>
                  <strong>{clean(item.type)}</strong>
                  <p>{item.whyItMatters}</p>
                  <p><b>How to add it:</b> {item.howToAdd}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}