import React, { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import ProfileMenu from './ProfileMenu.jsx'

const NAV_ALL = [
  { path:'/dashboard',    icon:'bi-speedometer2',       label:'Dashboard',    roles: ['admin','doctor','nurse','coordinator'] },
  { path:'/studies',      icon:'bi-journal-medical',     label:'Studies',      roles: ['admin','coordinator'] },
  { path:'/subjects',     icon:'bi-people-fill',          label:'Subjects',     roles: ['admin','coordinator','nurse'] },
  { path:'/sites',        icon:'bi-hospital',             label:'Sites',        roles: ['admin','coordinator'] },
  { path:'/patients',     icon:'bi-person-vcard-fill',    label:'Patients',     roles: ['admin','doctor','nurse','coordinator'] },
  { path:'/appointments', icon:'bi-calendar2-check-fill', label:'Appointments', roles: ['admin','doctor','nurse','coordinator'] },
  { path:'/reports',      icon:'bi-bar-chart-line-fill',  label:'Reports',      roles: ['admin','doctor','coordinator'] },
  { path:'/users',        icon:'bi-person-gear',          label:'User Mgmt',    roles: ['admin'] },
]

const TITLES = {
  '/dashboard':    'Dashboard',
  '/studies':      'Studies Management',
  '/subjects':     'Subjects Management',
  '/sites':        'Sites Management',
  '/patients':     'Patient Registry',
  '/appointments': 'Appointments',
  '/reports':      'Reports & Analytics',
  '/users':        'User Management',
}

const ROLE_BADGE = {
  admin:       { bg:'#fef2f2', color:'#dc2626' },
  doctor:      { bg:'#eff6ff', color:'#2563eb' },
  nurse:       { bg:'#f0fdf4', color:'#16a34a' },
  coordinator: { bg:'#faf5ff', color:'#7c3aed' },
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()
  const [open, setOpen]  = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const initials     = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'A'
  const title        = TITLES[location.pathname] || 'CTMS'
  const rb           = ROLE_BADGE[user?.role] || ROLE_BADGE.coordinator

  // filter nav by role
  const nav = NAV_ALL.filter(item => item.roles.includes(user?.role))

  return (
    <div className="ctms-shell d-flex vh-100">
      {/* ── Sidebar ── */}
      <aside className={`ctms-sidebar col-md-3 col-lg-2 ${open ? 'open' : ''}`} id="sidebar" data-test="sidebar">
        <div className="sb-brand">
          <div className="sb-brand-icon"><i className="bi bi-clipboard2-pulse-fill"></i></div>
          <div className="sb-brand-text">
            <h5>CTMS</h5>
            <small>Clinical Trial Mgmt</small>
          </div>
        </div>

        <div className="sb-section">
          <div className="sb-section-label">Navigation</div>
          {nav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({isActive}) => `sb-link ${isActive ? 'active' : ''}`}
              id={`nav-${item.label.toLowerCase().replace(/\s/g,'-')}`}
              data-test={`nav-${item.label.toLowerCase().replace(/\s/g,'-')}`}
              onClick={() => setOpen(false)}
            >
              <i className={`bi ${item.icon}`}></i>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="sb-footer">
          <div className="sb-section-label">Account</div>
          <div style={{padding:'8px 18px 4px',display:'flex',alignItems:'center',gap:8}}>
            <div className="user-avatar" style={{width:32,height:32,fontSize:'.72rem',flexShrink:0}}>{initials}</div>
            <div style={{overflow:'hidden',flex:1}}>
              <div style={{color:'#cbd5e1',fontSize:'.8rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.name}</div>
              <span style={{background:rb.bg,color:rb.color,padding:'1px 6px',borderRadius:20,fontSize:'.62rem',fontWeight:700,textTransform:'capitalize'}}>{user?.role}</span>
            </div>
          </div>
          <button className="sb-link" id="logoutBtn" name="logoutBtn" data-test="logout-btn" onClick={handleLogout}>
            <i className="bi bi-box-arrow-left"></i>Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="ctms-main col-md-9 col-lg-10">
        <header className="ctms-topbar">
          <div className="topbar-left">
            <button className="btn-ctms btn-outline btn-sm d-lg-none" id="menuToggle" onClick={() => setOpen(!open)}>
              <i className="bi bi-list"></i>
            </button>
            <div>
              <div className="topbar-title" data-test="page-title">{title}</div>
            </div>
          </div>
          <div className="topbar-right">
            <span className="topbar-badge">
              <i className="bi bi-circle-fill" style={{fontSize:'.45rem',verticalAlign:'middle',marginRight:4,color:'#16a34a'}}></i>
              Live
            </span>
            <ProfileMenu />
          </div>
        </header>

        <div className="ctms-page">
          <Outlet />
        </div>
      </main>

      {open && <div onClick={() => setOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:999}} />}
    </div>
  )
}
