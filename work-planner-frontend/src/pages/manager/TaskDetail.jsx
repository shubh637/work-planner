import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi, userApi } from '../../api/api'
import { useToast } from '../../context/ToastContext'

const STATUS_DOT = {
  PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444',
  OPEN: '#0ea5e9', IN_PROGRESS: '#8b5cf6', CLOSED: '#64748b',
}
const ALL_STATUSES = ['PENDING','APPROVED','REJECTED','OPEN','IN_PROGRESS','CLOSED']

function Icon({ d, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

function MetaBox({ icon, label, value, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
        background: highlight ? 'var(--amber-light)' : 'var(--surface-2)',
        border: `1px solid ${highlight ? '#fde68a' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: highlight ? 'var(--amber)' : 'var(--text-3)',
      }}>
        <Icon d={icon} size={14} />
      </div>
      <div>
        <div className="detail-label">{label}</div>
        <div className="detail-value" style={{ marginTop: '2px' }}>{value}</div>
      </div>
    </div>
  )
}

export default function TaskDetailManager() {
  const { id } = useParams()
  const { showToast } = useToast()
  const [task, setTask]               = useState(null)
  const [loadError, setLoadError]     = useState(false)
  const [history, setHistory]         = useState([])
  const [members, setMembers]         = useState([])
  const [assignTo, setAssignTo]       = useState('')
  const [notes, setNotes]             = useState('')
  const [editStatus, setEditStatus]   = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [acting, setActing]           = useState(false)

  const load = () => {
    taskApi.getById(id)
      .then(r => { setTask(r.data); setEditStatus(r.data.status) })
      .catch(() => setLoadError(true))
    taskApi.getHistory(id).then(r => setHistory(r.data))
  }

  useEffect(() => {
    load()
    userApi.getMembers().then(r => setMembers(r.data))
  }, [id])

  const action = async (fn, successMsg) => {
    if (acting) return
    setActing(true)
    try { await fn(); showToast(successMsg); load() }
    catch (err) { showToast(err.response?.data?.message || 'Error', 'error') }
    finally { setActing(false) }
  }

  if (loadError) return (
    <Layout>
      <div className="page container" style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--text-3)' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style={{ fontWeight: 600 }}>Failed to load task</p>
        <button className="btn btn-secondary" style={{ marginTop: '12px' }} onClick={() => { setLoadError(false); load() }}>Retry</button>
      </div>
    </Layout>
  )

  if (!task) return (
    <Layout>
      <div className="page container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div className="spinner spinner-lg" />
      </div>
    </Layout>
  )

  const dot = STATUS_DOT[task.status] || 'var(--brand)'
  const isPending = task.status === 'PENDING'
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'CLOSED'

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
                {task.suggestedByName && (
                  <span style={{ background: 'var(--amber-light)', color: '#92400e', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', border: '1px solid #fde68a' }}>
                    Suggestion
                  </span>
                )}
              </div>
            </div>
            {isPending && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
                <button className="btn btn-success btn-sm" disabled={acting} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                  onClick={() => action(() => taskApi.approve(id, { notes }), 'Task approved')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {acting ? 'Saving…' : 'Approve'}
                </button>
                <button className="btn btn-danger btn-sm" disabled={acting} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                  onClick={() => action(() => taskApi.reject(id, { notes }), 'Task rejected')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  {acting ? 'Saving…' : 'Reject'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', fontSize: '0.875rem' }}>
            <MetaBox icon="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" label="Project" value={task.projectName} />
            <MetaBox icon="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" label="Due Date" value={task.dueDate || '—'} highlight={isOverdue} />
            <MetaBox icon="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" label="Assignee" value={task.assignedToName || 'Unassigned'} />
            <MetaBox icon="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" label="Created By" value={task.createdByName} />
            {task.suggestedByName && (
              <MetaBox icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" label="Suggested By" value={task.suggestedByName} />
            )}
          </div>

          {task.description && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div className="detail-label" style={{ marginBottom: '6px' }}>Description</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>{task.description}</p>
            </div>
          )}
        </div>

        {/* Actions row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* Assign */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 className="section-title" style={{ marginBottom: '14px' }}>Assign Task</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select className="form-control" value={assignTo} onChange={e => setAssignTo(e.target.value)}>
                <option value="">Select team member…</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Notes for member (optional)</label>
                <input className="form-control" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any instructions…" />
              </div>
              <button className="btn btn-primary" disabled={!assignTo || acting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
                onClick={() => action(() => taskApi.assign(id, { assignedToUserId: Number(assignTo) }), 'Task assigned — email sent!')}>
                <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={13} />
                {acting ? 'Saving…' : 'Assign & Notify'}
              </button>
            </div>
          </div>

          {/* Edit Status */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <h3 className="section-title" style={{ marginBottom: '14px' }}>Change Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>Reason (optional)</label>
                <input className="form-control" value={statusNotes} onChange={e => setStatusNotes(e.target.value)} placeholder="Reason for change…" />
              </div>
              <button className="btn btn-primary" disabled={editStatus === task.status || acting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
                onClick={() => action(() => taskApi.update(id, { status: editStatus, statusNotes }), `Status updated to ${editStatus.replace('_', ' ')}`)}>
                <Icon d="M20 6L9 17l-5-5" size={13} />
                {acting ? 'Saving…' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>

        {/* Activity timeline */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 className="section-title" style={{ marginBottom: '20px' }}>Activity</h3>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)' }}>
              <Icon d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" size={28} />
              <p style={{ marginTop: '8px', fontSize: '0.875rem' }}>No activity yet.</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 15, top: 8, bottom: 8, width: 2, background: 'var(--border)', borderRadius: 2 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[...history].reverse().map((h, i) => {
                  const isStatusChange = h.oldStatus !== h.newStatus
                  const dotColor = isStatusChange ? (STATUS_DOT[h.newStatus] || 'var(--brand)') : 'var(--brand)'
                  return (
                    <div key={h.id} style={{ display: 'flex', gap: '16px', paddingBottom: i < history.length - 1 ? '20px' : 0 }}>
                      <div style={{ flexShrink: 0, width: 32, display: 'flex', justifyContent: 'center', paddingTop: '3px' }}>
                        <div style={{
                          width: 12, height: 12, borderRadius: '50%',
                          background: dotColor, border: '2px solid var(--surface)',
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
