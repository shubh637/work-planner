import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi } from '../../api/api'

const NEXT_STATUS = { OPEN: 'IN_PROGRESS', IN_PROGRESS: 'CLOSED' }
const STATUS_LABEL = { IN_PROGRESS: 'Start Work', CLOSED: 'Mark Complete' }

export default function TaskDetailMember() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask]       = useState(null)
  const [history, setHistory] = useState([])
  const [notes, setNotes]     = useState('')
  const [msg, setMsg]         = useState('')
  const [msgType, setMsgType] = useState('success')

  const load = () => {
    taskApi.getById(id).then(r => setTask(r.data))
    taskApi.getHistory(id).then(r => setHistory(r.data))
  }

  useEffect(() => { load() }, [id])

  const advance = async () => {
    try {
      await taskApi.advanceProgress(id, { notes })
      setNotes('')
      setMsgType('success')
      setMsg(`Status updated to ${NEXT_STATUS[task.status].replace('_', ' ')}`)
      load()
    } catch (err) {
      setMsgType('error')
      setMsg(err.response?.data?.message || 'Error updating status')
    }
  }

  if (!task) return <Layout><div className="page">Loading…</div></Layout>

  const nextStatus = NEXT_STATUS[task.status]
  const canAdvance = !!nextStatus

  return (
    <Layout>
      <div className="page container">
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}
          onClick={() => navigate(-1)}>← Back</button>

        {msg && (
          <div className={`alert alert-${msgType}`} style={{ marginBottom: '1rem' }}>{msg}</div>
        )}

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>{task.title}</h2>
              <ProgressBadge status={task.status} />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div><span className="text-muted">Project:</span> {task.projectName}</div>
            <div><span className="text-muted">Due:</span> {task.dueDate || '-'}</div>
          </div>
          {task.description && (
            <div style={{ marginTop: '0.75rem' }}>
              <span className="text-muted">Description:</span>
              <p style={{ marginTop: '0.25rem' }}>{task.description}</p>
            </div>
          )}
        </div>

        {/* Status update */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 className="section-title">Update Status</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.82rem' }}>Current:</span>
              <ProgressBadge status={task.status} />
            </div>
            {canAdvance && (
              <>
                <span style={{ color: '#94a3b8', fontSize: '1.1rem' }}>→</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>Next:</span>
                  <ProgressBadge status={nextStatus} />
                </div>
              </>
            )}
          </div>

          {canAdvance ? (
            <>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-control" value={notes}
                  onChange={e => setNotes(e.target.value)} placeholder="What did you do?" />
              </div>
              <button className="btn btn-primary" onClick={advance}>
                {STATUS_LABEL[nextStatus]}
              </button>
            </>
          ) : (
            <p className="text-muted">
              {task.status === 'CLOSED'
                ? 'This task is completed.'
                : 'Status cannot be changed from here.'}
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">History</h3>
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
