import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Login          from './components/Auth/Login.jsx'
import Layout         from './components/Layout/Layout.jsx'
import Dashboard      from './components/Dashboard/Dashboard.jsx'
import Studies        from './components/Studies/Studies.jsx'
import Subjects       from './components/Subjects/Subjects.jsx'
import Sites          from './components/Sites/Sites.jsx'
import Patients       from './components/Patients/Patients.jsx'
import Appointments   from './components/Appointments/Appointments.jsx'
import Reports        from './components/Reports/Reports.jsx'
import UserManagement from './components/Users/UserManagement.jsx'

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0a1f3d' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:44, height:44, border:'3px solid rgba(255,255,255,.1)', borderTop:'3px solid #06b6d4', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 14px' }} />
        <p style={{ color:'rgba(255,255,255,.5)', fontSize:'.85rem', margin:0 }}>Loading CTMS…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// Guard — must be logged in
function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" replace />
}

// Role guard — only allowed roles can access
function RoleGuard({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* All roles */}
        <Route path="dashboard"    element={<Dashboard />} />
        <Route path="patients"     element={<Patients />} />
        <Route path="appointments" element={<Appointments />} />

        {/* Admin + Coordinator + Nurse */}
        <Route path="subjects" element={<RoleGuard roles={['admin','coordinator','nurse']}><Subjects /></RoleGuard>} />

        {/* Admin + Coordinator */}
        <Route path="studies" element={<RoleGuard roles={['admin','coordinator']}><Studies /></RoleGuard>} />
        <Route path="sites"   element={<RoleGuard roles={['admin','coordinator']}><Sites /></RoleGuard>} />

        {/* Admin + Doctor + Coordinator */}
        <Route path="reports" element={<RoleGuard roles={['admin','doctor','coordinator']}><Reports /></RoleGuard>} />

        {/* Admin only */}
        <Route path="users" element={<RoleGuard roles={['admin']}><UserManagement /></RoleGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
