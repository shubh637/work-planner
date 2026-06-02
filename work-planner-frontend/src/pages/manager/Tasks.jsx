import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import FilterBar from '../../components/FilterBar'
import ProgressBadge from '../../components/ProgressBadge'
import ConfirmModal from '../../components/ConfirmModal'
import { taskApi, projectApi, userApi } from '../../api/api'

const ALL_STATUSES = ['PENDING','APPROVED','REJECTED','OPEN','IN_PROGRESS','CLOSED']

export default function Tasks() {
  const [tasks, setTasks]       = useState([])
  const [projects, setProjects] = useState([])
  const [members, setMembers]   = useState([])
  const [filters, setFilters]   = useState({})
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget]     = useState(null)
  const [editForm, setEditForm]         = useState({})
  const [editError, setEditError]       = useState('')
  const [form, setForm] = useState({ title: '', description: '', projectId: '', assignedToUserId: '', dueDate: '' })
  const [error, setError] = useState('')

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
    setError('')
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
    }
  }

  const handleDelete = async () => {
    await taskApi.remove(deleteTarget)
    setDeleteTarget(null)
    load()
  }

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <h1 className="page-title">All Tasks</h1>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>New Task</button>
        </div>

        <FilterBar projects={projects} members={members} filters={filters} onChange={setFilters} />

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Project</th><th>Assignee</th><th>Due</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.projectName}</td>
                    <td>{t.assignedToName || <span className="text-muted">Unassigned</span>}</td>
                    <td>{t.dueDate || '-'}</td>
                    <td><ProgressBadge status={t.status} /></td>
                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>Edit</button>
                      <Link to={`/manager/tasks/${t.id}`} className="btn btn-secondary btn-sm">View</Link>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>No tasks found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Task Modal */}
        {editTarget && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-title">Edit Task — {editTarget.title}</div>
              {editError && <div className="alert alert-error">{editError}</div>}
              <form onSubmit={handleEdit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-edit-title">Title</label>
                  <input id="task-edit-title" className="form-control" value={editForm.title} required
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-edit-desc">Description</label>
                  <textarea id="task-edit-desc" className="form-control" value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-edit-due">Due Date</label>
                  <input id="task-edit-due" type="date" className="form-control" value={editForm.dueDate}
                    onChange={e => setEditForm({ ...editForm, dueDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-edit-status">Status</label>
                  <select id="task-edit-status" className="form-control" value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                {editForm.status !== editTarget.status && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="task-edit-reason">Reason for status change (optional)</label>
                    <input id="task-edit-reason" className="form-control" value={editForm.statusNotes}
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
                  <label className="form-label" htmlFor="task-create-title">Title</label>
                  <input id="task-create-title" className="form-control" value={form.title} required
                    onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-create-desc">Description</label>
                  <textarea id="task-create-desc" className="form-control" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-create-project">Project *</label>
                  <select id="task-create-project" className="form-control" value={form.projectId} required
                    onChange={e => setForm({ ...form, projectId: e.target.value })}>
                    <option value="">Select project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-create-assign">Assign To</label>
                  <select id="task-create-assign" className="form-control" value={form.assignedToUserId}
                    onChange={e => setForm({ ...form, assignedToUserId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="task-create-due">Due Date</label>
                  <input id="task-create-due" type="date" className="form-control" value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create</button>
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
