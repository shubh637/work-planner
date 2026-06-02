import React from 'react'

const STATUSES = ['PENDING','APPROVED','REJECTED','OPEN','IN_PROGRESS','CLOSED']

const STATUS_COLORS = {
  PENDING:     '#f59e0b',
  APPROVED:    '#10b981',
  REJECTED:    '#ef4444',
  OPEN:        '#0ea5e9',
  IN_PROGRESS: '#8b5cf6',
  CLOSED:      '#64748b',
}

const FilterIcon = ({ d }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
    <path d={d} />
  </svg>
)

export default function FilterBar({ projects, members, filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value || undefined })
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div style={{
      display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
      marginBottom: '22px', padding: '14px 18px',
      background: '#fff', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)',
    }}>
      {/* Project */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 12px', height: '38px', minWidth: '160px' }}>
        <FilterIcon d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z M8 2v4 M16 2v4" />
        <select
          value={filters.projectId || ''}
          onChange={e => set('projectId', e.target.value)}
          style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
        >
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Member */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 12px', height: '38px', minWidth: '160px' }}>
        <FilterIcon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        <select
          value={filters.assignedTo || ''}
          onChange={e => set('assignedTo', e.target.value)}
          style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.82rem', fontWeight: 500, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
        >
          <option value="">All Members</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUSES.map(s => {
          const active = filters.status === s
          const color = STATUS_COLORS[s]
          return (
            <button
              key={s}
              onClick={() => onChange({ ...filters, status: active ? undefined : s })}
              style={{
                padding: '5px 12px', borderRadius: '999px', border: `1.5px solid ${active ? color : 'var(--border)'}`,
                background: active ? color : 'var(--surface-2)',
                color: active ? '#fff' : 'var(--text-2)',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.7)' : color, flexShrink: 0 }} />
              {s.replace('_', ' ')}
            </button>
          )
        })}
      </div>

      {/* Due date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--surface-2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0 12px', height: '38px' }}>
        <FilterIcon d="M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        <input
          type="date"
          value={filters.date || ''}
          onChange={e => set('date', e.target.value)}
          style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.82rem', fontWeight: 500, color: filters.date ? 'var(--text)' : 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit' }}
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => onChange({})}
          style={{
            padding: '5px 14px', borderRadius: '999px', border: '1.5px solid var(--red)',
            background: 'var(--red-light)', color: 'var(--red)',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: '5px',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Clear
        </button>
      )}
    </div>
  )
}
