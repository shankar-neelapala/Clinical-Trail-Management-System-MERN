import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROLE_COLORS = {
  admin:       { bg: '#fef2f2', color: '#dc2626', label: 'Administrator' },
  doctor:      { bg: '#eff6ff', color: '#2563eb', label: 'Doctor'        },
  nurse:       { bg: '#f0fdf4', color: '#16a34a', label: 'Nurse'         },
  coordinator: { bg: '#faf5ff', color: '#7c3aed', label: 'Coordinator'   },
}

export default function ProfileMenu() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const ref = useRef(null)

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'
  const roleInfo = ROLE_COLORS[user?.role] || ROLE_COLORS.coordinator

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <>
      {/* ── Chip trigger ── */}
      <div
        className="user-chip"
        id="userProfileChip"
        data-test="user-profile-chip"
        onClick={() => setOpen(o => !o)}
        ref={ref}
        style={{ cursor: 'pointer', position: 'relative', userSelect: 'none' }}
      >
        <div className="user-avatar">{initials}</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span className="user-name">{user?.name}</span>
          <span style={{ fontSize: '.65rem', color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role}</span>
        </div>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: '.65rem', color: '#94a3b8', marginLeft: 2 }} />

        {/* ── Dropdown ── */}
        {open && (
          <div
            id="profileDropdown"
            data-test="profile-dropdown"
            style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: 260, background: '#fff',
              borderRadius: 12, boxShadow: '0 8px 32px rgba(15,45,92,.18)',
              border: '1px solid #e2e8f0', zIndex: 2000,
              overflow: 'hidden', animation: 'dropIn .15s ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg,#f8fafc,#eff6ff)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#1a4175,#2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '.9rem', flexShrink: 0
                }}>{initials}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#1e293b' }}>{user?.name}</div>
                  <div style={{ fontSize: '.72rem', color: '#64748b' }}>{user?.email}</div>
                  <span style={{ display: 'inline-block', marginTop: 4, background: roleInfo.bg, color: roleInfo.color, padding: '2px 8px', borderRadius: 20, fontSize: '.65rem', fontWeight: 700 }}>
                    {roleInfo.label}
                  </span>
                </div>
              </div>
              {user?.department && (
                <div style={{ marginTop: 8, fontSize: '.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="bi bi-building" />
                  {user.department}{user.specialization ? ` · ${user.specialization}` : ''}
                </div>
              )}
            </div>

            {/* Menu items */}
            <div style={{ padding: '6px 0' }}>
              <MenuItem icon="bi-person-circle" label="View Profile" onClick={() => { setOpen(false); setShowProfile(true) }} id="menuViewProfile" />
              <MenuItem icon="bi-key"           label="Change Password" onClick={() => { setOpen(false); setShowPassword(true) }} id="menuChangePassword" />
              {isAdmin && (
                <MenuItem icon="bi-people"      label="User Management" onClick={() => { setOpen(false); navigate('/users') }} id="menuUserMgmt" />
              )}
              <div style={{ height: 1, background: '#f1f5f9', margin: '6px 0' }} />
              <MenuItem icon="bi-box-arrow-left" label="Logout" onClick={handleLogout} id="menuLogout" danger />
            </div>
          </div>
        )}
      </div>

      {/* ── View Profile Modal ── */}
      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}

      {/* ── Change Password Modal ── */}
      {showPassword && <PasswordModal onClose={() => setShowPassword(false)} />}

      <style>{`
        @keyframes dropIn { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </>
  )
}

function MenuItem({ icon, label, onClick, id, danger }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      id={id} data-test={id}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '9px 18px', border: 'none',
        background: hover ? (danger ? '#fff5f5' : '#f8fafc') : 'transparent',
        color: danger ? '#dc2626' : hover ? '#1a4175' : '#475569',
        fontSize: '.83rem', fontWeight: 500, cursor: 'pointer',
        textAlign: 'left', transition: 'all .15s'
      }}
    >
      <i className={`bi ${icon}`} style={{ fontSize: '.9rem', width: 16 }} />
      {label}
    </button>
  )
}

function ProfileModal({ user, onClose }) {
  const { updateProfile } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '',
    department: user?.department || '', specialization: user?.specialization || '',
    licenseNumber: user?.licenseNumber || ''
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const roleInfo = ROLE_COLORS[user?.role] || ROLE_COLORS.coordinator

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(form)
      setMsg({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(onClose, 1200)
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.message || 'Update failed' })
    } finally { setSaving(false) }
  }

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,40,.6)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div id="profileModal" data-test="profile-modal" style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0f2d5c,#1a4a8a)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{user?.name}</div>
              <span style={{ background: roleInfo.bg, color: roleInfo.color, padding: '2px 8px', borderRadius: 20, fontSize: '.65rem', fontWeight: 700 }}>{roleInfo.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="bi bi-x" style={{ fontSize: '1.1rem' }} />
          </button>
        </div>

        {/* Info strip */}
        <div style={{ background: '#f8fafc', padding: '10px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 20, fontSize: '.75rem', color: '#64748b' }}>
          <span><i className="bi bi-envelope me-1" />{user?.email}</span>
          {user?.lastLogin && <span><i className="bi bi-clock me-1" />Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>}
        </div>

        <form onSubmit={handleSave}>
          <div style={{ padding: 24 }}>
            {msg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '.83rem', background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#166534' : '#991b1b' }}>
                <i className={`bi bi-${msg.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />{msg.text}
              </div>
            )}
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label" htmlFor="pName">Full Name</label>
                <input type="text" className="form-control" id="pName" value={form.name} onChange={e => F('name', e.target.value)} required />
              </div>
              <div className="col-6">
                <label className="form-label" htmlFor="pPhone">Phone</label>
                <input type="text" className="form-control" id="pPhone" value={form.phone} onChange={e => F('phone', e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label" htmlFor="pDept">Department</label>
                <input type="text" className="form-control" id="pDept" value={form.department} onChange={e => F('department', e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label" htmlFor="pSpec">Specialization</label>
                <input type="text" className="form-control" id="pSpec" value={form.specialization} onChange={e => F('specialization', e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label" htmlFor="pLicense">License Number</label>
                <input type="text" className="form-control" id="pLicense" value={form.licenseNumber} onChange={e => F('licenseNumber', e.target.value)} />
              </div>
            </div>
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#f8fafc' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" id="saveProfileBtn" data-test="save-profile-btn" disabled={saving}
              style={{ background: 'linear-gradient(135deg,#1a4175,#2563eb)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 20px', fontSize: '.83rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? .7 : 1 }}>
              {saving ? <><span className="spinner-border spinner-border-sm" />Saving…</> : <><i className="bi bi-check-circle" />Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PasswordModal({ onClose }) {
  const { changePassword } = useAuth()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const strength = (p) => {
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }
  const pw = form.newPassword
  const str = strength(pw)
  const strLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][str]
  const strColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][str]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) return setMsg({ type: 'danger', text: 'Passwords do not match' })
    if (form.newPassword.length < 6) return setMsg({ type: 'danger', text: 'Password must be at least 6 characters' })
    setSaving(true)
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setMsg({ type: 'success', text: 'Password changed successfully!' })
      setTimeout(onClose, 1500)
    } catch (err) {
      setMsg({ type: 'danger', text: err.response?.data?.message || 'Failed to change password' })
    } finally { setSaving(false) }
  }

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,40,.6)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div id="changePasswordModal" data-test="change-password-modal" style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#0f2d5c,#1a4a8a)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h5 style={{ color: '#fff', margin: 0, fontSize: '.95rem', fontWeight: 700 }}><i className="bi bi-key me-2" />Change Password</h5>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="bi bi-x" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 24 }}>
            {msg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '.83rem', background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#166534' : '#991b1b' }}>
                <i className={`bi bi-${msg.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`} />{msg.text}
              </div>
            )}

            {/* Current password */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label" htmlFor="cpCurrent">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showCurrent ? 'text' : 'password'} className="form-control" id="cpCurrent" data-test="current-password-input" value={form.currentPassword} onChange={e => F('currentPassword', e.target.value)} required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowCurrent(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <i className={`bi bi-eye${showCurrent ? '-slash' : ''}`} />
                </button>
              </div>
            </div>

            {/* New password */}
            <div style={{ marginBottom: 8 }}>
              <label className="form-label" htmlFor="cpNew">New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showNew ? 'text' : 'password'} className="form-control" id="cpNew" data-test="new-password-input" value={form.newPassword} onChange={e => F('newPassword', e.target.value)} required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowNew(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <i className={`bi bi-eye${showNew ? '-slash' : ''}`} />
                </button>
              </div>
              {/* Strength bar */}
              {pw && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= str ? strColor : '#e2e8f0', transition: 'background .3s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '.7rem', color: strColor, fontWeight: 600 }}>{strLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="form-label" htmlFor="cpConfirm">Confirm New Password</label>
              <input type="password" className="form-control" id="cpConfirm" data-test="confirm-password-input" value={form.confirmPassword} onChange={e => F('confirmPassword', e.target.value)} required
                style={{ borderColor: form.confirmPassword && form.confirmPassword !== form.newPassword ? '#ef4444' : '' }} />
              {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                <div style={{ fontSize: '.75rem', color: '#ef4444', marginTop: 4 }}>Passwords do not match</div>
              )}
            </div>
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#f8fafc' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" id="savePasswordBtn" data-test="save-password-btn" disabled={saving}
              style={{ background: 'linear-gradient(135deg,#1a4175,#2563eb)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 20px', fontSize: '.83rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? .7 : 1 }}>
              {saving ? <><span className="spinner-border spinner-border-sm" />Updating…</> : <><i className="bi bi-shield-check" />Update Password</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
