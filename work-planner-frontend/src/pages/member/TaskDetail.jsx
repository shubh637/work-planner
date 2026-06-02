import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi } from '../../api/api'
import { useToast } from '../../context/ToastContext'

const STATUS_DOT = {
  OPEN: '#0ea5e9', IN_PROGRESS: '#8b5cf6', APPROVED: '#10b981',
  CLOSED: '#64748b', PENDING: '#f59e0b', REJECTED: '#ef4444',
}

function SvgIcon({ d, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

export default function TaskDetailMember() {
  const { id } = useParams()
  const { showToast } = useToast()
  const [task, setTask]       = useState(null)
  const [history, setHistory] = useState([])
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState('')

  const load = () => {
    taskApi.getById(id).then(r => setTask(r.data))
    taskApi.getHistory(id).then(r => setHistory(r.data))
  }

  useEffect(() => { load() }, [id])

  const handlePostUpdate = async () => {
    if (!notes.trim()) { showToast('Please write an update before posting.', 'error'); return }
    setLoading('update')
    try {
      await taskApi.postUpdate(id, { notes })
      setNotes(''); showToast('Update posted.'); load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post update.', 'error')
    } finally { setLoading('') }
  }

  const handleStartTask = async () => {
    setLoading('start')
    try {
      await taskApi.advanceProgress(id, {})
      showToast('Task started — status changed to In Progress!')
      load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start task.', 'error')
    } finally { setLoading('') }
  }

  const handleMarkComplete = async () => {
    setLoading('complete')
    try {
      await taskApi.markComplete(id, { notes })
      setNotes(''); showToast('Task marked as complete!'); load()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete task.', 'error')
    } finally { setLoading('') }
  }

  if (!task) return (
    <Layout>
      <div className="page container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div className="spinner spinner-lg" />
      </div>
    </Layout>
  )

  const isActive = ['OPEN', 'IN_PROGRESS', 'APPROVED'].includes(task.status)
  const isDone   = task.status === 'CLOSED'
  const dot      = STATUS_DOT[task.status] || 'var(--brand)'
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone

  return (
    <Layout>
      <div className="page container">

        {/* Task header card */}
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', borderTop: `4px solid ${dot}`,
          padding: '24px', marginBottom: '16px', boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '10px' }}>{task.title}</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <ProgressBadge status={task.status} />
                {isOverdue && (
                  <span style={{ background: 'var(--red-light)', color: 'var(--red)', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', border: '1px solid #fca5a5' }}>
                    Overdue
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <SvgIcon d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" size={14} />
              </div>
              <div>
                <div className="detail-label">Project</div>
                <div className="detail-value" style={{ marginTop: '2px' }}>{task.projectName}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: isOverdue ? 'var(--red-light)' : 'var(--surface-2)', border: `1px solid ${isOverdue ? '#fca5a5' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <SvgIcon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" size={14} />
              </div>
              <div>
                <div className="detail-label">Due Date</div>
                <div className="detail-value" style={{ marginTop: '2px', color: isOverdue ? 'var(--red)' : 'var(--text)', fontWeight: isOverdue ? 600 : 500 }}>
                  {task.dueDate || '—'}
                </div>
              </div>
            </div>
          </div>

          {task.description && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div className="detail-label" style={{ marginBottom: '6px' }}>Description</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>{task.description}</p>
            </div>
          )}
        </div>

        {/* Actions card */}
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', padding: '24px',
          marginBottom: '16px', boxShadow: 'var(--shadow-sm)',
        }}>
          <h3 className="section-title" style={{ marginBottom: '16px' }}>
            {isDone ? 'Task Completed' : 'Actions'}
          </h3>

          {isDone ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--green-light)', borderRadius: 'var(--radius)', border: '1px solid #a7f3d0' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#065f46', fontSize: '0.925rem' }}>Task Completed</div>
                <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '2px' }}>Great work! This task has been marked as closed.</div>
              </div>
            </div>
          ) : task.status === 'OPEN' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '16px', background: '#eff6ff', borderRadius: 'var(--radius)', border: '1px solid #bfdbfe' }}>
                <div style={{ fontWeight: 600, color: '#1e40af', fontSize: '0.875rem', marginBottom: '4px' }}>Ready to start?</div>
                <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginBottom: '12px' }}>Click "Start Task" to begin working — this will move it to In Progress.</div>
                <button className="btn btn-primary" onClick={handleStartTask} disabled={loading === 'start'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  {loading === 'start' ? 'Starting…' : 'Start Task'}
                </button>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Post a note (optional)</label>
                <textarea className="form-control" rows={2} value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any notes or comments…" style={{ marginBottom: '10px' }} />
                <button className="btn btn-secondary btn-sm" onClick={handlePostUpdate} disabled={loading === 'update'}>
                  {loading === 'update' ? 'Posting…' : 'Post Note'}
                </button>
              </div>
            </div>
          ) : isActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Progress update</label>
                <textarea className="form-control" rows={3} value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe what you've done, progress made, or any blockers…" />
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={handlePostUpdate} disabled={loading === 'update'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <SvgIcon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={14} />
                  {loading === 'update' ? 'Posting…' : 'Post Update'}
                </button>
                <button className="btn btn-success" onClick={handleMarkComplete} disabled={loading === 'complete'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <SvgIcon d="M20 6L9 17l-5-5" size={14} />
                  {loading === 'complete' ? 'Completing…' : 'Mark as Complete'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-muted">No actions available for this status.</p>
          )}
        </div>

        {/* Activity timeline */}
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', padding: '24px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <h3 className="section-title" style={{ marginBottom: '20px' }}>Activity</h3>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)' }}>
              <SvgIcon d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" size={28} />
              <p style={{ marginTop: '8px', fontSize: '0.875rem' }}>No activity yet.</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 2, background: 'var(--border)', borderRadius: 2 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[...history].reverse().map((h, i) => {
                  const isStatusChange = h.oldStatus !== h.newStatus
                  const dotColor = isStatusChange ? (STATUS_DOT[h.newStatus] || 'var(--brand)') : 'var(--brand)'
                  return (
                    <div key={h.id} style={{ display: 'flex', gap: '16px', paddingBottom: i < history.length - 1 ? '20px' : 0 }}>
                      <div style={{ flexShrink: 0, width: 32, display: 'flex', justifyContent: 'center', paddingTop: '3px' }}>
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%',
                          background: dotColor,
                          border: '2px solid var(--surface)',
                          boxShadow: `0 0 0 2px ${dotColor}44`,
                          zIndex: 1, position: 'relative',
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, paddingBottom: i < history.length - 1 ? '4px' : 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                            <span style={{ fontWeight: 700 }}>{h.changedByName}</span>
                            {isStatusChange ? (
                              <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>
                                {' '}moved task{' '}
                                <ProgressBadge status={h.oldStatus} />
                                <span style={{ margin: '0 5px', color: 'var(--text-3)' }}>→</span>
                                <ProgressBadge status={h.newStatus} />
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-2)', fontWeight: 400 }}> posted an update</span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', flexShrink: 0, marginTop: '2px' }}>
                            {new Date(h.changedAt).toLocaleString()}
                          </span>
                        </div>
                        {h.notes && (
                          <div style={{
                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                            fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.55,
                          }}>
                            {h.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  )
}
