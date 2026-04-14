import React, { useState, useEffect, useCallback } from 'react'
import { sitesAPI } from '../../api/index.js'
import { DeleteModal, Pagination, Alert, LoadingRow, EmptyRow } from '../Layout/Shared.jsx'

const EMPTY = { siteName:'', principalInvestigator:'', location:'', status:'Active', contactEmail:'', phone:'', capacity:'' }
const SB = { Active:'bp-active', Inactive:'bp-inactive', Pending:'bp-pending' }

function SiteModal({ show, onClose, onSave, editing }) {
  const [form, setForm] = useState(EMPTY); const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false)
  useEffect(() => { if (show) setForm(editing ? { siteName:editing.siteName, principalInvestigator:editing.principalInvestigator, location:editing.location, status:editing.status, contactEmail:editing.contactEmail||'', phone:editing.phone||'', capacity:editing.capacity||'' } : EMPTY); setErrors({}) }, [show, editing])
  const f = (k,v) => setForm(p=>({...p,[k]:v}))
  const validate = () => { const e={}; if (!form.siteName.trim()) e.siteName='Required'; if (!form.principalInvestigator.trim()) e.pi='Required'; if (!form.location.trim()) e.location='Required'; if (form.contactEmail && !/\S+@\S+\.\S+/.test(form.contactEmail)) e.email='Invalid email'; return e }
  const handleSubmit = async ev => { ev.preventDefault(); const ve=validate(); if (Object.keys(ve).length) {setErrors(ve);return}; setBusy(true); try { await onSave(form); onClose() } catch(err) { setErrors({api:err.response?.data?.message||'Save failed'}) } finally { setBusy(false) } }
  if (!show) return null
  return (
    <div className="modal-overlay" id="siteModal" data-test="site-modal">
      <div className="modal-box">
        <div className="modal-head"><h5><i className="bi bi-hospital"></i> {editing?'Edit Site':'New Site'}</h5><button className="modal-close" onClick={onClose}><i className="bi bi-x"></i></button></div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {errors.api && <div className="ctms-alert alert-danger" style={{marginBottom:12}}>{errors.api}</div>}
            <div className="row g-3">
              <div className="col-md-6"><div className="form-group"><label className="form-label">Site Name <span className="req">*</span></label><input id="siteNameInput" name="siteNameInput" data-test="site-name-input" className={`form-ctrl ${errors.siteName?'error':''}`} value={form.siteName} onChange={e=>f('siteName',e.target.value)} />{errors.siteName&&<p className="form-error">{errors.siteName}</p>}</div></div>
              <div className="col-md-6"><div className="form-group"><label className="form-label">Principal Investigator <span className="req">*</span></label><input id="piInput" name="piInput" data-test="pi-input" className={`form-ctrl ${errors.pi?'error':''}`} value={form.principalInvestigator} onChange={e=>f('principalInvestigator',e.target.value)} />{errors.pi&&<p className="form-error">{errors.pi}</p>}</div></div>
              <div className="col-md-6"><div className="form-group"><label className="form-label">Location <span className="req">*</span></label><input id="locationInput" name="locationInput" data-test="location-input" className={`form-ctrl ${errors.location?'error':''}`} value={form.location} onChange={e=>f('location',e.target.value)} />{errors.location&&<p className="form-error">{errors.location}</p>}</div></div>
              <div className="col-md-3"><div className="form-group"><label className="form-label">Status</label><select id="siteStatusSelect" name="siteStatusSelect" data-test="site-status-select" className="form-sel" value={form.status} onChange={e=>f('status',e.target.value)}><option>Active</option><option>Inactive</option><option>Pending</option></select></div></div>
              <div className="col-md-3"><div className="form-group"><label className="form-label">Capacity</label><input type="number" id="capacityInput" className="form-ctrl" value={form.capacity} onChange={e=>f('capacity',e.target.value)} /></div></div>
              <div className="col-md-6"><div className="form-group"><label className="form-label">Contact Email</label><input type="email" id="contactEmailInput" name="contactEmailInput" data-test="contact-email-input" className={`form-ctrl ${errors.email?'error':''}`} value={form.contactEmail} onChange={e=>f('contactEmail',e.target.value)} />{errors.email&&<p className="form-error">{errors.email}</p>}</div></div>
              <div className="col-md-6"><div className="form-group"><label className="form-label">Phone</label><input type="text" id="phoneInput" name="phoneInput" data-test="phone-input" className="form-ctrl" value={form.phone} onChange={e=>f('phone',e.target.value)} /></div></div>
            </div>
          </div>
          <div className="modal-foot"><button type="button" className="btn-ctms btn-outline" onClick={onClose}>Cancel</button><button type="submit" className="btn-ctms btn-primary" id="saveSiteBtn" name="saveSiteBtn" data-test="save-site-btn" disabled={busy}>{busy?<><span className="spin"></span> Saving…</>:<><i className="bi bi-check-circle"></i> Save</>}</button></div>
        </form>
      </div>
    </div>
  )
}

export default function Sites() {
  const [sites, setSites] = useState([]); const [pag, setPag] = useState({total:0,pages:1,currentPage:1}); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [alert, setAlert] = useState(null); const [showModal, setShowModal] = useState(false); const [editing, setEditing] = useState(null); const [deleteTgt, setDeleteTgt] = useState(null)
  const showAlert = (type,message) => { setAlert({type,message}); setTimeout(()=>setAlert(null),4000) }
  const load = useCallback(async (page=1) => { setLoading(true); try { const r=await sitesAPI.getAll({page,limit:5,search}); setSites(r.data.sites); setPag({total:r.data.total,pages:r.data.pages,currentPage:r.data.currentPage}) } catch { showAlert('danger','Failed to load') } finally { setLoading(false) } }, [search])
  useEffect(() => { load(1) }, [load])
  const handleSave = async form => { if (editing) { await sitesAPI.update(editing._id,form); showAlert('success','Site updated') } else { await sitesAPI.create(form); showAlert('success','Site created') }; load(pag.currentPage) }
  const handleDelete = async () => { await sitesAPI.delete(deleteTgt._id); showAlert('success','Deleted'); setDeleteTgt(null); load(1) }
  return (
    <div data-test="sites-page">
      <Alert alert={alert} onClose={()=>setAlert(null)} />
      <div className="page-header"><div className="page-header-left"><h4><i className="bi bi-hospital" style={{color:'var(--c-teal)',marginRight:8}}></i>Sites</h4><p>Research and trial sites</p></div><button className="btn-ctms btn-primary" id="createSiteBtn" name="createSiteBtn" data-test="create-site-btn" onClick={()=>{setEditing(null);setShowModal(true)}}><i className="bi bi-plus-circle"></i> New Site</button></div>
      <div className="data-card">
        <div className="table-toolbar"><div className="search-box"><span className="search-icon"><i className="bi bi-search"></i></span><input className="search-input" id="siteSearch" name="siteSearch" data-test="site-search" placeholder="Search name or location…" value={search} onChange={e=>setSearch(e.target.value)} /></div><span style={{marginLeft:'auto',fontSize:'.78rem',color:'var(--c-muted)'}}>{pag.total} sites</span></div>
        <div style={{overflowX:'auto'}}><table className="ctms-table" id="sitesTable" data-test="sites-table">
          <thead><tr><th>#</th><th>Site Name</th><th>Principal Investigator</th><th>Location</th><th>Contact</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{loading?<LoadingRow cols={8}/>:sites.length===0?<EmptyRow cols={8} icon="bi-hospital" message="No sites found"/>:sites.map((s,i)=>(
            <tr key={s._id} id={`site-row-${s._id}`} data-test={`site-row-${s._id}`}>
              <td style={{color:'var(--c-muted)',fontSize:'.75rem'}}>{(pag.currentPage-1)*5+i+1}</td>
              <td style={{fontWeight:600}}>{s.siteName}</td>
              <td>{s.principalInvestigator}</td>
              <td><i className="bi bi-geo-alt" style={{color:'var(--c-teal)',marginRight:4}}></i>{s.location}</td>
              <td style={{fontSize:'.8rem'}}>{s.contactEmail||'—'}</td>
              <td>{s.capacity||'—'}</td>
              <td><span className={`badge-pill ${SB[s.status]||''}`}>{s.status}</span></td>
              <td><button className="btn-edit me-1" id={`editSite-${s._id}`} data-test={`edit-site-${s._id}`} onClick={()=>{setEditing(s);setShowModal(true)}}><i className="bi bi-pencil"></i></button><button className="btn-del" id={`deleteSite-${s._id}`} data-test={`delete-site-${s._id}`} onClick={()=>setDeleteTgt(s)}><i className="bi bi-trash3"></i></button></td>
            </tr>
          ))}</tbody>
        </table></div>
        <Pagination pagination={pag} onPage={load} />
      </div>
      <SiteModal show={showModal} onClose={()=>setShowModal(false)} onSave={handleSave} editing={editing} />
      <DeleteModal show={!!deleteTgt} onClose={()=>setDeleteTgt(null)} onConfirm={handleDelete} title={`Delete site "${deleteTgt?.siteName}"?`} message="This action cannot be undone." testId="delete-site-modal" />
    </div>
  )
}
