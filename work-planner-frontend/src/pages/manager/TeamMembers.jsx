import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import ConfirmModal from '../../components/ConfirmModal'
import { userApi } from '../../api/api'

export default function TeamMembers() {
  const [members, setMembers]         = useState([])
  const [showForm, setShowForm]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm]               = useState({ name: '', email: '', password: '' })
  const [error, setError]             = useState('')

  const load = () => userApi.getMembers().then(r => setMembers(r.data))
  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await userApi.addMember(form)
      setForm({ name: '', email: '', password: '' })
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member')
    }
  }

  const handleDelete = async () => {
    await userApi.remove(deleteTarget)
    setDeleteTarget(null)
    load()
  }

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <h1 className="page-title">Team Members</h1>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add Member</button>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>{m.active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTarget(m.id)}>Remove</button>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>No members yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-title">Add Team Member</div>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleAdd}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={form.name} required
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={form.email} required
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input className="form-control" type="password" value={form.password} required
                    onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteTarget && (
          <ConfirmModal
            title="Remove Member"
            message="Are you sure you want to deactivate this team member?"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </Layout>
  )
}
