import { useNavigate, useParams } from 'react-router-dom'
import { apiFetch } from '../../api/apiFetch'
import { formatDate } from '../../utils/format'
import type { DocumentDetail, VersionSummary, VersionDetail } from '../../types'
import { useState, useEffect } from 'react'

type DocumentEditorPageProps = {
  onSave: (id: string, payload: { title: string; content: string }) => Promise<void> | void
  onDelete: (documentId: string) => Promise<void> | void
  token: string
}

export default function DocumentEditorPage({ onSave, onDelete, token }: DocumentEditorPageProps) {
  const navigate = useNavigate()
  const { documentId } = useParams()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [versionList, setVersionList] = useState<VersionSummary[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(documentId))

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setIsLoading(true)
        const detail = await apiFetch<DocumentDetail>(`/api/v1/documents/${documentId}`, {}, token)
        setTitle(detail.title)
        setContent(detail.content)

        const versions = await apiFetch<VersionSummary[]>(`/api/v1/documents/${documentId}/versions`, {}, token)
        setVersionList(versions)
      } catch {
        setTitle('Document not found')
        setContent('')
        setVersionList([])
      } finally {
        setIsLoading(false)
      }
    }

    void loadDocument()
  }, [documentId, token])

  const handleSave = async () => {
    if (!documentId) return
    const nextTitle = title.trim() || 'Untitled document'
    const payload = { title: nextTitle, content }
    await onSave(documentId, payload)

    navigate('/documents')
  }

  const handleDelete = async () => {
    if (!documentId) {
      navigate('/documents')
      return
    }

    if (window.confirm('Delete this document permanently?')) {
      await onDelete(documentId)
      navigate('/documents')
    }
  }

  const handleCreateSnapshot = async () => {
    if (!documentId || !message.trim()) {
      return
    }

    try {
      await apiFetch(`/api/v1/documents/${documentId}/versions`, {
        method: 'POST',
        body: JSON.stringify({ message: message.trim() }),
      }, token)
      const nextVersions = await apiFetch<VersionSummary[]>(`/api/v1/documents/${documentId}/versions`, {}, token)
      setVersionList(nextVersions)
      setMessage('')
    } catch {
      // ignore snapshot failures here; parent state can surface errors
    }
  }

  const handleOpenVersion = async (versionId: string) => {
    if (!documentId) return

    try {
      const version = await apiFetch<VersionDetail>(`/api/v1/documents/${documentId}/versions/${versionId}`, {}, token)
      setContent(version.content)
    } catch {
      // ignore open failures
    }
  }

  const handleRevert = async (versionId: string) => {
    if (!documentId) return

    try {
      await apiFetch(`/api/v1/documents/${documentId}/versions/${versionId}/revert`, { method: 'POST' }, token)
      const detail = await apiFetch<DocumentDetail>(`/api/v1/documents/${documentId}`, {}, token)
      setTitle(detail.title)
      setContent(detail.content)
      const nextVersions = await apiFetch<VersionSummary[]>(`/api/v1/documents/${documentId}/versions`, {}, token)
      setVersionList(nextVersions)
    } catch {
      // ignore revert failures
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header narrow-header">
        <div>
          <p className="eyebrow">Document detail</p>
          <h2>{title || 'Untitled document'}</h2>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => navigate('/documents')}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={() => void handleSave()}>
            Save
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state compact">
          <h3>Loading document…</h3>
        </div>
      ) : (
        <div className="editor-layout">
          <div className="panel">
            <label className="field-label">
              <span>Document title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <label className="field-label">
              <span>Content</span>
              <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={16} />
            </label>

            <div className="danger-zone">
              <button type="button" className="danger-button" onClick={() => void handleDelete()}>
                Delete document
              </button>
            </div>
          </div>

          <div className="panel">
            <h3>Version history</h3>

            <>
                <div className="version-form">
                  <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Snapshot message"
                  />
                  <button type="button" className="secondary-button" onClick={() => void handleCreateSnapshot()}>
                    Save snapshot
                  </button>
                </div>

                <div className="version-list">
                  {versionList.length === 0 ? (
                    <p className="muted">No versions recorded yet.</p>
                  ) : (
                    versionList.map((version) => (
                      <div key={version.id} className="version-item">
                        <div>
                          <strong>{version.message}</strong>
                          <p>{formatDate(version.createdAt)}</p>
                        </div>
                        <div className="mini-actions">
                          <button type="button" className="secondary-button" onClick={() => void handleOpenVersion(version.id)}>
                            Open
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                              if (window.confirm('Revert to this version? A new revision will be created.')) {
                                void handleRevert(version.id)
                              }
                            }}
                          >
                            Revert
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
          </div>
        </div>
      )}
    </div>
  )
}
