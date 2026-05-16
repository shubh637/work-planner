import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'

import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'
import SetPassword from './pages/SetPassword'
import ForgotPassword from './pages/ForgotPassword'

// Manager pages
import ManagerDashboard from './pages/manager/ManagerDashboard'
import TeamMembers from './pages/manager/TeamMembers'
import Projects from './pages/manager/Projects'
import Tasks from './pages/manager/Tasks'
import TaskDetailManager from './pages/manager/TaskDetail'
import Reports from './pages/manager/Reports'

// Member pages
import MemberDashboard from './pages/member/MemberDashboard'
import MyTasks from './pages/member/MyTasks'
import TaskDetailMember from './pages/member/TaskDetail'
import SuggestTask from './pages/member/SuggestTask'
import MySuggestions from './pages/member/MySuggestions'
import SuggestionDetail from './pages/member/SuggestionDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Manager routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleRoute role="MANAGER" />}>
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/manager/team" element={<TeamMembers />} />
              <Route path="/manager/projects" element={<Projects />} />
              <Route path="/manager/tasks" element={<Tasks />} />
              <Route path="/manager/tasks/:id" element={<TaskDetailManager />} />
              <Route path="/manager/reports" element={<Reports />} />
            </Route>

            {/* Member routes */}
            <Route element={<RoleRoute role="TEAM_MEMBER" />}>
              <Route path="/member" element={<MemberDashboard />} />
              <Route path="/member/tasks" element={<MyTasks />} />
              <Route path="/member/tasks/:id" element={<TaskDetailMember />} />
              <Route path="/member/suggest" element={<SuggestTask />} />
              <Route path="/member/suggestions" element={<MySuggestions />} />
              <Route path="/member/suggestions/:id" element={<SuggestionDetail />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
