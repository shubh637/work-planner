import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import ConfirmModal from '../../components/ConfirmModal'
import { projectApi } from '../../api/api'

export default function Projects() {
  const [projects, setProjects]       = useState([])
  const [showForm, setShowForm]       = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm]               = useState({ name: '', description: '' })
  const [error, setError]             = useState('')

  const load = () => projectApi.getAll().then(r => setProjects(r.data))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditTarget(null); setForm({ name: '', description: '' }); setShowForm(true) }
  const openEdit = (p) => { setEditTarget(p); setForm({ name: p.name, description: p.description || '' }); setShowForm(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editTarget) await projectApi.update(editTarget.id, form)
      else await projectApi.create(form)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project')
    }
  }

  const handleDelete = async () => {
    await projectApi.remove(deleteTarget)
    setDeleteTarget(null)
    load()
  }

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <h1 className="page-title">Projects</h1>
          <button className="btn btn-primary" onClick={openCreate}>New Project</button>
        </div>

        <div className="card-grid">
          {projects.map(p => (
            <div key={p.id} className="card">
              <h3 style={{ marginBottom: '0.5rem' }}>{p.name}</h3>
              <p className="text-muted" style={{ marginBottom: '0.75rem' }}>{p.description || 'No description'}</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(p.id)}>Delete</button>
              </div>
            </div>
          ))}
          {projects.length === 0 && <p className="text-muted">No projects yet.</p>}
        </div>

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
                  <textarea className="form-control" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
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
