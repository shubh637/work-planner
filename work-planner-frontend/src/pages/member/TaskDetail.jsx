import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi } from '../../api/api'

export default function TaskDetailMember() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask]         = useState(null)
  const [history, setHistory]   = useState([])
  const [notes, setNotes]       = useState('')
  const [msg, setMsg]           = useState('')
  const [msgType, setMsgType]   = useState('success')
  const [loading, setLoading]   = useState('')

  const load = () => {
    taskApi.getById(id).then(r => setTask(r.data))
    taskApi.getHistory(id).then(r => setHistory(r.data))
  }

  useEffect(() => { load() }, [id])

  const flash = (text, type = 'success') => { setMsg(text); setMsgType(type) }

  const handlePostUpdate = async () => {
    if (!notes.trim()) { flash('Please write an update before posting.', 'error'); return }
    setLoading('update')
    try {
      await taskApi.postUpdate(id, { notes })
      setNotes('')
      flash('Update posted.')
      load()
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to post update.', 'error')
    } finally { setLoading('') }
  }

  const handleMarkComplete = async () => {
    setLoading('complete')
    try {
      await taskApi.markComplete(id, { notes })
      setNotes('')
      flash('Task marked as complete!')
      load()
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to complete task.', 'error')
    } finally { setLoading('') }
  }

  if (!task) return <Layout><div className="page">Loading…</div></Layout>

  const isActive = ['OPEN', 'IN_PROGRESS', 'APPROVED'].includes(task.status)
  const isDone   = task.status === 'CLOSED'

  return (
    <Layout>
      <div className="page container">
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}
          onClick={() => navigate(-1)}>← Back</button>

        {msg && (
          <div className={`alert alert-${msgType}`} style={{ marginBottom: '1rem' }}>{msg}</div>
        )}

        {/* Task info */}
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

        {/* Post update + complete */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h3 className="section-title">Post Update</h3>

          {isDone ? (
            <p className="text-muted">This task is completed.</p>
          ) : isActive ? (
            <>
              <div className="form-group">
                <textarea className="form-control" rows={3} value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe what you've done or any blockers…" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={handlePostUpdate}
                  disabled={loading === 'update'}>
                  {loading === 'update' ? 'Posting…' : 'Post Update'}
                </button>
                <button className="btn btn-primary" onClick={handleMarkComplete}
                  disabled={loading === 'complete'}>
                  {loading === 'complete' ? 'Completing…' : '✓ Mark as Complete'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-muted">Status cannot be changed from here.</p>
          )}
        </div>

        {/* History */}
        <div className="card">
          <h3 className="section-title">Activity</h3>
          {history.length === 0 ? <p className="text-muted">No activity yet.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[...history].reverse().map(h => (
                <div key={h.id} style={{ borderLeft: '3px solid #e2e8f0', paddingLeft: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#94a3b8' }}>
                    <span><strong style={{ color: '#334155' }}>{h.changedByName}</strong>
                      {h.oldStatus !== h.newStatus
                        ? <> · <ProgressBadge status={h.oldStatus} /> → <ProgressBadge status={h.newStatus} /></>
                        : <> · posted an update</>}
                    </span>
                    <span>{new Date(h.changedAt).toLocaleString()}</span>
                  </div>
                  {h.notes && <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{h.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
