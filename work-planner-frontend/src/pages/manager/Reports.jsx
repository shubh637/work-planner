import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { taskApi } from '../../api/api'

const STATUS_META = {
  PENDING:     { bg: '#fef3c7', color: '#92400e', border: '#fde68a', dot: '#f59e0b', label: 'Pending' },
  APPROVED:    { bg: '#d1fae5', color: '#065f46', border: '#a7f3d0', dot: '#10b981', label: 'Approved' },
  REJECTED:    { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', dot: '#ef4444', label: 'Rejected' },
  OPEN:        { bg: '#e0f2fe', color: '#0c4a6e', border: '#bae6fd', dot: '#0ea5e9', label: 'Open' },
  IN_PROGRESS: { bg: '#ede9fe', color: '#5b21b6', border: '#c4b5fd', dot: '#8b5cf6', label: 'In Progress' },
  CLOSED:      { bg: '#f1f5f9', color: '#374151', border: '#e2e8f0', dot: '#64748b', label: 'Closed' },
}

const SUMMARY_CARDS = [
  { key: 'total',       label: 'Total',       color: '#6366f1', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
  { key: 'open',        label: 'Open',        color: '#0ea5e9', icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z M12 8v4 M12 16h.01' },
  { key: 'inProgress',  label: 'In Progress', color: '#8b5cf6', icon: 'M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83' },
  { key: 'closed',      label: 'Closed',      color: '#10b981', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3' },
]

function SvgIcon({ d, size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_META[status] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', dot: '#94a3b8', label: status }
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: '5px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

export default function Reports() {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    taskApi.getFiltered({}).then(r => setTasks(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = tasks.filter(t => {
    const matchSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedToName?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || t.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    total:      tasks.length,
    open:       tasks.filter(t => t.status === 'OPEN').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    closed:     tasks.filter(t => t.status === 'CLOSED').length,
  }

  const isOverdue = t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'CLOSED'

  const exportCsv = () => {
    const headers = ['Task', 'Project', 'Assigned To', 'Status', 'Due Date']
    const rows = filtered.map(t => [
      `"${t.title}"`, `"${t.projectName || '-'}"`,
      `"${t.assignedToName || 'Unassigned'}"`, t.status, t.dueDate || '-'
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'tasks-report.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      <div className="page container">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">{filtered.length} task{filtered.length !== 1 ? 's' : ''} shown</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={exportCsv}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <SvgIcon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3" size={14} />
            Export CSV
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {SUMMARY_CARDS.map(c => (
            <div key={c.key} style={{
              background: '#fff', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)', borderTop: `4px solid ${c.color}`,
              padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{c.label}</span>
                <span style={{ background: `${c.color}18`, borderRadius: '8px', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SvgIcon d={c.icon} size={14} style={{ color: c.color }} />
                </span>
              </div>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{counts[c.key]}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
          marginBottom: '20px', padding: '14px 18px',
          background: '#fff', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)',
        }}>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 12px', height: '38px', flex: '1', minWidth: '200px', maxWidth: '300px' }}>
            <SvgIcon d="M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" size={14} style={{ opacity: 0.45, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search task, project, member…"
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.82rem', color: 'var(--text)', fontFamily: 'inherit', width: '100%' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-3)', display: 'flex' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Status pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Object.entries(STATUS_META).map(([k, v]) => {
              const active = filterStatus === k
              return (
                <button key={k} onClick={() => setFilterStatus(active ? '' : k)} style={{
                  padding: '5px 12px', borderRadius: '999px',
                  border: `1.5px solid ${active ? v.dot : 'var(--border)'}`,
                  background: active ? v.dot : 'var(--surface-2)',
                  color: active ? '#fff' : 'var(--text-2)',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.7)' : v.dot, flexShrink: 0 }} />
                  {v.label}
                </button>
              )
            })}
          </div>

          {(search || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterStatus('') }} style={{
              padding: '5px 14px', borderRadius: '999px', border: '1.5px solid var(--red)',
              background: 'var(--red-light)', color: 'var(--red)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Clear
            </button>
          )}
        </div>

        {/* Task list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading tasks…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 6 }}>No tasks found</p>
            <p style={{ fontSize: '0.875rem' }}>Try adjusting your search or status filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((t, i) => (
              <div key={t.id} style={{
                background: '#fff', border: '1px solid var(--border)',
                borderLeft: `4px solid ${isOverdue(t) ? '#ef4444' : (STATUS_META[t.status]?.dot || 'var(--brand)')}`,
                borderRadius: 'var(--radius-lg)', padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: '16px',
                boxShadow: 'var(--shadow-xs)', transition: 'box-shadow 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateX(3px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'translateX(0)' }}
              >
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', minWidth: '24px' }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{t.title}</span>
                    <StatusBadge status={t.status} />
                    {isOverdue(t) && (
                      <span style={{ background: '#fee2e2', color: '#ef4444', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', border: '1px solid #fca5a5' }}>Overdue</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-2)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <SvgIcon d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z M8 2v4 M16 2v4" size={13} style={{ opacity: 0.5 }} />
                      {t.projectName || <span style={{ color: 'var(--text-3)' }}>No project</span>}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <SvgIcon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={13} style={{ opacity: 0.5 }} />
                      {t.assignedToName || <span style={{ color: 'var(--text-3)' }}>Unassigned</span>}
                    </span>
                    {t.dueDate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isOverdue(t) ? '#ef4444' : 'var(--text-2)', fontWeight: isOverdue(t) ? 600 : 400 }}>
                        <SvgIcon d="M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" size={13} style={{ opacity: isOverdue(t) ? 1 : 0.5 }} />
                        {t.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
