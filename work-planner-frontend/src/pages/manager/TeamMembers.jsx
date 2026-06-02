import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import ConfirmModal from '../../components/ConfirmModal'
import { userApi } from '../../api/api'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'TEAM_MEMBER' }

export default function TeamMembers() {
  const [members, setMembers]           = useState([])
  const [showForm, setShowForm]         = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [error, setError]               = useState('')
  const [toast, setToast]               = useState('')
  const [loading, setLoading]           = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const load = () => userApi.getAll().then(r => setMembers(r.data))
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  const openEdit = (m) => {
    setEditTarget(m)
    setForm({ name: m.name, email: m.email, password: '', role: m.role })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (editTarget) {
        await userApi.update(editTarget.id, form)
        showToast('Member updated successfully')
      } else {
        await userApi.addMember(form)
        showToast('Member added — invite email sent')
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save member')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const id = deleteTarget
    setMembers(prev => prev.filter(m => m.id !== id))
    setDeleteTarget(null)
    showToast('Member deleted')
    try {
      await userApi.remove(id)
    } catch {
      load()
      showToast('Failed to delete member')
    }
  }

  return (
    <Layout>
      <div className="page container">
        {toast && (
          <div style={{
            position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
            background: '#22c55e', color: '#fff', padding: '0.75rem 1.5rem',
            borderRadius: '8px', fontWeight: 500, boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>{toast}</div>
        )}
        <div className="page-header">
          <h1 className="page-title">Team Members</h1>
          <button className="btn btn-primary" onClick={openAdd}>Add Member</button>
        </div>

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td>
                      <span className={`badge ${m.role === 'MANAGER' ? 'badge-primary' : 'badge-secondary'}`}>
                        {m.role === 'MANAGER' ? 'Manager' : 'Team Member'}
                      </span>
                    </td>
                    <td>{m.active ? 'Active' : 'Inactive'}</td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(m.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No members yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-title">{editTarget ? 'Edit Member' : 'Add Member'}</div>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="tm-name">Name</label>
                  <input id="tm-name" className="form-control" value={form.name} required
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="tm-email">Email</label>
                  <input id="tm-email" className="form-control" type="email" value={form.email} required
                    onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="tm-password">
                    Password {editTarget && <span style={{ color: '#94a3b8', fontWeight: 400 }}>(leave blank to keep current)</span>}
                  </label>
                  <input id="tm-password" className="form-control" type="password" value={form.password}
                    required={!editTarget}
                    onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="tm-role">Role</label>
                  <select id="tm-role" className="form-control" value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="TEAM_MEMBER">Team Member</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary"
                    onClick={() => { setShowForm(false); setError('') }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (editTarget ? 'Save Changes' : 'Add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteTarget && (
          <ConfirmModal
            title="Delete Member"
            message="Are you sure you want to permanently delete this member?"
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </Layout>
  )
}
