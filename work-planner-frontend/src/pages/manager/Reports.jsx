import React, { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import ReportTable, { exportToCsv } from '../../components/ReportTable'
import { reportApi } from '../../api/api'

const TABS = ['By Status', 'By Project', 'By Member']

export default function Reports() {
  const [tab, setTab]   = useState(0)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const loaders = [
    () => reportApi.tasksByStatus({}),
    () => reportApi.tasksByProject(),
    () => reportApi.tasksByMember(),
  ]

  useEffect(() => {
    setLoading(true)
    loaders[tab]()
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [tab])

  const tabNames = ['tasks-by-status', 'tasks-by-project', 'tasks-by-member']

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <h1 className="page-title">Reports</h1>
        </div>

        <div className="card">
          <div className="tabs">
            {TABS.map((t, i) => (
              <button key={t} className={`tab-btn${tab === i ? ' active' : ''}`}
                onClick={() => setTab(i)}>{t}</button>
            ))}
          </div>

          {loading ? <p>Loading…</p> : (
            <ReportTable
              data={data}
              onExport={() => exportToCsv(`${tabNames[tab]}.csv`, data)}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}
