import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import FilterBar from '../../components/FilterBar'
import ProgressBadge from '../../components/ProgressBadge'
import ConfirmModal from '../../components/ConfirmModal'
import { taskApi, projectApi, userApi } from '../../api/api'

const Icon = ({ d, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
)

const ICON_PROJECT  = "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z M8 2v4 M16 2v4"
const ICON_USER     = "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
const ICON_CALENDAR = "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"

const ALL_STATUSES = ['PENDING','APPROVED','REJECTED','OPEN','IN_PROGRESS','CLOSED']

export default function Tasks() {
  const [searchParams] = useSearchParams()
  const [tasks, setTasks]       = useState([])
  const [projects, setProjects] = useState([])
  const [members, setMembers]   = useState([])
  const [search, setSearch]     = useState('')
  const [filters, setFilters]   = useState(() => {
    const status = searchParams.get('status')
    return status ? { status } : {}
  })
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget]     = useState(null)
  const [editForm, setEditForm]         = useState({})
  const [editError, setEditError]       = useState('')
  const [form, setForm] = useState({ title: '', description: '', projectId: '', assignedToUserId: '', dueDate: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = () => taskApi.getFiltered(filters).then(r => setTasks(r.data))

  useEffect(() => {
    projectApi.getAll().then(r => setProjects(r.data))
    userApi.getMembers().then(r => setMembers(r.data))
  }, [])

  useEffect(() => { load() }, [filters])

  const openEdit = (task) => {
    setEditTarget(task)
    setEditForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
      status: task.status,
      statusNotes: '',
    })
    setEditError('')
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    setEditError('')
    try {
      await taskApi.update(editTarget.id, editForm)
      setEditTarget(null)
      load()
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update task')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      await taskApi.create({
        ...form,
        projectId: Number(form.projectId),
        assignedToUserId: form.assignedToUserId ? Number(form.assignedToUserId) : null,
      })
      setShowCreate(false)
      setForm({ title: '', description: '', projectId: '', assignedToUserId: '', dueDate: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    await taskApi.remove(deleteTarget)
    setDeleteTarget(null)
    load()
  }

  const isOverdue = (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'CLOSED'

  const displayed = search.trim()
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : tasks

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <div>
            <h1 className="page-title">All Tasks</h1>
            <p className="page-subtitle">
              {search.trim() ? `${displayed.length} of ${tasks.length}` : tasks.length} task{tasks.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks…"
                className="form-control"
                style={{ paddingLeft: 32, width: 220, height: 38 }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                  padding: '2px', lineHeight: 1, fontSize: '1rem',
                }}>×</button>
              )}
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Task</button>
          </div>
        </div>

        <FilterBar projects={projects} members={members} filters={filters} onChange={setFilters} />

        {displayed.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px', opacity: 0.35 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>No tasks found</p>
            <p style={{ fontSize: '0.875rem' }}>Try adjusting your filters or create a new task.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayed.map(t => (
              <div key={t.id} style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${isOverdue(t) ? 'var(--red)' : 'var(--brand)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: 'var(--shadow-xs)',
                transition: 'box-shadow 0.16s ease, transform 0.16s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateX(3px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'translateX(0)' }}
              >
                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text)' }}>{t.title}</span>
                    <ProgressBadge status={t.status} />
                    {isOverdue(t) && (
                      <span style={{ background: 'var(--red-light)', color: 'var(--red)', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', border: '1px solid #fca5a5' }}>
                        Overdue
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-2)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Icon d={ICON_PROJECT} />
                      {t.projectName || <span className="text-muted">No project</span>}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Icon d={ICON_USER} />
                      {t.assignedToName || <span className="text-muted">Unassigned</span>}
                    </span>
                    {t.dueDate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isOverdue(t) ? 'var(--red)' : 'var(--text-2)', fontWeight: isOverdue(t) ? 600 : 400 }}>
                        <Icon d={ICON_CALENDAR} />
                        {t.dueDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>Edit</button>
                  <Link to={`/manager/tasks/${t.id}`} className="btn btn-secondary btn-sm">View</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(t.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Task Modal */}
        {editTarget && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-title">Edit Task — {editTarget.title}</div>
              {editError && <div className="alert alert-error">{editError}</div>}
              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-control" value={editForm.title} required
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-control" value={editForm.dueDate}
                    onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                {editForm.status !== editTarget.status && (
                  <div className="form-group">
                    <label className="form-label">Reason for status change (optional)</label>
                    <input className="form-control" value={editForm.statusNotes}
                      onChange={e => setEditForm({ ...editForm, statusNotes: e.target.value })}
                      placeholder="e.g. Reopened for revision…" />
                  </div>
                )}
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditTarget(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        {showCreate && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-title">Create Task</div>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-control" value={form.title} required
                    onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Project *</label>
                  <select className="form-control" value={form.projectId} required
                    onChange={e => setForm({ ...form, projectId: e.target.value })}>
                    <option value="">Select project</option>
                    {projects.filter(p => p.status !== 'DONE').map(p => (
                      <option key={p.id} value={p.id}>{p.name}{p.status === 'IN_PROGRESS' ? ' (In Progress)' : ''}</option>
                    ))}
                  </select>
                  {projects.some(p => p.status === 'DONE') && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '5px' }}>
                      Completed projects are hidden — tasks cannot be added to them.
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select className="form-control" value={form.assignedToUserId}
                    onChange={e => setForm({ ...form, assignedToUserId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-control" value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteTarget && (
          <ConfirmModal
            title="Delete Task"
            message="Are you sure you want to delete this task?"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </Layout>
  )
}
