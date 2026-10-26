import { useNavigate } from 'react-router-dom'
import { formatDate } from '../../utils/format'
import type { DocumentSummary } from '../../types'

type DocumentsPageProps = {
  documents: DocumentSummary[]
  onDelete: (documentId: string) => Promise<void> | void
  onRefresh: () => Promise<void> | void
}

export function DocumentsPage({ documents, onDelete, onRefresh }: DocumentsPageProps) {
  const navigate = useNavigate()

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Documents</p>
          <h2>Your writing workspace</h2>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <h3>No documents yet</h3>
          <p>Your saved documents will appear here.</p>
        </div>
      ) : (
        <div className="document-grid">
          {documents.map((document) => (
            <article key={document.id} className="card">
              <div className="card-header-row">
                <div>
                  <h3>{document.title}</h3>
                  <p className="muted">Created {formatDate(document.createdAt)}</p>
                </div>
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => {
                    if (window.confirm('Delete this document?')) {
                      void onDelete(document.id)
                    }
                  }}
                >
                  Delete
                </button>
              </div>

              <div className="meta-row">
                <span>Document ID {document.id.slice(0, 8)}</span>
              </div>

              <div className="button-row">
                <button type="button" className="secondary-button" onClick={() => navigate(`/documents/${document.id}`)}>
                  Open
                </button>
                <button type="button" className="secondary-button" onClick={() => void onRefresh()}>
                  Refresh
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
