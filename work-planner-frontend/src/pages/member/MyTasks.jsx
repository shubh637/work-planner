import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import ProgressBadge from '../../components/ProgressBadge'
import { taskApi } from '../../api/api'

export default function MyTasks() {
  const [tasks, setTasks]   = useState([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    taskApi.getMyTasks().then(r => setTasks(r.data))
  }, [])

  const filtered = filter ? tasks.filter(t => t.status === filter) : tasks

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <h1 className="page-title">My Tasks</h1>
          <select className="form-control" style={{ width: 'auto' }} value={filter}
            onChange={e => setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {['APPROVED','OPEN','IN_PROGRESS','CLOSED'].map(s =>
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            )}
          </select>
        </div>

        {filtered.length === 0 ? <p className="text-muted">No tasks found.</p>
          : filtered.map(t => (
            <div key={t.id} className="task-card">
              <div>
                <div className="task-card-title">{t.title}</div>
                <div className="task-card-meta">
                  Project: {t.projectName}
                  {t.dueDate && <> &bull; Due: {t.dueDate}</>}
                </div>
                <div style={{ marginTop: '0.4rem' }}><ProgressBadge status={t.status} /></div>
              </div>
              <Link to={`/member/tasks/${t.id}`} className="btn btn-primary btn-sm">View / Update</Link>
            </div>
          ))
        }
      </div>
    </Layout>
  )
}
