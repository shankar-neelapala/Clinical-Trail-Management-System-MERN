import React, { useState, useEffect } from 'react'
import { reportsAPI, studiesAPI } from '../../api/index.js'
const SB = { Active:'bp-active', Completed:'bp-completed', 'On Hold':'bp-onhold' }
function RC({ id, val, label, color }) {
  return <div style={{background:'#fff',border:'1px solid var(--c-border)',borderRadius:12,padding:'18px 16px',textAlign:'center'}} id={id} data-test={id}><div style={{fontSize:'2rem',fontWeight:700,color:color||'var(--c-navy)',lineHeight:1}}>{val}</div><div style={{fontSize:'.76rem',color:'var(--c-muted)',marginTop:4,fontWeight:500}}>{label}</div></div>
}
export default function Reports() {
  const [summary, setSummary] = useState(null); const [studies, setStudies] = useState([]); const [sel, setSel] = useState(''); const [loading, setLoading] = useState(false)
  useEffect(() => { studiesAPI.getAllNoPag().then(r=>setStudies(r.data)).catch(()=>{}); fetchReport() }, [])
  const fetchReport = async (id='') => { setLoading(true); try { const r=await reportsAPI.getSummary(id?{studyId:id}:{}); setSummary(r.data) } catch(e){console.error(e)} finally{setLoading(false)} }
  return (
    <div data-test="reports-page">
      <div className="page-header"><div className="page-header-left"><h4><i className="bi bi-bar-chart-line-fill" style={{color:'var(--c-teal)',marginRight:8}}></i>Reports & Analytics</h4><p>Aggregated metrics across studies, subjects and patients</p></div></div>
      <div className="data-card" style={{marginBottom:20}} id="reportFilter" data-test="report-filter">
        <div className="data-card-header"><span className="data-card-title"><i className="bi bi-funnel-fill"></i> Filter</span></div>
        <div className="data-card-body"><div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div style={{flex:1,minWidth:220}}><label style={{display:'block',fontSize:'.8rem',fontWeight:600,marginBottom:5}}>Filter by Study</label><select className="form-sel" id="reportStudyFilter" name="reportStudyFilter" data-test="report-study-filter" value={sel} onChange={e=>setSel(e.target.value)}><option value="">— All Studies —</option>{studies.map(s=><option key={s._id} value={s._id}>{s.studyName} ({s.studyId})</option>)}</select></div>
          <button className="btn-ctms btn-teal" id="generateReportBtn" name="generateReportBtn" data-test="generate-report-btn" onClick={()=>fetchReport(sel)}><i className="bi bi-play-circle-fill"></i> Generate</button>
          <button className="btn-ctms btn-outline" id="clearReportBtn" name="clearReportBtn" data-test="clear-report-btn" onClick={()=>{setSel('');fetchReport()}}><i className="bi bi-x-circle"></i> Reset</button>
        </div></div>
      </div>
      {loading ? <div style={{display:'flex',justifyContent:'center',padding:40}}><div className="spin spin-dark" style={{width:28,height:28,borderWidth:2}}></div></div>
      : summary && <>
        <div className="row g-3 mb-4" id="reportSummaryCards" data-test="report-summary-cards">
          <div className="col-6 col-md-3"><RC id="rptTotalStudies"   val={summary.totalStudies}   label="Total Studies"   color="var(--c-navy)"/></div>
          <div className="col-6 col-md-3"><RC id="rptActiveStudies"  val={summary.activeStudies}  label="Active Studies"  color="var(--c-teal)"/></div>
          <div className="col-6 col-md-3"><RC id="rptTotalSubjects"  val={summary.totalSubjects}  label="Total Subjects"  color="#7c3aed"/></div>
          <div className="col-6 col-md-3"><RC id="rptActiveSubjects" val={summary.activeSubjects} label="Active Subjects" color="#16a34a"/></div>
          <div className="col-6 col-md-3"><RC id="rptTotalPatients"  val={summary.totalPatients}  label="Total Patients"  color="#0369a1"/></div>
          <div className="col-6 col-md-3"><RC id="rptActivePatients" val={summary.activePatients} label="Active Patients" color="#16a34a"/></div>
          <div className="col-6 col-md-3"><RC id="rptTotalSites"     val={summary.totalSites}     label="Total Sites"    color="#b45309"/></div>
          <div className="col-6 col-md-3"><RC id="rptActiveSites"    val={summary.activeSites}    label="Active Sites"   color="#16a34a"/></div>
        </div>
        <div className="data-card">
          <div className="data-card-header"><span className="data-card-title"><i className="bi bi-table"></i> Study Breakdown</span></div>
          <div style={{overflowX:'auto'}}>
            <table className="ctms-table" id="reportBreakdownTable" data-test="report-breakdown-table">
              <thead><tr><th>Study ID</th><th>Study Name</th><th>Phase</th><th>Status</th><th>Subjects</th><th>Patients</th></tr></thead>
              <tbody>{summary.studyBreakdown.length===0?<tr><td colSpan="6" style={{textAlign:'center',padding:24,color:'var(--c-muted)'}}>No data</td></tr>:summary.studyBreakdown.map(s=>(
                <tr key={s._id} data-test={`report-row-${s._id}`}>
                  <td><span className="mono-id">{s.studyId}</span></td>
                  <td style={{fontWeight:600}}>{s.studyName}</td>
                  <td style={{fontSize:'.78rem',color:'var(--c-muted)'}}>{s.phase}</td>
                  <td><span className={`badge-pill ${SB[s.status]||''}`}>{s.status}</span></td>
                  <td><strong>{s.totalSubjects}</strong> <span style={{fontSize:'.72rem',color:'var(--c-muted)'}}>({s.activeSubjects} active)</span></td>
                  <td><strong>{s.totalPatients}</strong> <span style={{fontSize:'.72rem',color:'var(--c-muted)'}}>({s.activePatients} active)</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </>}
    </div>
  )
}
