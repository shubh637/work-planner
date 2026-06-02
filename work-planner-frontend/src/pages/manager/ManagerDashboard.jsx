import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { taskApi } from "../../api/api";

const STATUS_META = {
  PENDING:     { label: 'Pending',     dot: '#f59e0b', color: '#92400e', bg: '#fef3c7' },
  APPROVED:    { label: 'Approved',    dot: '#10b981', color: '#065f46', bg: '#d1fae5' },
  REJECTED:    { label: 'Rejected',    dot: '#ef4444', color: '#991b1b', bg: '#fee2e2' },
  OPEN:        { label: 'Open',        dot: '#0ea5e9', color: '#0c4a6e', bg: '#e0f2fe' },
  IN_PROGRESS: { label: 'In Progress', dot: '#8b5cf6', color: '#5b21b6', bg: '#ede9fe' },
  CLOSED:      { label: 'Closed',      dot: '#64748b', color: '#374151', bg: '#f1f5f9' },
}

export default function ManagerDashboard() {
  const [tasks, setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    taskApi.getFiltered({}).then((r) => setTasks(r.data)).finally(() => setLoading(false));
  }, []);

  const countOf = (status) => tasks.filter((t) => t.status === status).length;

  const dueSoon = tasks.filter(t => {
    if (!t.dueDate || t.status === 'CLOSED') return false
    const days = (new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
    return days >= 0 && days <= 3
  })

  const dueDayLabel = (dueDate) => {
    const days = (new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24)
    if (days < 1) return 'Due today'
    if (days < 2) return 'Due tomorrow'
    return `Due in ${Math.ceil(days)} days`
  }

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">{tasks.length} total tasks</p>
          </div>
          <Link to="/manager/tasks" className="btn btn-primary">View All Tasks</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading…
          </div>
        ) : (
          <>
            {/* Stat grid */}
            <div className="stat-grid">
              {Object.entries(STATUS_META).map(([status, meta]) => (
                <div key={status} className="stat-card" style={{ cursor: 'pointer', borderTop: `4px solid ${meta.dot}` }}
                  onClick={() => navigate(`/manager/tasks?status=${status}`)}>
                  <div className="stat-number" style={{ color: meta.dot }}>{countOf(status)}</div>
                  <div className="stat-label">{meta.label}</div>
                </div>
              ))}
            </div>

            {/* Due Soon */}
            {dueSoon.length > 0 && (
              <>
                <h2 className="section-title" style={{ marginBottom: '14px', marginTop: '28px' }}>
                  Due Soon
                  <span style={{ marginLeft: '8px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                    {dueSoon.length}
                  </span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                  {dueSoon.map(task => (
                    <div key={task.id} style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderLeft: '4px solid #f59e0b', borderRadius: 'var(--radius-lg)',
                      padding: '16px 20px', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', gap: '16px',
                      boxShadow: 'var(--shadow-xs)', transition: 'box-shadow 0.15s, transform 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateX(3px)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'translateX(0)' }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text)', marginBottom: '5px' }}>{task.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            {task.projectName}
                          </span>
                          {task.assignedToName && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              {task.assignedToName}
                            </span>
                          )}
                          <span style={{ color: '#d97706', fontWeight: 600 }}>{dueDayLabel(task.dueDate)}</span>
                        </div>
                      </div>
                      <Link to={`/manager/tasks/${task.id}`} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pending approval */}
            <h2 className="section-title" style={{ marginBottom: '14px' }}>
              Pending Approval
              {tasks.filter(t => t.status === 'PENDING').length > 0 && (
                <span style={{ marginLeft: '8px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                  {tasks.filter(t => t.status === 'PENDING').length}
                </span>
              )}
            </h2>

            {tasks.filter(t => t.status === 'PENDING').length === 0 ? (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                All caught up — no tasks awaiting approval.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tasks.filter(t => t.status === 'PENDING').map(task => (
                  <div key={task.id} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderLeft: '4px solid #f59e0b', borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '16px',
                    boxShadow: 'var(--shadow-xs)', transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateX(3px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = 'translateX(0)' }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text)', marginBottom: '5px' }}>{task.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                          {task.projectName}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          {task.suggestedByName || task.createdByName}
                        </span>
                      </div>
                    </div>
                    <Link to={`/manager/tasks/${task.id}`} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
