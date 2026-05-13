import React from 'react'

const STATUSES = ['PENDING','APPROVED','REJECTED','OPEN','IN_PROGRESS','CLOSED']

export default function FilterBar({ projects, members, filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="filter-bar">
      <div>
        <label className="form-label">Project</label>
        <select className="form-control" value={filters.projectId || ''} onChange={e => set('projectId', e.target.value || undefined)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Team Member</label>
        <select className="form-control" value={filters.assignedTo || ''} onChange={e => set('assignedTo', e.target.value || undefined)}>
          <option value="">All Members</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Status</label>
        <select className="form-control" value={filters.status || ''} onChange={e => set('status', e.target.value || undefined)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>
      <div>
        <label className="form-label">Due Date</label>
        <input type="date" className="form-control" value={filters.date || ''} onChange={e => set('date', e.target.value || undefined)} />
      </div>
      <button className="btn btn-secondary btn-sm" onClick={() => onChange({})}>Clear</button>
    </div>
  )
}
