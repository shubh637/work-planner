import React from 'react'

export default function ReportTable({ data, onExport }) {
  if (!data || data.length === 0) {
    return <p className="text-muted">No data available.</p>
  }

  const headers = ['Label', ...Object.keys(data[0].counts), 'Total']

  return (
    <div>
      {onExport && (
        <div style={{ marginBottom: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onExport}>
            Export CSV
          </button>
        </div>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td>{row.label}</td>
                {Object.values(row.counts).map((v, j) => <td key={j}>{v}</td>)}
                <td><strong>{row.total}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function exportToCsv(filename, data) {
  if (!data.length) return
  const headers = ['Label', ...Object.keys(data[0].counts), 'Total']
  const rows = data.map(row => [
    row.label,
    ...Object.values(row.counts),
    row.total
  ])
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
