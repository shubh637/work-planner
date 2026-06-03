import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { taskApi, projectApi } from '../../api/api'
import { useToast } from '../../context/ToastContext'

export default function SuggestTask() {
  const { showToast } = useToast()
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({ title: '', description: '', projectId: '', dueDate: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    projectApi.getAll().then(r => setProjects(r.data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await taskApi.suggest({
        ...form,
        projectId: Number(form.projectId),
        dueDate: form.dueDate || null,
      })
      showToast('Task suggestion submitted! Awaiting manager approval.')
      setForm({ title: '', description: '', projectId: '', dueDate: '' })
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit suggestion', 'error')
    } finally { setLoading(false) }
  }

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <h1 className="page-title">Suggest a Task</h1>
        </div>

        <div className="card" style={{ maxWidth: 560 }}>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Task Title *</label>
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
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Suggested Due Date</label>
              <input type="date" className="form-control" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Submitting…' : 'Submit Suggestion'}</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
