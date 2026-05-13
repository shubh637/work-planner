import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi, userApi } from '../../api/api'

const ALL_STATUSES = ['PENDING','APPROVED','REJECTED','OPEN','IN_PROGRESS','CLOSED']

export default function TaskDetailManager() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask]           = useState(null)
  const [history, setHistory]     = useState([])
  const [members, setMembers]     = useState([])
  const [assignTo, setAssignTo]   = useState('')
  const [notes, setNotes]         = useState('')
  const [msg, setMsg]             = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')

  const load = () => {
    taskApi.getById(id).then(r => {
      setTask(r.data)
      setEditStatus(r.data.status)
    })
    taskApi.getHistory(id).then(r => setHistory(r.data))
  }

  useEffect(() => {
    load()
    userApi.getMembers().then(r => setMembers(r.data))
  }, [id])

  const action = async (fn, successMsg) => {
    try {
      await fn()
      setMsg(successMsg)
      load()
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error')
    }
  }

  const handleStatusUpdate = () =>
    action(
      () => taskApi.update(id, { status: editStatus, statusNotes }),
      `Status updated to ${editStatus.replace('_', ' ')}`
    )

  if (!task) return <Layout><div className="page">Loading…</div></Layout>

  return (
    <Layout>
      <div className="page container">
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}
          onClick={() => navigate(-1)}>← Back</button>

        {msg && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{msg}</div>}

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>{task.title}</h2>
              <ProgressBadge status={task.status} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {task.status === 'PENDING' && (
                <>
                  <button className="btn btn-success btn-sm"
                    onClick={() => action(() => taskApi.approve(id, { notes }), 'Task approved')}>
                    Approve
                  </button>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => action(() => taskApi.reject(id, { notes }), 'Task rejected')}>
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><span className="text-muted">Project:</span> {task.projectName}</div>
            <div><span className="text-muted">Due Date:</span> {task.dueDate || '-'}</div>
            <div><span className="text-muted">Assignee:</span> {task.assignedToName || 'Unassigned'}</div>
            <div><span className="text-muted">Created By:</span> {task.createdByName}</div>
            {task.suggestedByName && <div><span className="text-muted">Suggested By:</span> {task.suggestedByName}</div>}
          </div>

          {task.description && (
            <div style={{ marginTop: '0.75rem' }}>
              <span className="text-muted">Description:</span>
              <p style={{ marginTop: '0.25rem' }}>{task.description}</p>
            </div>
          )}
        </div>

        {/* Edit Status */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 className="section-title">Edit Status</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="form-label">Status</label>
              <select className="form-control" value={editStatus}
                onChange={e => setEditStatus(e.target.value)}>
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label className="form-label">Notes (optional)</label>
              <input className="form-control" value={statusNotes}
                onChange={e => setStatusNotes(e.target.value)} placeholder="Reason for change…" />
            </div>
            <button className="btn btn-primary"
              disabled={editStatus === task.status}
              onClick={handleStatusUpdate}>
              Save Status
            </button>
          </div>
        </div>

        {/* Assign task */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 className="section-title">Assign Task</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Team Member</label>
              <select className="form-control" value={assignTo}
                onChange={e => setAssignTo(e.target.value)}>
                <option value="">Select member</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary"
              disabled={!assignTo}
              onClick={() => action(
                () => taskApi.assign(id, { assignedToUserId: Number(assignTo) }),
                'Task assigned — email sent!'
              )}>
              Assign &amp; Notify
            </button>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <label className="form-label">Notes (for approve/reject)</label>
            <input className="form-control" value={notes}
              onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
          </div>
        </div>

        {/* Progress history */}
        <div className="card">
          <h3 className="section-title">Progress History</h3>
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
