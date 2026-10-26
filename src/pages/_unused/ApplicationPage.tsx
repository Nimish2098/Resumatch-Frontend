import { formatDate } from '../../utils/format'
import type { Application } from '../../types'


type ApplicationsPageProps = {
  applications: Application[]
}

export function ApplicationsPage({ applications }: ApplicationsPageProps) {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Applications</p>
          <h2>Job tracking</h2>
        </div>
      </div>

      <div className="alert-banner">
        The application tracker is ready for the backend API, but the application controller does not appear
        to expose save endpoints in the current schema. This screen is intentionally read-only until the API is added.
      </div>

      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Date</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.position}</td>
                <td>{application.company}</td>
                <td>
                  <span className={`status-pill ${application.status.toLowerCase()}`}>{application.status}</span>
                </td>
                <td>{formatDate(application.date)}</td>
                <td>
                  <a href={application.url} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


