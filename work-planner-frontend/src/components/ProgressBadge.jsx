import React from 'react'

const STATUS_CLASS = {
  PENDING:     'badge-pending',
  APPROVED:    'badge-approved',
  REJECTED:    'badge-rejected',
  OPEN:        'badge-open',
  IN_PROGRESS: 'badge-in_progress',
  CLOSED:      'badge-closed',
}

export default function ProgressBadge({ status }) {
  const cls = STATUS_CLASS[status] || 'badge-pending'
  return <span className={`badge ${cls}`}>{status?.replace('_', ' ')}</span>
}
