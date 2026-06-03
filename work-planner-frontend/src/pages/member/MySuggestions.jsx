import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi, projectApi } from '../../api/api'
import { useToast } from '../../context/ToastContext'

const STATUS_META = {
  PENDING:     { dot: '#f59e0b', label: 'Awaiting approval'   },
  APPROVED:    { dot: '#10b981', label: 'Approved by manager' },
  REJECTED:    { dot: '#ef4444', label: 'Rejected by manager' },
  OPEN:        { dot: '#0ea5e9', label: 'Assigned & open'     },
  IN_PROGRESS: { dot: '#8b5cf6', label: 'In progress'         },
  CLOSED:      { dot: '#64748b', label: 'Completed'           },
}

const EMPTY_FORM = { title: '', description: '', projectId: '', dueDate: '' }

export default function MySuggestions() {
  const { showToast } = useToast()
  const [tasks, setTasks]       = useState([])
  const [projects, setProjects] = useState([])
  const [filter, setFilter]     = useState('')
  const [form, setForm]         = useState(EMPTY_FORM)
  const [loading, setLoading]   = useState(false)

  const loadSuggestions = () => taskApi.getMySuggestions().then(r => setTasks(r.data))
  useEffect(() => {
    loadSuggestions()
    projectApi.getAll().then(r => setProjects(r.data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await taskApi.suggest({ ...form, projectId: Number(form.projectId), dueDate: form.dueDate || null })
      showToast('Suggestion submitted! Awaiting manager approval.')
      setForm(EMPTY_FORM)
      loadSuggestions()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit suggestion', 'error')
    } finally { setLoading(false) }
  }

  const filtered = filter ? tasks.filter(t => t.status === filter) : tasks

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Suggestions</h1>
            <p className="page-subtitle">{tasks.length} suggestion{tasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '560px 1fr', gap: '20px', alignItems: 'start' }}>

          {/* Suggest form */}
          <div className="card" style={{ position: 'sticky', top: '80px' }}>
            <h3 className="section-title" style={{ marginBottom: '16px' }}>New Suggestion</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-control" value={form.title} required onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Project *</label>
                <select className="form-control" value={form.projectId} required onChange={e => setForm({ ...form, projectId: e.target.value })}>
                  <option value="">Select project</option>
                  {projects.filter(p => p.status !== 'DONE').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Suggested Due Date</label>
                <input type="date" className="form-control" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Suggestion'}
              </button>
            </form>
          </div>

          {/* Suggestions list */}
          <div>
            {/* Status pill filters */}
            <div style={{
              display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center',
              marginBottom: '16px', padding: '12px 16px',
              background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)',
            }}>
              <button onClick={() => setFilter('')} style={{
                padding: '4px 12px', borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit',
                border: `1.5px solid ${!filter ? 'var(--brand)' : 'var(--border)'}`,
                background: !filter ? 'var(--brand)' : 'var(--surface-2)',
                color: !filter ? '#fff' : 'var(--text-2)',
                fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s',
              }}>All</button>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <button key={k} onClick={() => setFilter(filter === k ? '' : k)} style={{
                  padding: '4px 10px', borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit',
                  border: `1.5px solid ${filter === k ? v.dot : 'var(--border)'}`,
                  background: filter === k ? v.dot : 'var(--surface-2)',
                  color: filter === k ? '#fff' : 'var(--text-2)',
                  fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: filter === k ? 'rgba(255,255,255,0.7)' : v.dot }} />
                  {k.replace('_', ' ')}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }}>
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                No suggestions yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map(t => {
                  const meta = STATUS_META[t.status]
                  return (
                    <div key={t.id} style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderLeft: `4px solid ${meta?.dot || 'var(--brand)'}`,
                      borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                      display: 'flex', alignItems: 'center', gap: '16px',
                      boxShadow: 'var(--shadow-xs)', transition: 'box-shadow 0.15s, transform 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateX(3px)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'translateX(0)' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text)' }}>{t.title}</span>
                          <ProgressBadge status={t.status} />
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: t.description ? '6px' : 0 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            {t.projectName}
                          </span>
                          {t.dueDate && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
                              {t.dueDate}
                            </span>
                          )}
                          {meta && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: meta.dot, fontWeight: 600 }}>
                              {meta.label}
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-3)', lineHeight: 1.5 }}>
                            {t.description.length > 100 ? t.description.slice(0, 100) + '…' : t.description}
                          </p>
                        )}
                      </div>
                      <Link to={`/member/suggestions/${t.id}`} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>View</Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
