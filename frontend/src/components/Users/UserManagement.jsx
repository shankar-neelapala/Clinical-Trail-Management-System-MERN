import React, { useState, useEffect, useCallback } from 'react'
import { usersAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'

const ROLE_CONFIG = {
  admin:       { bg:'#fef2f2', color:'#dc2626', icon:'bi-shield-fill',        label:'Administrator' },
  doctor:      { bg:'#eff6ff', color:'#2563eb', icon:'bi-person-badge-fill',   label:'Doctor'        },
  nurse:       { bg:'#f0fdf4', color:'#16a34a', icon:'bi-heart-pulse-fill',    label:'Nurse'         },
  coordinator: { bg:'#faf5ff', color:'#7c3aed', icon:'bi-clipboard2-check-fill',label:'Coordinator'  },
}

const EMPTY_FORM = {
  name:'', email:'', password:'', role:'coordinator',
  phone:'', department:'', specialization:'', licenseNumber:'', isActive:true
}

export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [errors,     setErrors]     = useState({})
  const [alert,      setAlert]      = useState(null)
  const [showPw,     setShowPw]     = useState(false)
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await usersAPI.getAll(); setUsers(r.data) }
    catch { showAlert('danger','Failed to load users') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const showAlert = (type, message) => { setAlert({ type, message }); setTimeout(()=>setAlert(null), 4000) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name  = 'Name is required'
    if (!form.email.trim())   e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!editing && !form.password) e.password = 'Password is required'
    if (!editing && form.password && form.password.length < 6) e.password = 'Min 6 characters'
    if (!form.role) e.role = 'Role is required'
    return e
  }

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setShowPw(false); setShowModal(true) }
  const openEdit   = u => {
    setEditing(u)
    setForm({ name:u.name, email:u.email, password:'', role:u.role, phone:u.phone||'', department:u.department||'', specialization:u.specialization||'', licenseNumber:u.licenseNumber||'', isActive:u.isActive })
    setErrors({}); setShowPw(false); setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const ve = validate()
    if (Object.keys(ve).length) { setErrors(ve); return }
    setSaving(true)
    try {
      const payload = { ...form }
      if (editing && !payload.password) delete payload.password
      if (editing) { await usersAPI.update(editing._id, payload); showAlert('success', 'User updated successfully') }
      else         { await usersAPI.create(payload);               showAlert('success', 'User created successfully') }
      setShowModal(false); load()
    } catch (err) { showAlert('danger', err.response?.data?.message || 'Operation failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await usersAPI.delete(delTarget._id); showAlert('success','User deleted'); setDelTarget(null); load() }
    catch (err) { showAlert('danger', err.response?.data?.message || 'Delete failed') }
  }

  const handleToggleActive = async (u) => {
    try {
      await usersAPI.update(u._id, { isActive: !u.isActive })
      showAlert('success', `User ${!u.isActive ? 'activated' : 'deactivated'}`)
      load()
    } catch { showAlert('danger','Failed to update status') }
  }

  const F = (k,v) => setForm(f=>({...f,[k]:v}))

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole   = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  // Stats
  const stats = Object.keys(ROLE_CONFIG).map(r => ({ role:r, count: users.filter(u=>u.role===r).length }))

  const initials = n => n?.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2) || '??'

  return (
    <div data-test="users-page">

      {/* Alert */}
      {alert && (
        <div style={{ padding:'10px 16px', borderRadius:8, marginBottom:16, fontSize:'.84rem', display:'flex', alignItems:'center', gap:10, background:alert.type==='success'?'#dcfce7':'#fee2e2', color:alert.type==='success'?'#166534':'#991b1b' }}>
          <i className={`bi bi-${alert.type==='success'?'check-circle':'exclamation-circle'}-fill`} />
          {alert.message}
          <button onClick={()=>setAlert(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'inherit' }}><i className="bi bi-x" /></button>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h4 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, color:'#0f2d5c', fontSize:'1.35rem', margin:0 }}>
            <i className="bi bi-shield-person-fill me-2" />User Management
          </h4>
          <p style={{ fontSize:'.82rem', color:'#64748b', margin:'3px 0 0' }}>Manage system users, roles, and access permissions</p>
        </div>
        <button id="createUserBtn" name="createUserBtn" data-test="create-user-btn" onClick={openCreate}
          style={{ background:'linear-gradient(135deg,#0f2d5c,#2563eb)', color:'#fff', border:'none', borderRadius:9, padding:'9px 20px', fontSize:'.86rem', fontWeight:700, display:'flex', alignItems:'center', gap:8, cursor:'pointer', boxShadow:'0 2px 8px rgba(37,99,235,.3)' }}>
          <i className="bi bi-person-plus-fill" />Add User
        </button>
      </div>

      {/* Role stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:22 }}>
        {stats.map(s => {
          const cfg = ROLE_CONFIG[s.role]
          return (
            <div key={s.role} id={`stat-${s.role}`} data-test={`stat-${s.role}`}
              style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'16px 18px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 3px rgba(15,45,92,.06)', cursor:'pointer', transition:'all .2s' }}
              onClick={() => setRoleFilter(roleFilter===s.role?'':s.role)}
              onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(15,45,92,.1)' }}
              onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 1px 3px rgba(15,45,92,.06)' }}
            >
              <div style={{ width:42, height:42, borderRadius:10, background:cfg.bg, color:cfg.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>
                <i className={`bi ${cfg.icon}`} />
              </div>
              <div>
                <div style={{ fontSize:'1.7rem', fontWeight:700, color:'#0f2d5c', lineHeight:1, fontFamily:'Space Grotesk,sans-serif' }}>{s.count}</div>
                <div style={{ fontSize:'.72rem', color:'#64748b', marginTop:2 }}>{cfg.label}s</div>
              </div>
              {roleFilter===s.role && <i className="bi bi-check-circle-fill" style={{ marginLeft:'auto', color:cfg.color, fontSize:'.85rem' }} />}
            </div>
          )
        })}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'16px 18px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 1px 3px rgba(15,45,92,.06)' }}>
          <div style={{ width:42, height:42, borderRadius:10, background:'#f8fafc', color:'#475569', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>
            <i className="bi bi-people-fill" />
          </div>
          <div>
            <div style={{ fontSize:'1.7rem', fontWeight:700, color:'#0f2d5c', lineHeight:1, fontFamily:'Space Grotesk,sans-serif' }}>{users.length}</div>
            <div style={{ fontSize:'.72rem', color:'#64748b', marginTop:2 }}>Total Users</div>
          </div>
        </div>
      </div>

      {/* Search & filter */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <i className="bi bi-search" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'.85rem', pointerEvents:'none' }} />
          <input type="text" className="form-control" style={{ paddingLeft:34, height:38, fontSize:'.83rem' }} id="userSearch" name="userSearch" data-test="user-search"
            placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width:160, height:38, fontSize:'.83rem' }} id="userRoleFilter" data-test="user-role-filter" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {Object.keys(ROLE_CONFIG).map(r=><option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
        </select>
        {(search||roleFilter) && (
          <button className="btn btn-outline-secondary btn-sm" onClick={()=>{setSearch('');setRoleFilter('')}}>
            <i className="bi bi-x-circle me-1" />Clear
          </button>
        )}
        <span style={{ fontSize:'.78rem', color:'#64748b', marginLeft:'auto' }}>{filtered.length} users</span>
      </div>

      {/* Users grid */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60 }}>
          <div className="spinner-border" style={{ color:'#2563eb', width:36, height:36 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'#94a3b8' }}>
          <i className="bi bi-people" style={{ fontSize:'2.5rem', display:'block', marginBottom:10 }} />
          No users found
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }} id="usersGrid" data-test="users-grid">
          {filtered.map(u => {
            const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.coordinator
            const isSelf = u._id === currentUser?.id || u._id === currentUser?._id
            return (
              <div key={u._id} id={`user-card-${u._id}`} data-test={`user-card-${u._id}`}
                style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 3px rgba(15,45,92,.06)', transition:'all .2s', opacity: u.isActive ? 1 : 0.65 }}
                onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 4px 16px rgba(15,45,92,.1)'; e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={e=>{ e.currentTarget.style.boxShadow='0 1px 3px rgba(15,45,92,.06)'; e.currentTarget.style.transform='' }}
              >
                {/* Color stripe */}
                <div style={{ height:4, background:`linear-gradient(90deg,${cfg.color},${cfg.color}88)` }} />

                <div style={{ padding:'18px 18px 14px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:14 }}>
                    {/* Avatar */}
                    <div style={{ width:48, height:48, borderRadius:'50%', background:`linear-gradient(135deg,${cfg.color}33,${cfg.color}22)`, border:`2px solid ${cfg.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.88rem', color:cfg.color, flexShrink:0 }}>
                      {initials(u.name)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <div style={{ fontWeight:700, fontSize:'.92rem', color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.name}</div>
                        {isSelf && <span style={{ background:'#dbeafe', color:'#1d4ed8', padding:'1px 6px', borderRadius:20, fontSize:'.62rem', fontWeight:700 }}>You</span>}
                      </div>
                      <div style={{ fontSize:'.75rem', color:'#64748b', marginTop:1 }}>{u.email}</div>
                      <div style={{ marginTop:5, display:'flex', gap:6, flexWrap:'wrap' }}>
                        <span style={{ background:cfg.bg, color:cfg.color, padding:'2px 8px', borderRadius:20, fontSize:'.68rem', fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
                          <i className={`bi ${cfg.icon}`} />{cfg.label}
                        </span>
                        <span style={{ background:u.isActive?'#dcfce7':'#f1f5f9', color:u.isActive?'#166534':'#64748b', padding:'2px 8px', borderRadius:20, fontSize:'.68rem', fontWeight:700 }}>
                          {u.isActive ? '● Active' : '○ Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:12, display:'flex', flexDirection:'column', gap:5 }}>
                    {u.department && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.78rem', color:'#64748b' }}>
                        <i className="bi bi-building" style={{ width:14, color:'#94a3b8' }} />
                        {u.department}
                      </div>
                    )}
                    {u.specialization && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.78rem', color:'#64748b' }}>
                        <i className="bi bi-mortarboard" style={{ width:14, color:'#94a3b8' }} />
                        {u.specialization}
                      </div>
                    )}
                    {u.phone && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.78rem', color:'#64748b' }}>
                        <i className="bi bi-telephone" style={{ width:14, color:'#94a3b8' }} />
                        {u.phone}
                      </div>
                    )}
                    {u.licenseNumber && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.78rem', color:'#64748b' }}>
                        <i className="bi bi-card-text" style={{ width:14, color:'#94a3b8' }} />
                        License: {u.licenseNumber}
                      </div>
                    )}
                    {u.lastLogin && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'.72rem', color:'#94a3b8' }}>
                        <i className="bi bi-clock-history" style={{ width:14 }} />
                        Last login: {new Date(u.lastLogin).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                <div style={{ padding:'10px 16px', borderTop:'1px solid #f8fafc', background:'#f8fafd', display:'flex', gap:8, justifyContent:'flex-end' }}>
                  <button id={`editUser-${u._id}`} data-test={`edit-user-${u._id}`} onClick={()=>openEdit(u)}
                    style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#475569', cursor:'pointer', fontSize:'.78rem', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                    <i className="bi bi-pencil" />Edit
                  </button>
                  {!isSelf && (
                    <button id={`toggleUser-${u._id}`} data-test={`toggle-user-${u._id}`} onClick={()=>handleToggleActive(u)}
                      style={{ padding:'5px 12px', borderRadius:8, border:`1px solid ${u.isActive?'#fecaca':'#bbf7d0'}`, background:u.isActive?'#fff5f5':'#f0fdf4', color:u.isActive?'#dc2626':'#16a34a', cursor:'pointer', fontSize:'.78rem', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                      <i className={`bi bi-${u.isActive?'pause-circle':'play-circle'}`} />{u.isActive?'Deactivate':'Activate'}
                    </button>
                  )}
                  {!isSelf && (
                    <button id={`deleteUser-${u._id}`} data-test={`delete-user-${u._id}`} onClick={()=>setDelTarget(u)}
                      style={{ padding:'5px 12px', borderRadius:8, border:'1px solid #fecaca', background:'#fff5f5', color:'#dc2626', cursor:'pointer', fontSize:'.78rem', fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                      <i className="bi bi-trash" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══ CREATE / EDIT MODAL ══ */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,40,.65)', backdropFilter:'blur(4px)', zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          id="userModal" data-test="user-modal"
          onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:600, maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.22)' }}>

            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#0f2d5c,#1a4a8a)', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:'.98rem', display:'flex', alignItems:'center', gap:8 }}>
                <i className="bi bi-person-badge" />{editing ? 'Edit User' : 'Add New User'}
              </h5>
              <button onClick={()=>setShowModal(false)} style={{ background:'rgba(255,255,255,.15)', border:'none', color:'#fff', width:30, height:30, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <i className="bi bi-x" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ overflow:'auto', flex:1 }}>
              <div style={{ padding:24 }}>
                <div className="row g-3">

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="uName">Full Name *</label>
                    <input type="text" className={`form-control ${errors.name?'is-invalid':''}`} id="uName" name="uName" data-test="user-name-input" value={form.name} onChange={e=>F('name',e.target.value)} />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="uEmail">Email *</label>
                    <input type="email" className={`form-control ${errors.email?'is-invalid':''}`} id="uEmail" name="uEmail" data-test="user-email-input" value={form.email} onChange={e=>F('email',e.target.value)} disabled={!!editing} />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="uRole">Role *</label>
                    <select className={`form-select ${errors.role?'is-invalid':''}`} id="uRole" name="uRole" data-test="user-role-select" value={form.role} onChange={e=>F('role',e.target.value)}>
                      {Object.entries(ROLE_CONFIG).map(([k,v])=>(
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    {errors.role && <div className="invalid-feedback">{errors.role}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="uPassword">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                    <div style={{ position:'relative' }}>
                      <input type={showPw?'text':'password'} className={`form-control ${errors.password?'is-invalid':''}`} id="uPassword" name="uPassword" data-test="user-password-input" value={form.password} onChange={e=>F('password',e.target.value)} placeholder={editing?'Leave blank to keep current':'Min 6 characters'} style={{ paddingRight:40 }} />
                      <button type="button" onClick={()=>setShowPw(s=>!s)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#94a3b8', cursor:'pointer' }}>
                        <i className={`bi bi-eye${showPw?'-slash':''}`} />
                      </button>
                    </div>
                    {errors.password && <div style={{ fontSize:'.75rem', color:'#ef4444', marginTop:4 }}>{errors.password}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="uPhone">Phone</label>
                    <input type="text" className="form-control" id="uPhone" name="uPhone" data-test="user-phone-input" value={form.phone} onChange={e=>F('phone',e.target.value)} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="uDept">Department</label>
                    <input type="text" className="form-control" id="uDept" name="uDept" data-test="user-dept-input" value={form.department} onChange={e=>F('department',e.target.value)} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="uSpec">Specialization</label>
                    <input type="text" className="form-control" id="uSpec" name="uSpec" data-test="user-spec-input" value={form.specialization} onChange={e=>F('specialization',e.target.value)} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="uLicense">License Number</label>
                    <input type="text" className="form-control" id="uLicense" name="uLicense" data-test="user-license-input" value={form.licenseNumber} onChange={e=>F('licenseNumber',e.target.value)} />
                  </div>

                  {editing && (
                    <div className="col-12">
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', background:'#f8fafc', borderRadius:8, border:'1px solid #e2e8f0' }}>
                        <div style={{ position:'relative', width:44, height:24 }}>
                          <input type="checkbox" id="uActive" data-test="user-active-toggle" checked={form.isActive} onChange={e=>F('isActive',e.target.checked)} style={{ opacity:0, width:0, height:0 }} />
                          <label htmlFor="uActive" style={{ position:'absolute', inset:0, background:form.isActive?'#16a34a':'#cbd5e0', borderRadius:12, cursor:'pointer', transition:'background .25s' }}>
                            <span style={{ position:'absolute', top:2, left:form.isActive?20:2, width:20, height:20, background:'#fff', borderRadius:'50%', boxShadow:'0 1px 3px rgba(0,0,0,.2)', transition:'left .25s' }} />
                          </label>
                        </div>
                        <label htmlFor="uActive" style={{ fontSize:'.84rem', fontWeight:600, color:'#475569', cursor:'pointer' }}>
                          Account {form.isActive ? 'Active' : 'Inactive'}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Role description */}
                  {form.role && (
                    <div className="col-12">
                      <div style={{ padding:'10px 14px', background: ROLE_CONFIG[form.role]?.bg, borderRadius:8, fontSize:'.78rem', color: ROLE_CONFIG[form.role]?.color, fontWeight:500 }}>
                        <i className={`bi ${ROLE_CONFIG[form.role]?.icon} me-2`} />
                        {form.role==='admin'       && 'Full access to all modules including User Management, all CRUD operations, and system settings.'}
                        {form.role==='doctor'      && 'Access to Dashboard, Patients, Appointments, and Reports. Read-only on Studies and Sites.'}
                        {form.role==='nurse'       && 'Access to Dashboard, Patients, Subjects, and Appointments. No access to Reports or Studies.'}
                        {form.role==='coordinator' && 'Access to all modules except User Management. Can create/edit but not delete most records.'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ padding:'14px 24px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10, background:'#f8fafc', flexShrink:0 }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" id="saveUserBtn" name="saveUserBtn" data-test="save-user-btn" disabled={saving}
                  style={{ background:'linear-gradient(135deg,#0f2d5c,#2563eb)', color:'#fff', border:'none', borderRadius:8, padding:'7px 22px', fontSize:'.84rem', fontWeight:700, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8, opacity:saving?.7:1 }}>
                  {saving?<><span className="spinner-border spinner-border-sm"/>Saving…</>:<><i className="bi bi-check-circle"/>{editing?'Update User':'Create User'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      {delTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,40,.65)', backdropFilter:'blur(4px)', zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          id="deleteUserModal" data-test="delete-user-modal"
          onClick={e=>e.target===e.currentTarget&&setDelTarget(null)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:380, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.22)' }}>
            <div style={{ background:'linear-gradient(135deg,#991b1b,#ef4444)', padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:'.95rem' }}><i className="bi bi-exclamation-triangle me-2" />Delete User</h5>
              <button onClick={()=>setDelTarget(null)} style={{ background:'rgba(255,255,255,.15)', border:'none', color:'#fff', width:28, height:28, borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><i className="bi bi-x" /></button>
            </div>
            <div style={{ padding:22 }}>
              <p style={{ margin:'0 0 8px', fontSize:'.88rem' }}>Delete user <strong>{delTarget.name}</strong>?</p>
              <p style={{ margin:0, fontSize:'.8rem', color:'#dc2626', display:'flex', alignItems:'center', gap:6 }}>
                <i className="bi bi-exclamation-circle" />This action cannot be undone.
              </p>
            </div>
            <div style={{ padding:'12px 22px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10, background:'#f8fafc' }}>
              <button className="btn btn-secondary btn-sm" id="cancelDeleteUserBtn" onClick={()=>setDelTarget(null)}>Cancel</button>
              <button id="confirmDeleteUserBtn" name="confirmDeleteUserBtn" data-test="confirm-delete-user-btn" onClick={handleDelete}
                style={{ background:'linear-gradient(135deg,#991b1b,#ef4444)', color:'#fff', border:'none', borderRadius:8, padding:'7px 16px', fontSize:'.83rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                <i className="bi bi-trash" />Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
