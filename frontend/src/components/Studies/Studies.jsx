import React, { useState, useEffect, useCallback } from 'react'
import { studiesAPI } from '../../api/index.js'
import { DeleteModal, Pagination, Alert, LoadingRow, EmptyRow } from '../Layout/Shared.jsx'

const EMPTY = { studyId:'', studyName:'', phase:'', status:'Active', startDate:'', endDate:'', sponsor:'', description:'' }
const STATUS_BADGE = { Active:'bp-active', Completed:'bp-completed', 'On Hold':'bp-onhold' }

function StudyModal({ show, onClose, onSave, editing }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (show) setForm(editing ? { studyId:editing.studyId, studyName:editing.studyName, phase:editing.phase, status:editing.status, startDate:editing.startDate?.slice(0,10)||'', endDate:editing.endDate?.slice(0,10)||'', sponsor:editing.sponsor||'', description:editing.description||'' } : EMPTY)
    setErrors({})
  }, [show, editing])
  const f = (k, v) => setForm(p => ({...p, [k]:v}))
  const validate = () => { const e = {}; if (!form.studyId.trim()) e.studyId='Required'; if (!form.studyName.trim()) e.studyName='Required'; if (!form.phase) e.phase='Required'; if (!form.startDate) e.startDate='Required'; if (form.endDate && form.endDate < form.startDate) e.endDate='Must be after start date'; return e }
  const handleSubmit = async (ev) => { ev.preventDefault(); const ve=validate(); if (Object.keys(ve).length) { setErrors(ve); return }; setBusy(true); try { await onSave(form); onClose() } catch (err) { setErrors({ api: err.response?.data?.message||'Save failed' }) } finally { setBusy(false) } }
  if (!show) return null
  return (
    <div className="modal-overlay" id="studyModal" data-test="study-modal">
      <div className="modal-box">
        <div className="modal-head"><h5><i className="bi bi-journal-medical"></i> {editing ? 'Edit Study' : 'Create New Study'}</h5><button className="modal-close" onClick={onClose}><i className="bi bi-x"></i></button></div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {errors.api && <div className="ctms-alert alert-danger" style={{marginBottom:12}}>{errors.api}</div>}
            <div className="row g-3">
              <div className="col-md-4"><div className="form-group"><label className="form-label">Study ID <span className="req">*</span></label><input id="studyIdInput" name="studyIdInput" data-test="study-id-input" className={`form-ctrl ${errors.studyId?'error':''}`} value={form.studyId} onChange={e=>f('studyId',e.target.value)} disabled={!!editing} />{errors.studyId && <p className="form-error">{errors.studyId}</p>}</div></div>
              <div className="col-md-8"><div className="form-group"><label className="form-label">Study Name <span className="req">*</span></label><input id="studyNameInput" name="studyNameInput" data-test="study-name-input" className={`form-ctrl ${errors.studyName?'error':''}`} value={form.studyName} onChange={e=>f('studyName',e.target.value)} />{errors.studyName && <p className="form-error">{errors.studyName}</p>}</div></div>
              <div className="col-md-4"><div className="form-group"><label className="form-label">Phase <span className="req">*</span></label><select id="phaseSelect" name="phaseSelect" data-test="phase-select" className={`form-sel ${errors.phase?'error':''}`} value={form.phase} onChange={e=>f('phase',e.target.value)}><option value="">-- Select --</option><option>Phase I</option><option>Phase II</option><option>Phase III</option><option>Phase IV</option></select>{errors.phase && <p className="form-error">{errors.phase}</p>}</div></div>
              <div className="col-md-4"><div className="form-group"><label className="form-label">Status</label><select id="studyStatusSelect" name="studyStatusSelect" data-test="study-status-select" className="form-sel" value={form.status} onChange={e=>f('status',e.target.value)}><option>Active</option><option>Completed</option><option>On Hold</option></select></div></div>
              <div className="col-md-4"><div className="form-group"><label className="form-label">Sponsor</label><input id="sponsorInput" className="form-ctrl" value={form.sponsor} onChange={e=>f('sponsor',e.target.value)} /></div></div>
              <div className="col-md-6"><div className="form-group"><label className="form-label">Start Date <span className="req">*</span></label><input type="date" id="startDateInput" name="startDateInput" data-test="start-date-input" className={`form-ctrl ${errors.startDate?'error':''}`} value={form.startDate} onChange={e=>f('startDate',e.target.value)} />{errors.startDate && <p className="form-error">{errors.startDate}</p>}</div></div>
              <div className="col-md-6"><div className="form-group"><label className="form-label">End Date</label><input type="date" id="endDateInput" name="endDateInput" data-test="end-date-input" className={`form-ctrl ${errors.endDate?'error':''}`} value={form.endDate} onChange={e=>f('endDate',e.target.value)} />{errors.endDate && <p className="form-error">{errors.endDate}</p>}</div></div>
              <div className="col-12"><div className="form-group"><label className="form-label">Description</label><textarea id="descriptionInput" name="descriptionInput" className="form-ctrl" value={form.description} onChange={e=>f('description',e.target.value)} /></div></div>
            </div>
          </div>
          <div className="modal-foot"><button type="button" className="btn-ctms btn-outline" id="cancelStudyBtn" onClick={onClose}>Cancel</button><button type="submit" className="btn-ctms btn-primary" id="saveStudyBtn" name="saveStudyBtn" data-test="save-study-btn" disabled={busy}>{busy ? <><span className="spin"></span> Saving…</> : <><i className="bi bi-check-circle"></i> Save Study</>}</button></div>
        </form>
      </div>
    </div>
  )
}

export default function Studies() {
  const [studies, setStudies] = useState([])
  const [pag, setPag] = useState({ total:0, pages:1, currentPage:1 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTgt, setDeleteTgt] = useState(null)
  const showAlert = (type, message) => { setAlert({type,message}); setTimeout(()=>setAlert(null),4000) }
  const load = useCallback(async (page=1) => {
    setLoading(true)
    try { const r = await studiesAPI.getAll({ page, limit:5, search }); setStudies(r.data.studies); setPag({ total:r.data.total, pages:r.data.pages, currentPage:r.data.currentPage }) }
    catch { showAlert('danger','Failed to load studies') }
    finally { setLoading(false) }
  }, [search])
  useEffect(() => { load(1) }, [load])
  const handleSave = async (form) => {
    if (editing) {
      await studiesAPI.update(editing._id, form)
      showAlert('success', 'Study updated')
    } else {
      await studiesAPI.create(form)
      showAlert('success', 'Study created')
    }
    await load(pag.currentPage)
  }
  const handleDelete = async () => { await studiesAPI.delete(deleteTgt._id); showAlert('success','Study deleted'); setDeleteTgt(null); load(1) }
  return (
    <div data-test="studies-page">
      <Alert alert={alert} onClose={()=>setAlert(null)} />
      <div className="page-header">
        <div className="page-header-left"><h4><i className="bi bi-journal-medical" style={{color:'var(--c-teal)',marginRight:8}}></i>Studies</h4><p>Manage clinical trial studies</p></div>
        <button className="btn-ctms btn-primary" id="createStudyBtn" name="createStudyBtn" data-test="create-study-btn" onClick={()=>{setEditing(null);setShowModal(true)}}><i className="bi bi-plus-circle"></i> New Study</button>
      </div>
      <div className="data-card">
        <div className="table-toolbar">
          <div className="search-box"><span className="search-icon"><i className="bi bi-search"></i></span><input className="search-input" id="studySearch" name="studySearch" data-test="study-search" placeholder="Search ID or Name…" value={search} onChange={e=>setSearch(e.target.value)} /></div>
          <span style={{marginLeft:'auto',fontSize:'.78rem',color:'var(--c-muted)'}}>{pag.total} studies</span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table className="ctms-table" id="studiesTable" data-test="studies-table">
            <thead><tr><th>#</th><th>Study ID</th><th>Study Name</th><th>Phase</th><th>Sponsor</th><th>Status</th><th>Start Date</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <LoadingRow cols={8} /> : studies.length === 0 ? <EmptyRow cols={8} icon="bi-journal" message="No studies found. Create one!" /> : studies.map((s,i) => (
                <tr key={s._id} id={`study-row-${s._id}`} data-test={`study-row-${s._id}`}>
                  <td style={{color:'var(--c-muted)',fontSize:'.75rem'}}>{(pag.currentPage-1)*5+i+1}</td>
                  <td><span className="mono-id">{s.studyId}</span></td>
                  <td style={{fontWeight:600}}>{s.studyName}</td>
                  <td><span style={{fontSize:'.75rem',color:'var(--c-muted)'}}>{s.phase}</span></td>
                  <td>{s.sponsor||<span style={{color:'var(--c-muted)'}}>—</span>}</td>
                  <td><span className={`badge-pill ${STATUS_BADGE[s.status]||''}`}>{s.status}</span></td>
                  <td style={{fontSize:'.8rem'}}>{new Date(s.startDate).toLocaleDateString()}</td>
                  <td><button className="btn-edit me-1" id={`editStudy-${s._id}`} data-test={`edit-study-${s._id}`} onClick={()=>{setEditing(s);setShowModal(true)}}><i className="bi bi-pencil"></i></button><button className="btn-del" id={`deleteStudy-${s._id}`} data-test={`delete-study-${s._id}`} onClick={()=>setDeleteTgt(s)}><i className="bi bi-trash3"></i></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pag} onPage={load} />
      </div>
      <StudyModal show={showModal} onClose={()=>setShowModal(false)} onSave={handleSave} editing={editing} />
      <DeleteModal show={!!deleteTgt} onClose={()=>setDeleteTgt(null)} onConfirm={handleDelete} title={`Delete "${deleteTgt?.studyName}"?`} message="This will permanently remove the study." testId="delete-study-modal" />
    </div>
  )
}
