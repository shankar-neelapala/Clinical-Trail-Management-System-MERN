import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { reportsAPI, studiesAPI } from '../../api/index.js'
import { useAuth } from '../../context/AuthContext.jsx'

function StatCard({ id, icon, iconCls, val, label, accent, trend }) {
  return (
    <div className="stat-card d-flex flex-column w-100" id={id} data-test={id} style={{'--stat-accent': accent}}>
      <div className={`stat-icon ${iconCls}`}><i className={`bi ${icon}`}></i></div>
      <div>
        <div className="stat-val">{val}</div>
        <div className="stat-label">{label}</div>
        {trend && <div className={`stat-trend ${trend.dir}`}><i className={`bi bi-arrow-${trend.dir}`}></i> {trend.text}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user }    = useAuth()
  const [stats, setStats] = useState({ totalStudies:0, activeStudies:0, activeSubjects:0, totalSites:0, totalPatients:0, activePatients:0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    Promise.all([reportsAPI.getSummary(), studiesAPI.getAll({ page:1, limit:5 })])
      .then(([sr, stR]) => {
        setStats(sr.data)
        setRecent(stR.data.studies)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statusBadge = (s) => {
    const m = { Active:'bp-active', Completed:'bp-completed', 'On Hold':'bp-onhold' }
    return `badge-pill ${m[s]||''}`
  }

  const now = new Date()
  const greet = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',padding:40}}>
      <div className="spin spin-dark" style={{width:32,height:32,borderWidth:3}}></div>
    </div>
  )

  return (
    <div data-test="dashboard-page">
      {/* Welcome Banner */}
      <div className="welcome-banner" id="welcomeBanner">
        <div className="wb-text">
          <h4>{greet}, {user?.name}! 👋</h4>
          <p>Here's what's happening in your clinical trials today.</p>
        </div>
        <div className="wb-icon"><i className="bi bi-activity"></i></div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-2">
          <StatCard id="card-total-studies"   icon="bi-journal-medical"  iconCls="si-navy"   val={stats.totalStudies}   label="Total Studies"    accent="#1a4175" />
        </div>
        <div className="col-6 col-xl-2">
          <StatCard id="card-active-studies"  icon="bi-activity"         iconCls="si-teal"   val={stats.activeStudies}  label="Active Studies"   accent="#0ea5b5" />
        </div>
        <div className="col-6 col-xl-2">
          <StatCard id="card-active-subjects" icon="bi-people-fill"      iconCls="si-green"  val={stats.activeSubjects} label="Active Subjects"  accent="#16a34a" />
        </div>
        <div className="col-6 col-xl-2">
          <StatCard id="card-sites-count"     icon="bi-hospital"         iconCls="si-amber"  val={stats.totalSites}     label="Sites"            accent="#d97706" />
        </div>
        <div className="col-6 col-xl-2">
          <StatCard id="card-total-patients"  icon="bi-person-vcard-fill" iconCls="si-indigo" val={stats.totalPatients}  label="Total Patients"   accent="#4338ca" />
        </div>
        <div className="col-6 col-xl-2">
          <StatCard id="card-active-patients" icon="bi-heart-pulse-fill" iconCls="si-rose"   val={stats.activePatients} label="Active Patients"  accent="#dc2626" />
        </div>
      </div>

      <div className="row g-3">
        {/* Recent Studies */}
        <div className="col-12">
          <div className="data-card">
            <div className="data-card-header">
              <span className="data-card-title"><i className="bi bi-journal-text"></i> Recent Studies</span>
              <Link to="/studies" className="btn-ctms btn-outline btn-sm">View All →</Link>
            </div>
            <div style={{overflowX:'auto'}}>
              <table className="ctms-table" id="recentStudiesTable" data-test="recent-studies-table">
                <thead>
                  <tr>
                    <th>Study ID</th>
                    <th>Name</th>
                    <th>Phase</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0
                    ? <tr><td colSpan="4"><div className="empty-state"><i className="bi bi-journal"></i>No studies yet</div></td></tr>
                    : recent.map(s => (
                      <tr key={s._id} data-test={`study-row-${s._id}`}>
                        <td><span className="mono-id">{s.studyId}</span></td>
                        <td style={{fontWeight:500}}>{s.studyName}</td>
                        <td><span style={{fontSize:'.75rem',color:'var(--c-muted)'}}>{s.phase}</span></td>
                        <td><span className={statusBadge(s.status)}>{s.status}</span></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
