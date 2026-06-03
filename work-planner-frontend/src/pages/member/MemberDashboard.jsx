import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi } from '../../api/api'

const STATUS_META = {
  OPEN:        { dot: '#0ea5e9', label: 'Open' },
  IN_PROGRESS: { dot: '#8b5cf6', label: 'In Progress' },
  CLOSED:      { dot: '#64748b', label: 'Closed' },
}

const isOverdue = t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'CLOSED'

export default function MemberDashboard() {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch]   = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeStatus = searchParams.get('status') || ''

  const fetchTasks = () => {
    setLoading(true)
    setLoadError(false)
    taskApi.getMyTasks()
      .then(r => setTasks(r.data))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTasks() }, [])

  const open       = tasks.filter(t => t.status === 'OPEN').length
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const closed     = tasks.filter(t => t.status === 'CLOSED').length

  const displayed = tasks.filter(t =>
    (!activeStatus || t.status === activeStatus) &&
    (!search.trim() || t.title.toLowerCase().includes(search.toLowerCase()))
  )

  const handleStatClick = (status) => {
    if (activeStatus === status) navigate('/member')
    else navigate(`/member?status=${status}`)
  }

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <div>
            <h1 className="page-title">All Tasks</h1>
            <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned</p>
          </div>
          <Link to="/member/suggestions" className="btn btn-primary">+ Suggest a Task</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading…
          </div>
        ) : loadError ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontWeight: 600, marginBottom: '12px' }}>Failed to load tasks</p>
            <button className="btn btn-secondary" onClick={fetchTasks}>Retry</button>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="stat-grid" style={{ marginBottom: '28px' }}>
              {Object.entries(STATUS_META).map(([s, m]) => {
                const count = s === 'OPEN' ? open : s === 'IN_PROGRESS' ? inProgress : closed
                const isActive = activeStatus === s
                return (
                  <div key={s} className="stat-card" onClick={() => handleStatClick(s)} style={{
                    cursor: 'pointer',
                    borderTop: `4px solid ${m.dot}`,
                    outline: isActive ? `2px solid ${m.dot}` : 'none',
                    outlineOffset: '2px',
                    transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}
                  >
                    <div className="stat-number" style={{ color: m.dot }}>{count}</div>
                    <div className="stat-label">{m.label}</div>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                {activeStatus ? `${STATUS_META[activeStatus]?.label} Tasks` : 'My Tasks'}
                {activeStatus && (
                  <button onClick={() => navigate('/member')} style={{
                    marginLeft: '10px', background: 'none', border: '1px solid var(--border)',
                    borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem',
                    color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    Clear filter ×
                  </button>
                )}
              </h2>
              <div style={{ position: 'relative' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tasks…"
                  className="form-control"
                  style={{ paddingLeft: 30, width: 200, height: 36, fontSize: '0.85rem' }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
                    padding: '2px', lineHeight: 1, fontSize: '1rem',
                  }}>×</button>
                )}
              </div>
            </div>

            {displayed.length === 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }}>
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
                </svg>
                {activeStatus ? `No ${STATUS_META[activeStatus]?.label.toLowerCase()} tasks.` : search.trim() ? 'No tasks match your search.' : 'No tasks assigned to you yet.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {displayed.map(t => (
                  <div key={t.id} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderLeft: `4px solid ${isOverdue(t) ? '#ef4444' : (STATUS_META[t.status]?.dot || 'var(--brand)')}`,
                    borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    boxShadow: 'var(--shadow-xs)', transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateX(3px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'translateX(0)' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text)' }}>{t.title}</span>
                        <ProgressBadge status={t.status} />
                        {isOverdue(t) && (
                          <span style={{ background: 'var(--red-light)', color: 'var(--red)', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', border: '1px solid #fca5a5' }}>Overdue</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          {t.projectName}
                        </span>
                        {t.dueDate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isOverdue(t) ? 'var(--red)' : 'var(--text-2)', fontWeight: isOverdue(t) ? 600 : 400 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isOverdue(t) ? 1 : 0.5 }}><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
                            {t.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link to={`/member/tasks/${t.id}`} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Update</Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
