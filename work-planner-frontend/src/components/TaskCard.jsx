import React from 'react'
import { useNavigate } from 'react-router-dom'
import ProgressBadge from './ProgressBadge'

export default function TaskCard({ task, actions }) {
  const navigate = useNavigate()

  return (
    <div className="task-card">
      <div style={{ flex: 1 }}>
        <div className="task-card-title">{task.title}</div>
        <div className="task-card-meta">
          Project: {task.projectName}
          {task.assignedToName && <> &bull; Assignee: {task.assignedToName}</>}
          {task.dueDate && <> &bull; Due: {task.dueDate}</>}
        </div>
        <div style={{ marginTop: '0.4rem' }}>
          <ProgressBadge status={task.status} />
        </div>
      </div>
      <div className="task-card-actions">
        {actions}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(`/manager/tasks/${task.id}`)}
        >
          View
        </button>
      </div>
    </div>
  )
}
