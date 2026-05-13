import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi } from '../../api/api'

export default function MemberDashboard() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    taskApi.getMyTasks().then(r => setTasks(r.data)).finally(() => setLoading(false))
  }, [])

  const open = tasks.filter(t => t.status === 'OPEN').length
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const closed = tasks.filter(t => t.status === 'CLOSED').length

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <h1 className="page-title">My Dashboard</h1>
          <Link to="/member/suggest" className="btn btn-primary">Suggest a Task</Link>
        </div>

        {loading ? <p>Loading…</p> : (
          <>
            <div className="stat-grid">
              <div className="stat-card"><div className="stat-number">{open}</div><div className="stat-label">Open</div></div>
              <div className="stat-card"><div className="stat-number">{inProgress}</div><div className="stat-label">In Progress</div></div>
              <div className="stat-card"><div className="stat-number">{closed}</div><div className="stat-label">Closed</div></div>
            </div>

            <h2 style={{ marginBottom: '0.75rem', fontWeight: 600 }}>My Tasks</h2>
            {tasks.length === 0
              ? <p className="text-muted">No tasks assigned to you yet.</p>
              : tasks.map(t => (
                <div key={t.id} className="task-card">
                  <div>
                    <div className="task-card-title">{t.title}</div>
                    <div className="task-card-meta">
                      Project: {t.projectName}
                      {t.dueDate && <> &bull; Due: {t.dueDate}</>}
                    </div>
                    <div style={{ marginTop: '0.4rem' }}><ProgressBadge status={t.status} /></div>
                  </div>
                  <Link to={`/member/tasks/${t.id}`} className="btn btn-primary btn-sm">Update</Link>
                </div>
              ))
            }
          </>
        )}
      </div>
    </Layout>
  )
}
