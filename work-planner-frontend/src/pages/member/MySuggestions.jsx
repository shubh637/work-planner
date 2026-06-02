import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi, projectApi } from '../../api/api'

const STATUS_INFO = {
  PENDING:     { label: 'Awaiting approval',   color: '#92400e', bg: '#fef3c7' },
  APPROVED:    { label: 'Approved by manager', color: '#065f46', bg: '#d1fae5' },
  REJECTED:    { label: 'Rejected by manager', color: '#991b1b', bg: '#fee2e2' },
  OPEN:        { label: 'Assigned & open',     color: '#1e40af', bg: '#dbeafe' },
  IN_PROGRESS: { label: 'In progress',         color: '#5b21b6', bg: '#ede9fe' },
  CLOSED:      { label: 'Completed',           color: '#475569', bg: '#f1f5f9' },
}

const EMPTY_FORM = { title: '', description: '', projectId: '', dueDate: '' }

export default function MySuggestions() {
  const [tasks, setTasks]       = useState([])
  const [projects, setProjects] = useState([])
  const [filter, setFilter]     = useState('')
  const [form, setForm]         = useState(EMPTY_FORM)
  const [msg, setMsg]           = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const loadSuggestions = () =>
    taskApi.getMySuggestions().then(r => setTasks(r.data))

  useEffect(() => {
    loadSuggestions()
    projectApi.getAll().then(r => setProjects(r.data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setMsg('')
    setLoading(true)
    try {
      await taskApi.suggest({
        ...form,
        projectId: Number(form.projectId),
        dueDate: form.dueDate || null,
      })
      setMsg('Suggestion submitted! Awaiting manager approval.')
      setForm(EMPTY_FORM)
      loadSuggestions()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit suggestion')
    } finally { setLoading(false) }
  }

  const filtered = filter ? tasks.filter(t => t.status === filter) : tasks

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <h1 className="page-title">Suggestions</h1>
          <select className="form-control" style={{ width: 'auto' }} value={filter}
            onChange={e => setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {Object.keys(STATUS_INFO).map(s =>
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            )}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* Left — suggest form */}
          <div className="card">
            <h3 className="section-title">New Suggestion</h3>
            {msg   && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{msg}</div>}
            {error && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="ms-title">Title *</label>
                <input id="ms-title" className="form-control" value={form.title} required
                  onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ms-desc">Description</label>
                <textarea id="ms-desc" className="form-control" rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ms-project">Project *</label>
                <select id="ms-project" className="form-control" value={form.projectId} required
                  onChange={e => setForm({ ...form, projectId: e.target.value })}>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ms-due">Suggested Due Date</label>
                <input id="ms-due" type="date" className="form-control" value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Suggestion'}
              </button>
            </form>
          </div>

          {/* Right — suggestions list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.length === 0 ? (
              <div className="card">
                <p className="text-muted">No suggestions yet.</p>
              </div>
            ) : filtered.map(t => {
              const info = STATUS_INFO[t.status] || {}
              return (
                <div key={t.id} className="task-card" style={{ borderLeftColor: info.bg }}>
                  <div style={{ flex: 1 }}>
                    <div className="task-card-title">{t.title}</div>
                    <div className="task-card-meta">
                      {t.projectName}{t.dueDate && <> &bull; Due: {t.dueDate}</>}
                    </div>
                    <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <ProgressBadge status={t.status} />
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600,
                        color: info.color, background: info.bg,
                        padding: '0.15rem 0.5rem', borderRadius: 999,
                      }}>
                        {info.label}
                      </span>
                    </div>
                    {t.description && (
                      <p style={{ marginTop: '0.3rem', fontSize: '0.82rem', color: '#64748b' }}>
                        {t.description.length > 90 ? t.description.slice(0, 90) + '…' : t.description}
                      </p>
                    )}
                  </div>
                  <Link to={`/member/suggestions/${t.id}`} className="btn btn-secondary btn-sm"
                    style={{ flexShrink: 0 }}>View</Link>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </Layout>
  )
}
