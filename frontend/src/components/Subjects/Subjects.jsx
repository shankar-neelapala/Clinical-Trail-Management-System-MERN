import React, { useState, useEffect, useCallback } from 'react'
import { subjectsAPI, studiesAPI } from '../../api/index.js'
import { DeleteModal, Pagination, Alert, LoadingRow, EmptyRow } from '../Layout/Shared.jsx'

const EMPTY = { subjectId:'', study:'', gender:'', age:'', enrollmentDate:'', status:'Screening' }
const SB = { Active:'bp-active', Completed:'bp-completed', Withdrawn:'bp-withdrawn', Screening:'bp-screening' }

function SubjectModal({ show, onClose, onSave, editing, studies }) {
  const [form, setForm] = useState(EMPTY); const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false)
  useEffect(() => { if (show) setForm(editing ? { subjectId:editing.subjectId, study:editing.study?._id||'', gender:editing.gender, age:editing.age, enrollmentDate:editing.enrollmentDate?.slice(0,10)||'', status:editing.status } : EMPTY); setErrors({}) }, [show, editing])
  const f = (k,v) => setForm(p=>({...p,[k]:v}))
  const validate = () => { const e={}; if (!form.subjectId.trim()) e.subjectId='Required'; if (!form.study) e.study='Required'; if (!form.gender) e.gender='Required'; if (!form.age) e.age='Required'; else if (form.age<1||form.age>120) e.age='Must be 1–120'; if (!form.enrollmentDate) e.enrollmentDate='Required'; return e }
  const handleSubmit = async ev => { ev.preventDefault(); const ve=validate(); if (Object.keys(ve).length) {setErrors(ve);return}; setBusy(true); try { await onSave(form); onClose() } catch(err) { setErrors({api:err.response?.data?.message||'Save failed'}) } finally { setBusy(false) } }
  if (!show) return null
  return (
    <div className="modal-overlay" id="subjectModal" data-test="subject-modal">
      <div className="modal-box">
        <div className="modal-head"><h5><i className="bi bi-people-fill"></i> {editing?'Edit Subject':'New Subject'}</h5><button className="modal-close" onClick={onClose}><i className="bi bi-x"></i></button></div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {errors.api && <div className="ctms-alert alert-danger" style={{marginBottom:12}}>{errors.api}</div>}
            <div className="row g-3">
              <div className="col-md-4"><div className="form-group"><label className="form-label">Subject ID <span className="req">*</span></label><input id="subjectIdInput" name="subjectIdInput" data-test="subject-id-input" className={`form-ctrl ${errors.subjectId?'error':''}`} value={form.subjectId} onChange={e=>f('subjectId',e.target.value)} disabled={!!editing} />{errors.subjectId&&<p className="form-error">{errors.subjectId}</p>}</div></div>
              <div className="col-md-8"><div className="form-group"><label className="form-label">Study <span className="req">*</span></label><select id="studyDropdown" name="studyDropdown" data-test="study-dropdown" className={`form-sel ${errors.study?'error':''}`} value={form.study} onChange={e=>f('study',e.target.value)}><option value="">-- Select Study --</option>{studies.map(s=><option key={s._id} value={s._id}>{s.studyName} ({s.studyId})</option>)}</select>{errors.study&&<p className="form-error">{errors.study}</p>}</div></div>
              <div className="col-md-4"><div className="form-group"><label className="form-label">Gender <span className="req">*</span></label><select id="genderSelect" name="genderSelect" data-test="gender-select" className={`form-sel ${errors.gender?'error':''}`} value={form.gender} onChange={e=>f('gender',e.target.value)}><option value="">-- Select --</option><option>Male</option><option>Female</option><option>Other</option></select>{errors.gender&&<p className="form-error">{errors.gender}</p>}</div></div>
              <div className="col-md-4"><div className="form-group"><label className="form-label">Age <span className="req">*</span></label><input type="number" id="ageInput" name="ageInput" data-test="age-input" className={`form-ctrl ${errors.age?'error':''}`} min="1" max="120" value={form.age} onChange={e=>f('age',e.target.value)} />{errors.age&&<p className="form-error">{errors.age}</p>}</div></div>
              <div className="col-md-4"><div className="form-group"><label className="form-label">Status</label><select id="subjectStatusSelect" name="subjectStatusSelect" data-test="subject-status-select" className="form-sel" value={form.status} onChange={e=>f('status',e.target.value)}><option>Screening</option><option>Active</option><option>Completed</option><option>Withdrawn</option></select></div></div>
              <div className="col-md-6"><div className="form-group"><label className="form-label">Enrollment Date <span className="req">*</span></label><input type="date" id="enrollmentDateInput" name="enrollmentDateInput" data-test="enrollment-date-input" className={`form-ctrl ${errors.enrollmentDate?'error':''}`} value={form.enrollmentDate} onChange={e=>f('enrollmentDate',e.target.value)} />{errors.enrollmentDate&&<p className="form-error">{errors.enrollmentDate}</p>}</div></div>
            </div>
          </div>
          <div className="modal-foot"><button type="button" className="btn-ctms btn-outline" onClick={onClose}>Cancel</button><button type="submit" className="btn-ctms btn-primary" id="saveSubjectBtn" name="saveSubjectBtn" data-test="save-subject-btn" disabled={busy}>{busy?<><span className="spin"></span> Saving…</>:<><i className="bi bi-check-circle"></i> Save</>}</button></div>
        </form>
      </div>
    </div>
  )
}

export default function Subjects() {
  const [subjects, setSubjects] = useState([]); const [pag, setPag] = useState({total:0,pages:1,currentPage:1}); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [alert, setAlert] = useState(null); const [studies, setStudies] = useState([]); const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState(null); const [deleteTgt, setDeleteTgt] = useState(null)
  const showAlert = (type,message) => { setAlert({type,message}); setTimeout(()=>setAlert(null),4000) }
  const load = useCallback(async (page=1) => { setLoading(true); try { const r=await subjectsAPI.getAll({page,limit:5,search}); setSubjects(r.data.subjects); setPag({total:r.data.total,pages:r.data.pages,currentPage:r.data.currentPage}) } catch { showAlert('danger','Failed to load') } finally { setLoading(false) } }, [search])
  useEffect(() => { load(1) }, [load])
  useEffect(() => { studiesAPI.getAllNoPag().then(r=>setStudies(r.data)).catch(()=>{}) }, [])
  const handleSave = async form => { if (editing) { await subjectsAPI.update(editing._id,form); showAlert('success','Updated') } else { await subjectsAPI.create(form); showAlert('success','Created') }; load(pag.currentPage) }
  const handleDelete = async () => { await subjectsAPI.delete(deleteTgt._id); showAlert('success','Deleted'); setDeleteTgt(null); load(1) }
  return (
    <div data-test="subjects-page">
      <Alert alert={alert} onClose={()=>setAlert(null)} />
      <div className="page-header"><div className="page-header-left"><h4><i className="bi bi-people-fill" style={{color:'var(--c-teal)',marginRight:8}}></i>Subjects</h4><p>Trial participants per study</p></div><button className="btn-ctms btn-primary" id="createSubjectBtn" name="createSubjectBtn" data-test="create-subject-btn" onClick={()=>{setEditing(null);setShowModal(true)}}><i className="bi bi-plus-circle"></i> New Subject</button></div>
      <div className="data-card">
        <div className="table-toolbar"><div className="search-box"><span className="search-icon"><i className="bi bi-search"></i></span><input className="search-input" id="subjectSearch" name="subjectSearch" data-test="subject-search" placeholder="Search Subject ID…" value={search} onChange={e=>setSearch(e.target.value)} /></div><span style={{marginLeft:'auto',fontSize:'.78rem',color:'var(--c-muted)'}}>{pag.total} subjects</span></div>
        <div style={{overflowX:'auto'}}><table className="ctms-table" id="subjectsTable" data-test="subjects-table">
          <thead><tr><th>#</th><th>Subject ID</th><th>Study</th><th>Gender</th><th>Age</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{loading?<LoadingRow cols={8}/>:subjects.length===0?<EmptyRow cols={8} icon="bi-people" message="No subjects found"/>:subjects.map((s,i)=>(
            <tr key={s._id} id={`subject-row-${s._id}`} data-test={`subject-row-${s._id}`}>
              <td style={{color:'var(--c-muted)',fontSize:'.75rem'}}>{(pag.currentPage-1)*5+i+1}</td>
              <td><span className="mono-id">{s.subjectId}</span></td>
              <td style={{fontSize:'.8rem'}}>{s.study?.studyName||'—'}</td>
              <td><span style={{fontSize:'.8rem'}}>{s.gender}</span></td>
              <td style={{fontWeight:600}}>{s.age}</td>
              <td style={{fontSize:'.8rem'}}>{new Date(s.enrollmentDate).toLocaleDateString()}</td>
              <td><span className={`badge-pill ${SB[s.status]||''}`}>{s.status}</span></td>
              <td><button className="btn-edit me-1" id={`editSubject-${s._id}`} data-test={`edit-subject-${s._id}`} onClick={()=>{setEditing(s);setShowModal(true)}}><i className="bi bi-pencil"></i></button><button className="btn-del" id={`deleteSubject-${s._id}`} data-test={`delete-subject-${s._id}`} onClick={()=>setDeleteTgt(s)}><i className="bi bi-trash3"></i></button></td>
            </tr>
          ))}</tbody>
        </table></div>
        <Pagination pagination={pag} onPage={load} />
      </div>
      <SubjectModal show={showModal} onClose={()=>setShowModal(false)} onSave={handleSave} editing={editing} studies={studies} />
      <DeleteModal show={!!deleteTgt} onClose={()=>setDeleteTgt(null)} onConfirm={handleDelete} title={`Delete subject "${deleteTgt?.subjectId}"?`} message="This action cannot be undone." testId="delete-subject-modal" />
    </div>
  )
}
