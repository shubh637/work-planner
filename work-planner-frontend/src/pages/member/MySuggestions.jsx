import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi } from '../../api/api'

const STATUS_INFO = {
  PENDING:     { label: 'Awaiting approval',    color: '#92400e', bg: '#fef3c7' },
  APPROVED:    { label: 'Approved by manager',  color: '#065f46', bg: '#d1fae5' },
  REJECTED:    { label: 'Rejected by manager',  color: '#991b1b', bg: '#fee2e2' },
  OPEN:        { label: 'Assigned & open',      color: '#1e40af', bg: '#dbeafe' },
  IN_PROGRESS: { label: 'In progress',          color: '#5b21b6', bg: '#ede9fe' },
  CLOSED:      { label: 'Completed',            color: '#475569', bg: '#f1f5f9' },
}

export default function MySuggestions() {
  const [tasks, setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    taskApi.getMySuggestions()
      .then(r => setTasks(r.data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter ? tasks.filter(t => t.status === filter) : tasks

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <h1 className="page-title">My Suggestions</h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select className="form-control" style={{ width: 'auto' }} value={filter}
              onChange={e => setFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {Object.keys(STATUS_INFO).map(s =>
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              )}
            </select>
            <Link to="/member/suggest" className="btn btn-primary">+ New Suggestion</Link>
          </div>
        </div>

        {loading ? <p>Loading…</p> : filtered.length === 0 ? (
          <p className="text-muted">No suggestions found.</p>
        ) : (
          filtered.map(t => {
            const info = STATUS_INFO[t.status] || {}
            return (
              <div key={t.id} className="task-card" style={{ borderLeftColor: info.bg }}>
                <div style={{ flex: 1 }}>
                  <div className="task-card-title">{t.title}</div>
                  <div className="task-card-meta">
                    Project: {t.projectName}
                    {t.dueDate && <> &bull; Due: {t.dueDate}</>}
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <ProgressBadge status={t.status} />
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      color: info.color, background: info.bg,
                      padding: '0.15rem 0.55rem', borderRadius: 999,
                    }}>
                      {info.label}
                    </span>
                  </div>
                  {t.description && (
                    <p style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#64748b' }}>
                      {t.description.length > 100 ? t.description.slice(0, 100) + '…' : t.description}
                    </p>
                  )}
                </div>
                <Link to={`/member/suggestions/${t.id}`} className="btn btn-secondary btn-sm"
                  style={{ flexShrink: 0 }}>
                  View
                </Link>
              </div>
            )
          })
        )}
      </div>
    </Layout>
  )
}
