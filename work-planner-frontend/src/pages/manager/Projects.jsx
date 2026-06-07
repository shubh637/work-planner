import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import ConfirmModal from '../../components/ConfirmModal'
import { projectApi } from '../../api/api'
import { useToast } from '../../context/ToastContext'

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#0ea5e9', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
]

const STATUS_META = {
  NOT_STARTED: { label: 'Not Started', dot: '#94a3b8', bg: 'var(--surface-2)', color: 'var(--text-3)' },
  IN_PROGRESS: { label: 'In Progress', dot: '#8b5cf6', bg: '#ede9fe', color: '#6d28d9' },
  DONE:        { label: 'Done',        dot: '#10b981', bg: '#d1fae5', color: '#065f46' },
}

const STATUS_FLOW = ['NOT_STARTED', 'IN_PROGRESS', 'DONE']

function getColor(id) {
  return PROJECT_COLORS[id % PROJECT_COLORS.length]
}

function initials(name) {
  return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.NOT_STARTED
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: m.bg, color: m.color,
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '0.7rem', fontWeight: 700,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  )
}

export default function Projects() {
  const { showToast } = useToast()
  const [projects, setProjects]         = useState([])
  const [showForm, setShowForm]         = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm]                 = useState({ name: '', description: '', status: 'NOT_STARTED' })
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')

  const load = () => projectApi.getAll().then(r => setProjects(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditTarget(null); setForm({ name: '', description: '', status: 'NOT_STARTED' }); setError(''); setShowForm(true) }
  const openEdit   = (p) => { setEditTarget(p); setForm({ name: p.name, description: p.description || '', status: p.status || 'NOT_STARTED' }); setError(''); setShowForm(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editTarget) await projectApi.update(editTarget.id, form)
      else await projectApi.create(form)
      setShowForm(false)
      showToast(editTarget ? 'Project updated' : 'Project created')
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project')
    }
  }

  const handleStatusChange = async (p, newStatus) => {
    try {
      const res = await projectApi.updateStatus(p.id, newStatus)
      setProjects(prev => prev.map(proj => proj.id === p.id ? res.data : proj))
      showToast(`"${p.name}" marked as ${STATUS_META[newStatus].label}`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error')
    }
  }

  const handleDelete = async () => {
    await projectApi.remove(deleteTarget)
    setDeleteTarget(null)
    showToast('Project deleted')
    load()
  }

  const filtered = projects.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="page container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Project
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
          padding: '0 14px', height: '42px', maxWidth: '320px', marginBottom: '24px',
          boxShadow: 'var(--shadow-xs)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, flexShrink: 0 }}>
            <path d="M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects…"
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--text)', fontFamily: 'inherit', width: '100%' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-3)', display: 'flex' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>
              {search ? 'No projects match your search' : 'No projects yet'}
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              {search ? 'Try a different keyword.' : 'Create your first project to get started.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filtered.map(p => {
              const color = getColor(p.id)
              const status = p.status || 'NOT_STARTED'
              const isDone = status === 'DONE'
              const currentIdx = STATUS_FLOW.indexOf(status)
              const prevStatus = currentIdx > 0 ? STATUS_FLOW[currentIdx - 1] : null
              const nextStatus = currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null

              return (
                <div key={p.id} style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${isDone ? '#6ee7b7' : 'var(--border)'}`,
                  overflow: 'hidden',
                  boxShadow: isDone ? '0 0 0 1px #6ee7b744' : 'var(--shadow-xs)',
                  transition: 'box-shadow 0.16s, transform 0.16s',
                  display: 'flex', flexDirection: 'column',
                  opacity: isDone ? 0.85 : 1,
                }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = isDone ? '0 0 0 1px #6ee7b744' : 'var(--shadow-xs)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {/* Color banner */}
                  <div style={{ height: '6px', background: isDone ? '#10b981' : color }} />

                  <div style={{ padding: '20px 20px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Avatar + name + status badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                        background: isDone ? '#d1fae5' : `${color}18`,
                        color: isDone ? '#10b981' : color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.85rem', flexShrink: 0, letterSpacing: '-0.02em',
                      }}>
                        {isDone ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : initials(p.name)}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '5px' }}>
                          {p.name}
                        </div>
                        <StatusBadge status={status} />
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: '0.825rem', color: 'var(--text-2)', lineHeight: 1.55,
                      flex: 1, display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0,
                    }}>
                      {p.description || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>No description</span>}
                    </p>

                    {/* Status progress buttons */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {prevStatus && (
                        <button
                          onClick={() => handleStatusChange(p, prevStatus)}
                          style={{
                            background: 'none', border: '1px solid var(--border)',
                            borderRadius: '999px', padding: '3px 10px',
                            fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                            color: 'var(--text-3)', fontFamily: 'inherit', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)' }}
                        >
                          ← {STATUS_META[prevStatus].label}
                        </button>
                      )}
                      {nextStatus && (
                        <button
                          onClick={() => handleStatusChange(p, nextStatus)}
                          style={{
                            background: STATUS_META[nextStatus].bg,
                            color: STATUS_META[nextStatus].color,
                            border: 'none', borderRadius: '999px', padding: '3px 12px',
                            fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'opacity 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          Mark {STATUS_META[nextStatus].label} →
                        </button>
                      )}
                      {isDone && (
                        <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Project complete — tasks locked
                        </span>
                      )}
                    </div>

                    {/* Edit / Delete actions */}
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEdit(p)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(p.id)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6 M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-title">{editTarget ? 'Edit Project' : 'New Project'}</div>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input className="form-control" value={form.name} required
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={form.description} rows={3}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                {editTarget && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status || 'NOT_STARTED'}
                      onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                )}
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editTarget ? 'Save Changes' : 'Create Project'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteTarget && (
          <ConfirmModal
            title="Delete Project"
            message="Delete this project? All associated tasks will be removed."
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </Layout>
  )
}
