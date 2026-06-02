import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { taskApi, projectApi } from '../../api/api'

export default function SuggestTask() {
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({ title: '', description: '', projectId: '', dueDate: '' })
  const [msg, setMsg]   = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    projectApi.getAll().then(r => setProjects(r.data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setMsg('')
    try {
      await taskApi.suggest({
        ...form,
        projectId: Number(form.projectId),
        dueDate: form.dueDate || null,
      })
      setMsg('Task suggestion submitted! Awaiting manager approval.')
      setForm({ title: '', description: '', projectId: '', dueDate: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit suggestion')
    }
  }

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <h1 className="page-title">Suggest a Task</h1>
        </div>

        <div className="card" style={{ maxWidth: 560 }}>
          {msg   && <div className="alert alert-success">{msg}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="st-title">Task Title *</label>
              <input id="st-title" className="form-control" value={form.title} required
                onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="st-desc">Description</label>
              <textarea id="st-desc" className="form-control" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="st-project">Project *</label>
              <select id="st-project" className="form-control" value={form.projectId} required
                onChange={e => setForm({ ...form, projectId: e.target.value })}>
                <option value="">Select project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="st-due">Suggested Due Date</label>
              <input id="st-due" type="date" className="form-control" value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Suggestion</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
