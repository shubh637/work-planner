import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { taskApi } from "../../api/api";

const STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "OPEN",
  "IN_PROGRESS",
  "CLOSED",
];

export default function ManagerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskApi
      .getFiltered({})
      .then((r) => setTasks(r.data))
      .finally(() => setLoading(false));
  }, []);

  const countOf = (status) => tasks.filter((t) => t.status === status).length;

  return (
    <Layout>
      <div className="page container">
        <div className="page-header">
          <h1 className="page-title">Manager Dashboard</h1>
          <Link to="/manager/tasks" className="btn btn-primary">
            View All Tasks
          </Link>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            <div className="stat-grid">
              {STATUSES.map((s) => (
                <div key={s} className="stat-card">
                  <div className="stat-number">{countOf(s)}</div>
                  <div className="stat-label">{s.replace("_", " ")}</div>
                </div>
              ))}
            </div>

            <h2 className="section-title">Pending Approval</h2>
            {tasks.filter((t) => t.status === "PENDING").length === 0 ? (
              <p className="text-muted">No tasks awaiting approval.</p>
            ) : (
              tasks
                .filter((t) => t.status === "PENDING")
                .map((task) => (
                  <div key={task.id} className="task-card">
                    <div>
                      <div className="task-card-title">{task.title}</div>
                      <div className="task-card-meta">
                        <span>Project: {task.projectName}</span>
                        <span style={{ margin: "0 8px" }}></span>
                        <span>
                          By: {task.suggestedByName || task.createdByName}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/manager/tasks/${task.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      Review
                    </Link>
                  </div>
                ))
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
