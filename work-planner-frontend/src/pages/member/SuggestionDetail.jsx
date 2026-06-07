import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi, projectApi } from '../../api/api'
import { useToast } from '../../context/ToastContext'

export default function SuggestionDetail() {
  const { id } = useParams()
  const { showToast } = useToast()
  const [task, setTask]         = useState(null)
  const [history, setHistory]   = useState([])
  const [projects, setProjects] = useState([])
  const [editing, setEditing]   = useState(false)
  const [form, setForm]         = useState({})

  const load = () => {
    taskApi.getById(id).then(r => {
      setTask(r.data)
      setForm({
        title: r.data.title,
        description: r.data.description || '',
        dueDate: r.data.dueDate || '',
        projectId: r.data.projectId || '',
      })
    })
    taskApi.getHistory(id).then(r => setHistory(r.data))
  }

  useEffect(() => {
    load()
    projectApi.getAll().then(r => setProjects(r.data))
  }, [id])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await taskApi.editSuggestion(id, {
        title: form.title,
        description: form.description,
        dueDate: form.dueDate || null,
      })
      showToast('Suggestion updated successfully.')
      setEditing(false)
      load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update suggestion', 'error')
    }
  }

  if (!task) return <Layout><div className="page">Loading…</div></Layout>

  const canEdit = task.status === 'PENDING'

  return (
    <Layout>
      <div className="page container">

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>{task.title}</h2>
              <ProgressBadge status={task.status} />
            </div>
            {canEdit && !editing && (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                Edit Suggestion
              </button>
            )}
          </div>

          {!editing ? (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div><span className="text-muted">Project:</span> {task.projectName}</div>
                <div><span className="text-muted">Due Date:</span> {task.dueDate || '-'}</div>
              </div>
              {task.description && (
                <div>
                  <span className="text-muted">Description:</span>
                  <p style={{ marginTop: '0.25rem' }}>{task.description}</p>
                </div>
              )}
              {task.status === 'PENDING' && (
                <div className="alert alert-success" style={{ marginTop: '1rem' }}>
                  Your suggestion is awaiting manager review. You can still edit it while it is pending.
                </div>
              )}
              {task.status === 'REJECTED' && (
                <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                  This suggestion was rejected by the manager.
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-control" value={form.title} required
                  onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Suggested Due Date</label>
                <input type="date" className="form-control" value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary"
                  onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">Status History</h3>
          {history.length === 0 ? <p className="text-muted">No history yet.</p> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Changed By</th><th>From</th><th>To</th><th>Notes</th><th>When</th></tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td>{h.changedByName}</td>
                      <td><ProgressBadge status={h.oldStatus} /></td>
                      <td><ProgressBadge status={h.newStatus} /></td>
                      <td>{h.notes || '-'}</td>
                      <td>{new Date(h.changedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
