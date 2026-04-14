import React, { useState, useEffect, useCallback } from 'react'
import { patientsAPI, studiesAPI, sitesAPI } from '../../api/index.js'
import { DeleteModal, Pagination, Alert, LoadingRow, EmptyRow } from '../Layout/Shared.jsx'

const EMPTY = { patientId:'', firstName:'', lastName:'', dateOfBirth:'', gender:'', email:'', phone:'', address:'', bloodGroup:'Unknown', study:'', site:'', status:'Screening', medicalHistory:'', allergies:'', consentSigned:false, consentDate:'', emergencyContact:'', emergencyPhone:'' }
const STATUS_BADGE = { Active:'bp-active', Inactive:'bp-inactive', Enrolled:'bp-enrolled', Screening:'bp-screening', Completed:'bp-completed', Withdrawn:'bp-withdrawn' }
const BLOOD = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown']

function PatientAvatar({ name, gender }) {
  const cls = { Male:'pa-male', Female:'pa-female', Other:'pa-other' }
  const ini = (name||'?').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
  return <div className={`patient-avatar ${cls[gender]||'pa-other'}`}>{ini}</div>
}

function PatientModal({ show, onClose, onSave, editing, studies, sites }) {
  const [form, setForm] = useState(EMPTY); const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false); const [tab, setTab] = useState('basic')
  useEffect(() => {
    if (show) {
      setTab('basic')
      setForm(editing ? { patientId:editing.patientId, firstName:editing.firstName, lastName:editing.lastName, dateOfBirth:editing.dateOfBirth?.slice(0,10)||'', gender:editing.gender, email:editing.email||'', phone:editing.phone||'', address:editing.address||'', bloodGroup:editing.bloodGroup||'Unknown', study:editing.study?._id||editing.study||'', site:editing.site?._id||editing.site||'', status:editing.status, medicalHistory:editing.medicalHistory||'', allergies:editing.allergies||'', consentSigned:editing.consentSigned||false, consentDate:editing.consentDate?.slice(0,10)||'', emergencyContact:editing.emergencyContact||'', emergencyPhone:editing.emergencyPhone||'' } : EMPTY)
    }
    setErrors({})
  }, [show, editing])
  const f = (k,v) => setForm(p=>({...p,[k]:v}))
  const validate = () => { const e={}; if (!form.patientId.trim()) e.patientId='Required'; if (!form.firstName.trim()) e.firstName='Required'; if (!form.lastName.trim()) e.lastName='Required'; if (!form.dateOfBirth) e.dob='Required'; if (!form.gender) e.gender='Required'; if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email='Invalid'; return e }
  const handleSubmit = async ev => { ev.preventDefault(); const ve=validate(); if (Object.keys(ve).length) { setErrors(ve); setTab('basic'); return }; setBusy(true); try { await onSave(form); onClose() } catch(err) { setErrors({api:err.response?.data?.message||'Save failed'}) } finally { setBusy(false) } }
  if (!show) return null
  const TABS = ['basic','clinical','consent']
  const TL   = { basic:'Basic Info', clinical:'Clinical', consent:'Consent & Emergency' }
  const tabStyle = (t) => ({ padding:'10px 20px', border:'none', background:'none', cursor:'pointer', fontFamily:'inherit', fontSize:'.84rem', fontWeight:tab===t?700:500, color:tab===t?'var(--c-teal)':'var(--c-muted)', borderBottom:tab===t?'2px solid var(--c-teal)':'2px solid transparent', transition:'all .15s' })
  return (
    <div className="modal-overlay" id="patientModal" data-test="patient-modal">
      <div className="modal-box lg">
        <div className="modal-head"><h5><i className="bi bi-person-vcard-fill"></i> {editing?'Edit Patient':'Register New Patient'}</h5><button className="modal-close" onClick={onClose}><i className="bi bi-x"></i></button></div>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{borderBottom:'1px solid var(--c-border)',display:'flex',background:'#fafbfc'}}>
            {TABS.map(t=><button key={t} type="button" style={tabStyle(t)} id={`patientTab-${t}`} data-test={`patient-tab-${t}`} onClick={()=>setTab(t)}>{TL[t]}</button>)}
          </div>
          <div className="modal-body">
            {errors.api && <div className="ctms-alert alert-danger" style={{marginBottom:12}}>{errors.api}</div>}
            {tab==='basic' && (
              <div className="row g-3">
                <div className="col-md-3"><div className="form-group"><label className="form-label">Patient ID <span className="req">*</span></label><input id="patientIdInput" name="patientIdInput" data-test="patient-id-input" className={`form-ctrl ${errors.patientId?'error':''}`} value={form.patientId} onChange={e=>f('patientId',e.target.value)} disabled={!!editing}/>{errors.patientId&&<p className="form-error" id="patientIdError">{errors.patientId}</p>}</div></div>
                <div className="col-md-4"><div className="form-group"><label className="form-label">First Name <span className="req">*</span></label><input id="firstNameInput" name="firstNameInput" data-test="first-name-input" className={`form-ctrl ${errors.firstName?'error':''}`} value={form.firstName} onChange={e=>f('firstName',e.target.value)}/>{errors.firstName&&<p className="form-error">{errors.firstName}</p>}</div></div>
                <div className="col-md-5"><div className="form-group"><label className="form-label">Last Name <span className="req">*</span></label><input id="lastNameInput" name="lastNameInput" data-test="last-name-input" className={`form-ctrl ${errors.lastName?'error':''}`} value={form.lastName} onChange={e=>f('lastName',e.target.value)}/>{errors.lastName&&<p className="form-error">{errors.lastName}</p>}</div></div>
                <div className="col-md-4"><div className="form-group"><label className="form-label">Date of Birth <span className="req">*</span></label><input type="date" id="dobInput" name="dobInput" data-test="dob-input" className={`form-ctrl ${errors.dob?'error':''}`} value={form.dateOfBirth} onChange={e=>f('dateOfBirth',e.target.value)}/>{errors.dob&&<p className="form-error">{errors.dob}</p>}</div></div>
                <div className="col-md-4"><div className="form-group"><label className="form-label">Gender <span className="req">*</span></label><select id="patientGenderSelect" name="patientGenderSelect" data-test="patient-gender-select" className={`form-sel ${errors.gender?'error':''}`} value={form.gender} onChange={e=>f('gender',e.target.value)}><option value="">-- Select --</option><option>Male</option><option>Female</option><option>Other</option></select>{errors.gender&&<p className="form-error">{errors.gender}</p>}</div></div>
                <div className="col-md-4"><div className="form-group"><label className="form-label">Blood Group</label><select id="bloodGroupSelect" name="bloodGroupSelect" data-test="blood-group-select" className="form-sel" value={form.bloodGroup} onChange={e=>f('bloodGroup',e.target.value)}>{BLOOD.map(b=><option key={b}>{b}</option>)}</select></div></div>
                <div className="col-md-6"><div className="form-group"><label className="form-label">Email</label><input type="email" id="patientEmailInput" name="patientEmailInput" data-test="patient-email-input" className={`form-ctrl ${errors.email?'error':''}`} value={form.email} onChange={e=>f('email',e.target.value)}/>{errors.email&&<p className="form-error">{errors.email}</p>}</div></div>
                <div className="col-md-6"><div className="form-group"><label className="form-label">Phone</label><input id="patientPhoneInput" name="patientPhoneInput" data-test="patient-phone-input" className="form-ctrl" value={form.phone} onChange={e=>f('phone',e.target.value)}/></div></div>
                <div className="col-12"><div className="form-group"><label className="form-label">Address</label><input id="patientAddressInput" className="form-ctrl" value={form.address} onChange={e=>f('address',e.target.value)}/></div></div>
              </div>
            )}
            {tab==='clinical' && (
              <div className="row g-3">
                <div className="col-md-6"><div className="form-group"><label className="form-label">Assign Study</label><select id="patientStudyDropdown" name="patientStudyDropdown" data-test="patient-study-dropdown" className="form-sel" value={form.study} onChange={e=>f('study',e.target.value)}><option value="">-- No Study --</option>{studies.map(s=><option key={s._id} value={s._id}>{s.studyName} ({s.studyId})</option>)}</select></div></div>
                <div className="col-md-6"><div className="form-group"><label className="form-label">Assign Site</label><select id="patientSiteDropdown" name="patientSiteDropdown" data-test="patient-site-dropdown" className="form-sel" value={form.site} onChange={e=>f('site',e.target.value)}><option value="">-- No Site --</option>{sites.map(s=><option key={s._id} value={s._id}>{s.siteName}</option>)}</select></div></div>
                <div className="col-md-4"><div className="form-group"><label className="form-label">Status</label><select id="patientStatusSelect" name="patientStatusSelect" data-test="patient-status-select" className="form-sel" value={form.status} onChange={e=>f('status',e.target.value)}><option>Screening</option><option>Active</option><option>Enrolled</option><option>Completed</option><option>Withdrawn</option><option>Inactive</option></select></div></div>
                <div className="col-12"><div className="form-group"><label className="form-label">Medical History</label><textarea id="medHistoryInput" name="medHistoryInput" data-test="med-history-input" className="form-ctrl" rows="3" value={form.medicalHistory} onChange={e=>f('medicalHistory',e.target.value)}/></div></div>
                <div className="col-12"><div className="form-group"><label className="form-label">Known Allergies</label><textarea id="allergiesInput" name="allergiesInput" data-test="allergies-input" className="form-ctrl" rows="2" value={form.allergies} onChange={e=>f('allergies',e.target.value)}/></div></div>
              </div>
            )}
            {tab==='consent' && (
              <div className="row g-3">
                <div className="col-12"><div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'12px 16px'}}><strong style={{color:'#1e40af',fontSize:'.85rem'}}><i className="bi bi-info-circle me-2"></i>Informed Consent</strong><p style={{color:'#3b82f6',fontSize:'.78rem',margin:'4px 0 0'}}>Record patient consent status.</p></div></div>
                <div className="col-md-6"><div className="form-group"><div className="form-check"><input type="checkbox" id="consentSignedCheck" name="consentSignedCheck" data-test="consent-signed-check" checked={form.consentSigned} onChange={e=>f('consentSigned',e.target.checked)}/><label htmlFor="consentSignedCheck" className="form-label" style={{margin:0}}>Informed Consent Signed</label></div></div></div>
                <div className="col-md-6"><div className="form-group"><label className="form-label">Consent Date</label><input type="date" id="consentDateInput" name="consentDateInput" data-test="consent-date-input" className="form-ctrl" value={form.consentDate} onChange={e=>f('consentDate',e.target.value)} disabled={!form.consentSigned}/></div></div>
                <div className="col-md-6"><div className="form-group"><label className="form-label">Emergency Contact Name</label><input id="emergencyContactInput" name="emergencyContactInput" data-test="emergency-contact-input" className="form-ctrl" value={form.emergencyContact} onChange={e=>f('emergencyContact',e.target.value)}/></div></div>
                <div className="col-md-6"><div className="form-group"><label className="form-label">Emergency Contact Phone</label><input id="emergencyPhoneInput" name="emergencyPhoneInput" data-test="emergency-phone-input" className="form-ctrl" value={form.emergencyPhone} onChange={e=>f('emergencyPhone',e.target.value)}/></div></div>
              </div>
            )}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-ctms btn-outline" id="cancelPatientBtn" onClick={onClose}>Cancel</button>
            {tab!=='consent' && <button type="button" className="btn-ctms btn-outline" onClick={()=>setTab(TABS[TABS.indexOf(tab)+1])}>Next <i className="bi bi-arrow-right"></i></button>}
            <button type="submit" className="btn-ctms btn-teal" id="savePatientBtn" name="savePatientBtn" data-test="save-patient-btn" disabled={busy}>{busy?<><span className="spin"></span> Saving…</>:<><i className="bi bi-person-check-fill"></i> {editing?'Update':'Register'}</>}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Patients() {
  const [patients, setPatients] = useState([]); const [pag, setPag] = useState({total:0,pages:1,currentPage:1}); const [search, setSearch] = useState(''); const [filterStatus, setFilterStatus] = useState(''); const [loading, setLoading] = useState(true); const [alert, setAlert] = useState(null); const [studies, setStudies] = useState([]); const [sites, setSites] = useState([]); const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState(null); const [deleteTgt, setDeleteTgt] = useState(null); const [viewing, setViewing] = useState(null)
  const showAlert = (type,msg) => { setAlert({type,message:msg}); setTimeout(()=>setAlert(null),4000) }
  const load = useCallback(async (page=1) => { setLoading(true); try { const r=await patientsAPI.getAll({page,limit:5,search,status:filterStatus}); setPatients(r.data.patients); setPag({total:r.data.total,pages:r.data.pages,currentPage:r.data.currentPage}) } catch { showAlert('danger','Failed to load patients') } finally { setLoading(false) } }, [search, filterStatus])
  useEffect(() => { load(1) }, [load])
  useEffect(() => { studiesAPI.getAllNoPag().then(r=>setStudies(r.data)).catch(()=>{}); sitesAPI.getAllNoPag().then(r=>setSites(r.data)).catch(()=>{}) }, [])
  const handleSave = async form => { if (editing) { await patientsAPI.update(editing._id,form); showAlert('success','Patient updated') } else { await patientsAPI.create(form); showAlert('success','Patient registered') }; load(pag.currentPage) }
  const handleDelete = async () => { await patientsAPI.delete(deleteTgt._id); showAlert('success','Patient removed'); setDeleteTgt(null); load(1) }
  const calcAge = dob => { if (!dob) return '—'; return Math.floor((Date.now()-new Date(dob).getTime())/(365.25*24*60*60*1000)) }
  return (
    <div data-test="patients-page">
      <Alert alert={alert} onClose={()=>setAlert(null)} />
      <div className="page-header">
        <div className="page-header-left"><h4><i className="bi bi-person-vcard-fill" style={{color:'var(--c-teal)',marginRight:8}}></i>Patient Registry</h4><p>Registered patients across all studies and sites</p></div>
        <button className="btn-ctms btn-teal" id="createPatientBtn" name="createPatientBtn" data-test="create-patient-btn" onClick={()=>{setEditing(null);setShowModal(true)}}><i className="bi bi-person-plus-fill"></i> Register Patient</button>
      </div>
      <div className="data-card">
        <div className="table-toolbar">
          <div className="search-box"><span className="search-icon"><i className="bi bi-search"></i></span><input className="search-input" id="patientSearch" name="patientSearch" data-test="patient-search" placeholder="Search ID, name or email…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <select className="form-sel" id="patientStatusFilter" name="patientStatusFilter" data-test="patient-status-filter" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:'auto',minWidth:130}}><option value="">All Statuses</option><option>Active</option><option>Screening</option><option>Enrolled</option><option>Completed</option><option>Withdrawn</option><option>Inactive</option></select>
          <span style={{marginLeft:'auto',fontSize:'.78rem',color:'var(--c-muted)'}}>{pag.total} patients</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="ctms-table" id="patientsTable" data-test="patients-table">
            <thead><tr><th>#</th><th>Patient</th><th>ID</th><th>Age</th><th>Blood</th><th>Study</th><th>Site</th><th>Consent</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading?<LoadingRow cols={10}/>:patients.length===0?<EmptyRow cols={10} icon="bi-person-x" message="No patients registered yet."/>:patients.map((p,i)=>(
                <tr key={p._id} id={`patient-row-${p._id}`} data-test={`patient-row-${p._id}`}>
                  <td style={{color:'var(--c-muted)',fontSize:'.75rem'}}>{(pag.currentPage-1)*5+i+1}</td>
                  <td><div style={{display:'flex',alignItems:'center',gap:8}}><PatientAvatar name={`${p.firstName} ${p.lastName}`} gender={p.gender}/><div><div style={{fontWeight:600,fontSize:'.85rem'}}>{p.firstName} {p.lastName}</div><div style={{fontSize:'.72rem',color:'var(--c-muted)'}}>{p.email||'—'}</div></div></div></td>
                  <td><span className="mono-id">{p.patientId}</span></td>
                  <td style={{fontWeight:600}}>{calcAge(p.dateOfBirth)} <span style={{fontSize:'.72rem',color:'var(--c-muted)',fontWeight:400}}>yrs</span></td>
                  <td><span style={{fontWeight:700,color:'var(--c-navy)',fontSize:'.82rem'}}>{p.bloodGroup}</span></td>
                  <td style={{fontSize:'.78rem'}}>{p.study?.studyName||<span style={{color:'var(--c-muted)'}}>—</span>}</td>
                  <td style={{fontSize:'.78rem'}}>{p.site?.siteName||<span style={{color:'var(--c-muted)'}}>—</span>}</td>
                  <td><span className={`consent-chip ${p.consentSigned?'consent-yes':'consent-no'}`}><i className={`bi bi-${p.consentSigned?'check-circle-fill':'x-circle-fill'}`}></i>{p.consentSigned?'Yes':'No'}</span></td>
                  <td><span className={`badge-pill ${STATUS_BADGE[p.status]||''}`}>{p.status}</span></td>
                  <td>
                    <button className="btn-edit me-1" id={`viewPatient-${p._id}`} data-test={`view-patient-${p._id}`} onClick={()=>setViewing(p)} title="View"><i className="bi bi-eye"></i></button>
                    <button className="btn-edit me-1" id={`editPatient-${p._id}`} data-test={`edit-patient-${p._id}`} onClick={()=>{setEditing(p);setShowModal(true)}}><i className="bi bi-pencil"></i></button>
                    <button className="btn-del" id={`deletePatient-${p._id}`} data-test={`delete-patient-${p._id}`} onClick={()=>setDeleteTgt(p)}><i className="bi bi-trash3"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pag} onPage={load}/>
      </div>
      <PatientModal show={showModal} onClose={()=>setShowModal(false)} onSave={handleSave} editing={editing} studies={studies} sites={sites}/>
      <DeleteModal show={!!deleteTgt} onClose={()=>setDeleteTgt(null)} onConfirm={handleDelete} title={`Remove "${deleteTgt?.firstName} ${deleteTgt?.lastName}"?`} message="This will permanently remove the patient record." testId="delete-patient-modal"/>
      {viewing && (
        <div className="modal-overlay" id="patientDetailModal" data-test="patient-detail-modal">
          <div className="modal-box">
            <div className="modal-head"><h5><i className="bi bi-person-lines-fill"></i> Patient Profile</h5><button className="modal-close" onClick={()=>setViewing(null)}><i className="bi bi-x"></i></button></div>
            <div className="modal-body" style={{paddingBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20,padding:'14px 16px',background:'var(--c-bg)',borderRadius:10}}>
                <PatientAvatar name={`${viewing.firstName} ${viewing.lastName}`} gender={viewing.gender}/>
                <div style={{flex:1}}><h5 style={{margin:0,fontWeight:700}}>{viewing.firstName} {viewing.lastName}</h5><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:4}}><span className="mono-id">{viewing.patientId}</span><span className={`badge-pill ${STATUS_BADGE[viewing.status]||''}`}>{viewing.status}</span><span className={`consent-chip ${viewing.consentSigned?'consent-yes':'consent-no'}`}>Consent: {viewing.consentSigned?'Signed':'Pending'}</span></div></div>
                <div style={{textAlign:'center'}}><div style={{fontSize:'2rem',fontWeight:700,color:'var(--c-navy)'}}>{calcAge(viewing.dateOfBirth)}</div><div style={{fontSize:'.72rem',color:'var(--c-muted)'}}>years old</div></div>
              </div>
              <div className="row g-3">
                {[['Gender',viewing.gender],['Blood Group',viewing.bloodGroup],['DOB',viewing.dateOfBirth?new Date(viewing.dateOfBirth).toLocaleDateString():'—'],['Email',viewing.email||'—'],['Phone',viewing.phone||'—'],['Address',viewing.address||'—'],['Study',viewing.study?.studyName||'Not assigned'],['Site',viewing.site?.siteName||'Not assigned'],['Emergency',viewing.emergencyContact||'—'],['Emg Phone',viewing.emergencyPhone||'—']].map(([label,val])=>(
                  <div className="col-md-6" key={label}><div style={{fontSize:'.72rem',fontWeight:600,color:'var(--c-muted)',textTransform:'uppercase',letterSpacing:'.5px'}}>{label}</div><div style={{fontSize:'.88rem',fontWeight:500,marginTop:2}}>{val}</div></div>
                ))}
                {viewing.medicalHistory&&<div className="col-12"><div style={{fontSize:'.72rem',fontWeight:600,color:'var(--c-muted)',textTransform:'uppercase'}}>Medical History</div><div style={{fontSize:'.84rem',marginTop:4,background:'var(--c-bg)',padding:'8px 12px',borderRadius:6}}>{viewing.medicalHistory}</div></div>}
                {viewing.allergies&&<div className="col-12"><div style={{fontSize:'.72rem',fontWeight:600,color:'var(--c-muted)',textTransform:'uppercase'}}>Allergies</div><div style={{fontSize:'.84rem',marginTop:4,background:'#fff7ed',border:'1px solid #fed7aa',padding:'8px 12px',borderRadius:6,color:'#9a3412'}}>{viewing.allergies}</div></div>}
              </div>
            </div>
            <div className="modal-foot"><button className="btn-ctms btn-outline" onClick={()=>setViewing(null)}>Close</button><button className="btn-ctms btn-primary" onClick={()=>{setEditing(viewing);setViewing(null);setShowModal(true)}}><i className="bi bi-pencil"></i> Edit</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
