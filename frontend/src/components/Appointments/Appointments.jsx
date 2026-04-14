import React, { useState, useEffect, useCallback } from 'react'
import { appointmentsAPI, patientsAPI, usersAPI, studiesAPI, sitesAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'

/* ── helpers ─────────────────────────────────────────── */
const STATUS_MAP = {
  Scheduled:   { cls: 'sb-scheduled',  dot: '#3b82f6' },
  Confirmed:   { cls: 'sb-confirmed',  dot: '#8b5cf6' },
  Completed:   { cls: 'sb-completed2', dot: '#10b981' },
  Cancelled:   { cls: 'sb-cancelled',  dot: '#ef4444' },
  'No-Show':   { cls: 'sb-noshow',     dot: '#f59e0b' },
  Rescheduled: { cls: 'sb-rescheduled',dot: '#06b6d4' },
}
const TYPE_ICON = {
  Screening:    'bi-clipboard2-pulse',
  Consultation: 'bi-chat-dots',
  'Follow-Up':  'bi-arrow-repeat',
  'Lab Visit':  'bi-droplet',
  Treatment:    'bi-capsule',
  Discharge:    'bi-box-arrow-right',
  Emergency:    'bi-exclamation-octagon',
}
const PRIORITY_MAP = {
  Normal:   { bg: '#f1f5f9', color: '#475569' },
  Urgent:   { bg: '#fef3c7', color: '#d97706' },
  Critical: { bg: '#fee2e2', color: '#dc2626' },
}
const TIME_SLOTS = [
  '08:00 AM','08:30 AM','09:00 AM','09:30 AM','10:00 AM','10:30 AM',
  '11:00 AM','11:30 AM','12:00 PM','01:00 PM','01:30 PM','02:00 PM',
  '02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM','05:00 PM',
]
const EMPTY = {
  appointmentId:'', patient:'', doctor:'', study:'', site:'',
  appointmentDate:'', timeSlot:'', duration:30,
  type:'Consultation', status:'Scheduled', priority:'Normal',
  notes:'', cancelReason:''
}

export default function Appointments() {
  const { canEdit, canDelete, user } = useAuth()

  const [data,     setData]     = useState([])
  const [pg,       setPg]       = useState({ total:0, pages:1, currentPage:1 })
  const [stats,    setStats]    = useState({ total:0, todayCount:0, scheduled:0, completed:0, cancelled:0 })
  const [patients, setPatients] = useState([])
  const [doctors,  setDoctors]  = useState([])
  const [studies,  setStudies]  = useState([])
  const [sites,    setSites]    = useState([])

  const [search,     setSearch]     = useState('')
  const [filterSt,   setFilterSt]   = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [viewModal,  setViewModal]  = useState(false)
  const [cancelModal,setCancelModal]= useState(false)
  const [editing,    setEditing]    = useState(null)
  const [viewing,    setViewing]    = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [cancelTarget,setCancelTarget]=useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [errors,     setErrors]     = useState({})
  const [alert,      setAlert]      = useState(null)

  const load = useCallback(async (page=1) => {
    setLoading(true)
    try {
      const params = { page, limit:8 }
      if (filterSt)   params.status   = filterSt
      if (filterDate) params.date     = filterDate
      const [apptRes, statsRes] = await Promise.all([
        appointmentsAPI.getAll(params),
        appointmentsAPI.getStats()
      ])
      setData(apptRes.data.appointments)
      setPg({ total:apptRes.data.total, pages:apptRes.data.pages, currentPage:apptRes.data.currentPage })
      setStats(statsRes.data)
    } catch { showAlert('danger','Failed to load appointments') }
    finally  { setLoading(false) }
  }, [filterSt, filterDate])

  useEffect(() => { load(1) }, [load])

  useEffect(() => {
    patientsAPI.getAll({ limit:999 }).then(r => setPatients(r.data.patients || [])).catch(()=>{})
    usersAPI.getDoctors().then(r => setDoctors(r.data)).catch(()=>{})
    studiesAPI.getAllNoPag().then(r => setStudies(r.data)).catch(()=>{})
    sitesAPI.getAllNoPag().then(r => setSites(r.data)).catch(()=>{})
  }, [])

  const showAlert = (type, message) => { setAlert({ type, message }); setTimeout(()=>setAlert(null),4000) }

  const validate = () => {
    const e = {}
    if (!form.appointmentId.trim()) e.appointmentId = 'ID required'
    if (!form.patient)              e.patient       = 'Patient required'
    if (!form.doctor)               e.doctor        = 'Doctor required'
    if (!form.appointmentDate)      e.appointmentDate='Date required'
    if (!form.timeSlot)             e.timeSlot      = 'Time slot required'
    return e
  }

  const openCreate = () => {
    setEditing(null)
    // auto-generate ID
    const id = `APT-${Date.now().toString().slice(-6)}`
    setForm({ ...EMPTY, appointmentId: id })
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (a) => {
    setEditing(a)
    setForm({
      appointmentId: a.appointmentId,
      patient:       a.patient?._id || '',
      doctor:        a.doctor?._id  || '',
      study:         a.study?._id   || '',
      site:          a.site?._id    || '',
      appointmentDate: a.appointmentDate?.slice(0,10) || '',
      timeSlot:      a.timeSlot,
      duration:      a.duration,
      type:          a.type,
      status:        a.status,
      priority:      a.priority,
      notes:         a.notes || '',
      cancelReason:  ''
    })
    setErrors({})
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ve = validate()
    if (Object.keys(ve).length) { setErrors(ve); return }
    setSaving(true)
    try {
      if (editing) { await appointmentsAPI.update(editing._id, form); showAlert('success','Appointment updated') }
      else         { await appointmentsAPI.create(form);              showAlert('success','Appointment created') }
      setShowModal(false)
      load(pg.currentPage)
    } catch (err) { showAlert('danger', err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await appointmentsAPI.delete(delTarget._id); showAlert('success','Deleted'); setDelTarget(null); load(1) }
    catch { showAlert('danger','Delete failed') }
  }

  const handleCancel = async () => {
    try {
      await appointmentsAPI.update(cancelTarget._id, { status:'Cancelled', cancelReason: cancelTarget.reason || 'Cancelled by staff' })
      showAlert('success','Appointment cancelled')
      setCancelModal(false)
      setCancelTarget(null)
      load(pg.currentPage)
    } catch { showAlert('danger','Failed to cancel') }
  }

  const handleStatusChange = async (id, newStatus) => {
    try { await appointmentsAPI.update(id, { status: newStatus }); load(pg.currentPage) }
    catch { showAlert('danger','Status update failed') }
  }

  const F = (k,v) => setForm(f=>({...f,[k]:v}))

  const sbadge = (status) => {
    const m = STATUS_MAP[status] || { cls:'', dot:'#94a3b8' }
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:20, fontSize:'.72rem', fontWeight:700, background:'#f1f5f9', color:'#475569' }}
        className={`appt-badge-${status.toLowerCase().replace('-','')}`}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:m.dot, display:'inline-block' }} />
        {status}
      </span>
    )
  }

  const priorityBadge = (p) => {
    const m = PRIORITY_MAP[p] || PRIORITY_MAP.Normal
    return <span style={{ background:m.bg, color:m.color, padding:'2px 8px', borderRadius:20, fontSize:'.68rem', fontWeight:700 }}>{p}</span>
  }

  return (
    <div data-test="appointments-page">
      {/* Inline styles for appointment-specific classes */}
      <style>{`
        .appt-stat-card { background:#fff; border-radius:12px; padding:16px 20px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(15,45,92,.06); display:flex; align-items:center; gap:14px; transition:all .2s; }
        .appt-stat-card:hover { transform:translateY(-2px); box-shadow:0 4px 16px rgba(15,45,92,.1); }
        .appt-icon { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.15rem; flex-shrink:0; }
        .today-card { border-left:3px solid #3b82f6; background:#eff6ff; border-radius:8px; padding:12px 14px; font-size:.82rem; cursor:pointer; transition:all .2s; }
        .today-card:hover { background:#dbeafe; }
        .time-pill { background:#f1f5f9; color:#1a4175; padding:3px 10px; border-radius:20px; font-size:.75rem; font-weight:700; white-space:nowrap; }
        .slot-btn { padding:7px 0; border:1.5px solid #e2e8f0; border-radius:8px; background:#fff; color:#475569; font-size:.78rem; font-weight:600; cursor:pointer; transition:all .15s; }
        .slot-btn:hover { border-color:#1a4175; color:#1a4175; background:#eff6ff; }
        .slot-btn.selected { border-color:#1a4175; background:#1a4175; color:#fff; }
      `}</style>

      {/* Alert */}
      {alert && (
        <div style={{ padding:'10px 16px', borderRadius:8, marginBottom:16, fontSize:'.84rem', display:'flex', alignItems:'center', gap:10, background:alert.type==='success'?'#dcfce7':'#fee2e2', color:alert.type==='success'?'#166534':'#991b1b' }}>
          <i className={`bi bi-${alert.type==='success'?'check-circle':'exclamation-circle'}-fill`} />
          {alert.message}
          <button onClick={()=>setAlert(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'inherit', fontSize:'1rem' }}><i className="bi bi-x" /></button>
        </div>
      )}

      {/* Page header */}
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h4 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, color:'#0f2d5c', fontSize:'1.35rem', margin:0 }}>
            <i className="bi bi-calendar2-check-fill me-2" />Appointments
          </h4>
          <p style={{ fontSize:'.82rem', color:'#64748b', margin:'3px 0 0' }}>Schedule and manage patient-doctor appointments</p>
        </div>
        {canEdit && (
          <button id="createAppointmentBtn" name="createAppointmentBtn" data-test="create-appointment-btn" onClick={openCreate}
            style={{ background:'linear-gradient(135deg,#0f2d5c,#2563eb)', color:'#fff', border:'none', borderRadius:9, padding:'9px 20px', fontSize:'.86rem', fontWeight:700, display:'flex', alignItems:'center', gap:8, cursor:'pointer', boxShadow:'0 2px 8px rgba(37,99,235,.3)' }}>
            <i className="bi bi-plus-circle" />New Appointment
          </button>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:14, marginBottom:22 }} id="apptStats" data-test="appt-stats">
        {[
          { id:'stat-total',     icon:'bi-calendar3',          bg:'#eff6ff', color:'#2563eb', val:stats.total,      label:'Total'        },
          { id:'stat-today',     icon:'bi-calendar-check',     bg:'#f0fdf4', color:'#16a34a', val:stats.todayCount, label:"Today's"      },
          { id:'stat-scheduled', icon:'bi-clock',              bg:'#faf5ff', color:'#7c3aed', val:stats.scheduled,  label:'Scheduled'    },
          { id:'stat-completed', icon:'bi-check2-circle',      bg:'#ecfdf5', color:'#059669', val:stats.completed,  label:'Completed'    },
          { id:'stat-cancelled', icon:'bi-x-circle',           bg:'#fff1f2', color:'#e11d48', val:stats.cancelled,  label:'Cancelled'    },
        ].map(s => (
          <div key={s.id} className="appt-stat-card" id={s.id} data-test={s.id}>
            <div className="appt-icon" style={{ background:s.bg, color:s.color }}><i className={`bi ${s.icon}`} /></div>
            <div>
              <div style={{ fontSize:'1.8rem', fontWeight:700, color:'#0f2d5c', lineHeight:1, fontFamily:'Space Grotesk,sans-serif' }}>{s.val}</div>
              <div style={{ fontSize:'.75rem', color:'#64748b', marginTop:2 }}>{s.label} Appointments</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'14px 18px', marginBottom:18, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <select className="form-select" style={{ width:170, height:38, fontSize:'.83rem' }} id="apptStatusFilter" name="apptStatusFilter" data-test="appt-status-filter" value={filterSt} onChange={e=>setFilterSt(e.target.value)}>
          <option value="">All Statuses</option>
          {Object.keys(STATUS_MAP).map(s=><option key={s}>{s}</option>)}
        </select>
        <input type="date" className="form-control" style={{ width:170, height:38, fontSize:'.83rem' }} id="apptDateFilter" name="apptDateFilter" data-test="appt-date-filter" value={filterDate} onChange={e=>setFilterDate(e.target.value)} />
        <button className="btn btn-outline-secondary btn-sm" onClick={()=>{ setFilterSt(''); setFilterDate('') }} id="clearApptFilter" data-test="clear-appt-filter">
          <i className="bi bi-x-circle me-1" />Clear
        </button>
        <span style={{ marginLeft:'auto', fontSize:'.78rem', color:'#64748b' }}>{pg.total} appointments</span>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(15,45,92,.06)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.845rem' }} id="appointmentsTable" data-test="appointments-table">
            <thead>
              <tr style={{ background:'#f8fafd' }}>
                {['#','Appt ID','Patient','Doctor','Date & Time','Type','Priority','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', color:'#64748b', fontWeight:700, fontSize:'.7rem', textTransform:'uppercase', letterSpacing:'.6px', borderBottom:'1px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign:'center', padding:48 }}>
                  <div className="spinner-border spinner-border-sm" style={{ color:'#2563eb' }} />
                </td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="9" id="noAppointmentsMsg" style={{ textAlign:'center', padding:48, color:'#94a3b8' }}>
                  <i className="bi bi-calendar-x" style={{ fontSize:'2rem', display:'block', marginBottom:8 }} />
                  No appointments found
                </td></tr>
              ) : data.map((a, i) => (
                <tr key={a._id} id={`appt-row-${a._id}`} data-test={`appt-row-${a._id}`}
                  style={{ borderBottom:'1px solid #f1f5f9', transition:'background .12s', cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#f7fbff'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                >
                  <td style={{ padding:'11px 14px', color:'#94a3b8', fontSize:'.75rem' }}>{(pg.currentPage-1)*8+i+1}</td>
                  <td style={{ padding:'11px 14px' }}>
                    <code style={{ color:'#2563eb', fontSize:'.8rem', background:'#eff6ff', padding:'2px 7px', borderRadius:6 }}>{a.appointmentId}</code>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ fontWeight:600, fontSize:'.84rem' }}>{a.patient?.firstName} {a.patient?.lastName}</div>
                    <div style={{ fontSize:'.72rem', color:'#94a3b8' }}>{a.patient?.patientId}</div>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ fontWeight:500, fontSize:'.84rem' }}>{a.doctor?.name}</div>
                    <div style={{ fontSize:'.72rem', color:'#94a3b8' }}>{a.doctor?.department}</div>
                  </td>
                  <td style={{ padding:'11px 14px', whiteSpace:'nowrap' }}>
                    <div style={{ fontSize:'.83rem', fontWeight:600 }}>{new Date(a.appointmentDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</div>
                    <div className="time-pill" style={{ display:'inline-block', marginTop:3 }}><i className="bi bi-clock me-1" />{a.timeSlot}</div>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:'.8rem' }}>
                      <i className={`bi ${TYPE_ICON[a.type] || 'bi-calendar3'}`} style={{ color:'#2563eb' }} />
                      {a.type}
                    </span>
                  </td>
                  <td style={{ padding:'11px 14px' }}>{priorityBadge(a.priority)}</td>
                  <td style={{ padding:'11px 14px' }}>{sbadge(a.status)}</td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', gap:5, flexWrap:'nowrap' }}>
                      <button onClick={()=>{setViewing(a);setViewModal(true)}} id={`viewAppt-${a._id}`} data-test={`view-appt-${a._id}`}
                        style={{ padding:'4px 9px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', color:'#2563eb', cursor:'pointer', fontSize:'.78rem' }} title="View">
                        <i className="bi bi-eye" />
                      </button>
                      {canEdit && (
                        <button onClick={()=>openEdit(a)} id={`editAppt-${a._id}`} data-test={`edit-appt-${a._id}`}
                          style={{ padding:'4px 9px', borderRadius:7, border:'1px solid #e2e8f0', background:'#fff', color:'#475569', cursor:'pointer', fontSize:'.78rem' }} title="Edit">
                          <i className="bi bi-pencil" />
                        </button>
                      )}
                      {canEdit && !['Cancelled','Completed'].includes(a.status) && (
                        <button onClick={()=>{ setCancelTarget({...a, reason:''}); setCancelModal(true) }}
                          id={`cancelAppt-${a._id}`} data-test={`cancel-appt-${a._id}`}
                          style={{ padding:'4px 9px', borderRadius:7, border:'1px solid #fecaca', background:'#fff5f5', color:'#dc2626', cursor:'pointer', fontSize:'.78rem' }} title="Cancel">
                          <i className="bi bi-x-circle" />
                        </button>
                      )}
                      {canEdit && a.status==='Scheduled' && (
                        <button onClick={()=>handleStatusChange(a._id,'Confirmed')}
                          id={`confirmAppt-${a._id}`} data-test={`confirm-appt-${a._id}`}
                          style={{ padding:'4px 9px', borderRadius:7, border:'1px solid #d8b4fe', background:'#faf5ff', color:'#7c3aed', cursor:'pointer', fontSize:'.78rem' }} title="Confirm">
                          <i className="bi bi-check2" />
                        </button>
                      )}
                      {canEdit && a.status==='Confirmed' && (
                        <button onClick={()=>handleStatusChange(a._id,'Completed')}
                          id={`completeAppt-${a._id}`} data-test={`complete-appt-${a._id}`}
                          style={{ padding:'4px 9px', borderRadius:7, border:'1px solid #bbf7d0', background:'#f0fdf4', color:'#16a34a', cursor:'pointer', fontSize:'.78rem' }} title="Mark Complete">
                          <i className="bi bi-check2-all" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pg.pages > 1 && (
          <div style={{ padding:'12px 18px', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafd', flexWrap:'wrap', gap:8 }}>
            <span style={{ fontSize:'.78rem', color:'#64748b' }}>Page {pg.currentPage} of {pg.pages} · {pg.total} total</span>
            <nav><ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${pg.currentPage===1?'disabled':''}`}><button className="page-link" id="prevApptPage" onClick={()=>load(pg.currentPage-1)}><i className="bi bi-chevron-left"/></button></li>
              {[...Array(pg.pages)].map((_,i)=>(
                <li key={i} className={`page-item ${pg.currentPage===i+1?'active':''}`}><button className="page-link" id={`appt-page-${i+1}`} onClick={()=>load(i+1)}>{i+1}</button></li>
              ))}
              <li className={`page-item ${pg.currentPage===pg.pages?'disabled':''}`}><button className="page-link" id="nextApptPage" onClick={()=>load(pg.currentPage+1)}><i className="bi bi-chevron-right"/></button></li>
            </ul></nav>
          </div>
        )}
      </div>

      {/* ════════ CREATE / EDIT MODAL ════════ */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,40,.65)', backdropFilter:'blur(4px)', zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          id="appointmentModal" data-test="appointment-modal"
          onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:720, maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,.22)' }}>
            {/* Header */}
            <div style={{ background:'linear-gradient(135deg,#0f2d5c,#1a4a8a)', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:'.98rem', display:'flex', alignItems:'center', gap:8 }}>
                <i className="bi bi-calendar2-plus" />{editing ? 'Edit Appointment' : 'New Appointment'}
              </h5>
              <button onClick={()=>setShowModal(false)} style={{ background:'rgba(255,255,255,.15)', border:'none', color:'#fff', width:30, height:30, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><i className="bi bi-x" /></button>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ overflow:'auto', flex:1 }}>
              <div style={{ padding:24 }}>
                <div className="row g-3">

                  {/* Appointment ID */}
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="apptIdInput">Appointment ID *</label>
                    <input type="text" className={`form-control ${errors.appointmentId?'is-invalid':''}`} id="apptIdInput" name="apptIdInput" data-test="appt-id-input" value={form.appointmentId} onChange={e=>F('appointmentId',e.target.value)} disabled={!!editing} />
                    {errors.appointmentId && <div className="invalid-feedback">{errors.appointmentId}</div>}
                  </div>

                  {/* Type */}
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="apptTypeSelect">Appointment Type</label>
                    <select className="form-select" id="apptTypeSelect" name="apptTypeSelect" data-test="appt-type-select" value={form.type} onChange={e=>F('type',e.target.value)}>
                      {Object.keys(TYPE_ICON).map(t=><option key={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="apptPrioritySelect">Priority</label>
                    <select className="form-select" id="apptPrioritySelect" name="apptPrioritySelect" data-test="appt-priority-select" value={form.priority} onChange={e=>F('priority',e.target.value)}>
                      {['Normal','Urgent','Critical'].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Patient */}
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="apptPatientSelect">Patient *</label>
                    <select className={`form-select ${errors.patient?'is-invalid':''}`} id="apptPatientSelect" name="apptPatientSelect" data-test="appt-patient-select" value={form.patient} onChange={e=>F('patient',e.target.value)}>
                      <option value="">-- Select Patient --</option>
                      {patients.map(p=><option key={p._id} value={p._id}>{p.firstName} {p.lastName} ({p.patientId})</option>)}
                    </select>
                    {errors.patient && <div className="invalid-feedback">{errors.patient}</div>}
                  </div>

                  {/* Doctor */}
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="apptDoctorSelect">Doctor *</label>
                    <select className={`form-select ${errors.doctor?'is-invalid':''}`} id="apptDoctorSelect" name="apptDoctorSelect" data-test="appt-doctor-select" value={form.doctor} onChange={e=>F('doctor',e.target.value)}>
                      <option value="">-- Select Doctor --</option>
                      {doctors.map(d=><option key={d._id} value={d._id}>{d.name} {d.specialization?`· ${d.specialization}`:''}</option>)}
                    </select>
                    {errors.doctor && <div className="invalid-feedback">{errors.doctor}</div>}
                  </div>

                  {/* Date */}
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="apptDateInput">Appointment Date *</label>
                    <input type="date" className={`form-control ${errors.appointmentDate?'is-invalid':''}`} id="apptDateInput" name="apptDateInput" data-test="appt-date-input" value={form.appointmentDate} onChange={e=>F('appointmentDate',e.target.value)} min={new Date().toISOString().slice(0,10)} />
                    {errors.appointmentDate && <div className="invalid-feedback">{errors.appointmentDate}</div>}
                  </div>

                  {/* Duration */}
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="apptDuration">Duration (mins)</label>
                    <select className="form-select" id="apptDuration" name="apptDuration" data-test="appt-duration" value={form.duration} onChange={e=>F('duration',Number(e.target.value))}>
                      {[15,30,45,60,90,120].map(d=><option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>

                  {/* Status (only when editing) */}
                  {editing && (
                    <div className="col-md-4">
                      <label className="form-label" htmlFor="apptStatusSelect">Status</label>
                      <select className="form-select" id="apptStatusSelect" name="apptStatusSelect" data-test="appt-status-select" value={form.status} onChange={e=>F('status',e.target.value)}>
                        {Object.keys(STATUS_MAP).map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Time slots */}
                  <div className="col-12">
                    <label className="form-label">Time Slot * {errors.timeSlot && <span style={{color:'#ef4444',fontSize:'.75rem'}}> — {errors.timeSlot}</span>}</label>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:6 }} id="timeSlotGrid" data-test="time-slot-grid">
                      {TIME_SLOTS.map(t=>(
                        <button key={t} type="button"
                          className={`slot-btn ${form.timeSlot===t?'selected':''}`}
                          id={`slot-${t.replace(/[:\s]/g,'-')}`}
                          data-test={`slot-${t.replace(/[:\s]/g,'-')}`}
                          onClick={()=>F('timeSlot',t)}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Study & Site */}
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="apptStudySelect">Related Study</label>
                    <select className="form-select" id="apptStudySelect" name="apptStudySelect" data-test="appt-study-select" value={form.study} onChange={e=>F('study',e.target.value)}>
                      <option value="">-- None --</option>
                      {studies.map(s=><option key={s._id} value={s._id}>{s.studyName}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="apptSiteSelect">Site</label>
                    <select className="form-select" id="apptSiteSelect" name="apptSiteSelect" data-test="appt-site-select" value={form.site} onChange={e=>F('site',e.target.value)}>
                      <option value="">-- None --</option>
                      {sites.map(s=><option key={s._id} value={s._id}>{s.siteName}</option>)}
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="col-12">
                    <label className="form-label" htmlFor="apptNotes">Notes</label>
                    <textarea className="form-control" id="apptNotes" name="apptNotes" data-test="appt-notes" rows={3} value={form.notes} onChange={e=>F('notes',e.target.value)} placeholder="Any special instructions or notes for this appointment…" />
                  </div>
                </div>
              </div>

              <div style={{ padding:'14px 24px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10, background:'#f8fafc', flexShrink:0 }}>
                <button type="button" className="btn btn-secondary btn-sm" id="cancelApptModalBtn" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" id="saveAppointmentBtn" name="saveAppointmentBtn" data-test="save-appointment-btn" disabled={saving}
                  style={{ background:'linear-gradient(135deg,#0f2d5c,#2563eb)', color:'#fff', border:'none', borderRadius:8, padding:'7px 22px', fontSize:'.84rem', fontWeight:700, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8, opacity:saving?.7:1 }}>
                  {saving?<><span className="spinner-border spinner-border-sm"/>Saving…</>:<><i className="bi bi-check-circle"/>Save Appointment</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════ VIEW MODAL ════════ */}
      {viewModal && viewing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,40,.65)', backdropFilter:'blur(4px)', zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          id="appointmentViewModal" data-test="appointment-view-modal"
          onClick={e=>e.target===e.currentTarget&&setViewModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:560, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.22)' }}>
            <div style={{ background:'linear-gradient(135deg,#0f2d5c,#1a4a8a)', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:'.98rem' }}><i className="bi bi-calendar-event me-2" />Appointment Details</h5>
              <button onClick={()=>setViewModal(false)} style={{ background:'rgba(255,255,255,.15)', border:'none', color:'#fff', width:30, height:30, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><i className="bi bi-x" /></button>
            </div>
            <div style={{ padding:24 }}>
              {/* ID + status */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, paddingBottom:14, borderBottom:'1px solid #f1f5f9' }}>
                <code style={{ color:'#2563eb', background:'#eff6ff', padding:'4px 12px', borderRadius:8, fontWeight:700 }}>{viewing.appointmentId}</code>
                <div style={{ display:'flex', gap:8 }}>
                  {sbadge(viewing.status)}
                  {priorityBadge(viewing.priority)}
                </div>
              </div>
              <div className="row g-3" style={{ fontSize:'.84rem' }}>
                {[
                  ['Patient',  `${viewing.patient?.firstName||''} ${viewing.patient?.lastName||''} (${viewing.patient?.patientId||''})`],
                  ['Doctor',   `${viewing.doctor?.name||'—'} · ${viewing.doctor?.department||''}`],
                  ['Date',     new Date(viewing.appointmentDate).toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})],
                  ['Time',     viewing.timeSlot],
                  ['Duration', `${viewing.duration} minutes`],
                  ['Type',     viewing.type],
                  ['Study',    viewing.study?.studyName || '—'],
                  ['Site',     viewing.site?.siteName   || '—'],
                ].map(([label,val])=>(
                  <div className="col-6" key={label}>
                    <div style={{ fontSize:'.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</div>
                    <div style={{ marginTop:3, fontWeight:500 }}>{val}</div>
                  </div>
                ))}
                {viewing.notes && (
                  <div className="col-12">
                    <div style={{ fontSize:'.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>Notes</div>
                    <div style={{ marginTop:4, background:'#f8fafc', padding:'10px 12px', borderRadius:8, fontSize:'.83rem' }}>{viewing.notes}</div>
                  </div>
                )}
                {viewing.cancelReason && (
                  <div className="col-12">
                    <div style={{ background:'#fff5f5', border:'1px solid #fecaca', borderRadius:8, padding:'10px 12px', fontSize:'.83rem', color:'#dc2626' }}>
                      <i className="bi bi-info-circle me-2" />Cancel reason: {viewing.cancelReason}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding:'14px 24px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10, background:'#f8fafc' }}>
              <button className="btn btn-secondary btn-sm" onClick={()=>setViewModal(false)}>Close</button>
              {canEdit && !['Cancelled','Completed'].includes(viewing.status) && (
                <button id="editFromViewBtn" data-test="edit-from-view-btn" onClick={()=>{ setViewModal(false); openEdit(viewing) }}
                  style={{ background:'linear-gradient(135deg,#0f2d5c,#2563eb)', color:'#fff', border:'none', borderRadius:8, padding:'7px 18px', fontSize:'.83rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
                  <i className="bi bi-pencil" />Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════ CANCEL MODAL ════════ */}
      {cancelModal && cancelTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,40,.65)', backdropFilter:'blur(4px)', zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          id="cancelAppointmentModal" data-test="cancel-appointment-modal"
          onClick={e=>e.target===e.currentTarget&&setCancelModal(false)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:400, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.22)' }}>
            <div style={{ background:'linear-gradient(135deg,#991b1b,#ef4444)', padding:'18px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:'.95rem' }}><i className="bi bi-x-circle me-2" />Cancel Appointment</h5>
              <button onClick={()=>setCancelModal(false)} style={{ background:'rgba(255,255,255,.15)', border:'none', color:'#fff', width:28, height:28, borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><i className="bi bi-x" /></button>
            </div>
            <div style={{ padding:24 }}>
              <p style={{ fontSize:'.88rem', marginBottom:14 }}>Cancel appointment <strong>{cancelTarget.appointmentId}</strong> for <strong>{cancelTarget.patient?.firstName} {cancelTarget.patient?.lastName}</strong>?</p>
              <label className="form-label" htmlFor="cancelReasonInput">Cancellation Reason</label>
              <textarea className="form-control" id="cancelReasonInput" name="cancelReasonInput" data-test="cancel-reason-input" rows={3}
                placeholder="e.g. Patient unavailable, rescheduled, etc."
                value={cancelTarget.reason||''}
                onChange={e=>setCancelTarget(c=>({...c,reason:e.target.value}))} />
            </div>
            <div style={{ padding:'14px 24px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10, background:'#f8fafc' }}>
              <button className="btn btn-secondary btn-sm" onClick={()=>setCancelModal(false)}>Back</button>
              <button id="confirmCancelBtn" name="confirmCancelBtn" data-test="confirm-cancel-btn" onClick={handleCancel}
                style={{ background:'linear-gradient(135deg,#991b1b,#ef4444)', color:'#fff', border:'none', borderRadius:8, padding:'7px 18px', fontSize:'.83rem', fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
                <i className="bi bi-x-circle" />Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {delTarget && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,40,.65)', backdropFilter:'blur(4px)', zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          id="deleteApptModal" data-test="delete-appt-modal"
          onClick={e=>e.target===e.currentTarget&&setDelTarget(null)}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:380, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,.22)' }}>
            <div style={{ background:'linear-gradient(135deg,#991b1b,#ef4444)', padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <h5 style={{ color:'#fff', margin:0, fontWeight:700, fontSize:'.95rem' }}><i className="bi bi-trash me-2" />Delete Appointment</h5>
              <button onClick={()=>setDelTarget(null)} style={{ background:'rgba(255,255,255,.15)', border:'none', color:'#fff', width:28, height:28, borderRadius:7, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><i className="bi bi-x" /></button>
            </div>
            <div style={{ padding:22 }}>
              <p style={{ margin:0, fontSize:'.88rem' }}>Permanently delete <strong>{delTarget.appointmentId}</strong>? This cannot be undone.</p>
            </div>
            <div style={{ padding:'12px 22px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10, background:'#f8fafc' }}>
              <button className="btn btn-secondary btn-sm" onClick={()=>setDelTarget(null)}>Cancel</button>
              <button id="confirmDeleteApptBtn" data-test="confirm-delete-appt-btn" onClick={handleDelete}
                style={{ background:'linear-gradient(135deg,#991b1b,#ef4444)', color:'#fff', border:'none', borderRadius:8, padding:'7px 16px', fontSize:'.83rem', fontWeight:600, cursor:'pointer' }}>
                <i className="bi bi-trash me-1" />Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
