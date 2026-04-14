import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const DEMO_ACCOUNTS = [
  { role:'admin',       email:'admin@ctms.com',   pass:'Admin@123',  color:'#dc2626', bg:'#fef2f2', icon:'bi-shield-fill',          label:'Administrator',    access:'Full access to all modules' },
  { role:'doctor',      email:'doctor@ctms.com',  pass:'Doctor@123', color:'#2563eb', bg:'#eff6ff', icon:'bi-person-badge-fill',     label:'Dr. Sarah Carter', access:'Patients, Appointments, Reports' },
  { role:'nurse',       email:'nurse@ctms.com',   pass:'Nurse@123',  color:'#16a34a', bg:'#f0fdf4', icon:'bi-heart-pulse-fill',      label:'Nurse',            access:'Patients, Subjects, Appointments' },
  { role:'coordinator', email:'coord@ctms.com',   pass:'Coord@123',  color:'#7c3aed', bg:'#faf5ff', icon:'bi-clipboard2-check-fill', label:'Coordinator',      access:'All modules except User Mgmt' },
]

export default function Login() {
  const [form,    setForm]    = useState({ email:'', password:'' })
  const [errors,  setErrors]  = useState({})
  const [apiErr,  setApiErr]  = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.email)                            e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = 'Invalid email format'
    if (!form.password)                         e.password = 'Password is required'
    return e
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const ve = validate()
    if (Object.keys(ve).length) { setErrors(ve); return }
    setErrors({})
    setApiErr('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setApiErr(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.pass })
    setErrors({})
    setApiErr('')
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#0a1f3d', position:'relative', overflow:'hidden' }}>

      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(37,99,235,.3) 0%, transparent 60%), radial-gradient(ellipse 50% 80% at 80% 20%, rgba(6,182,212,.18) 0%, transparent 50%)' }} />
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize:'40px 40px' }} />

      {/* LEFT */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40, position:'relative', zIndex:1 }} className="d-none d-lg-flex">
        <div style={{ maxWidth:480 }}>
          <h1 style={{ color:'#fff', fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:'2.8rem', lineHeight:1.1, marginBottom:16 }}>
            Manage Trials.<br />
            <span style={{ color:'#06b6d4' }}>Save Lives.</span>
          </h1>
          <p style={{ color:'rgba(255,255,255,.55)', fontSize:'1rem', lineHeight:1.7, marginBottom:36 }}>
            A unified platform for clinical trial management from patient recruitment to final reporting.
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              ['bi-journal-medical',  'Multi-phase study management'],
              ['bi-heart-pulse-fill', 'Complete patient and subject tracking'],
              ['bi-calendar2-check',  'Smart appointment scheduling'],
              ['bi-people-fill',      'Role-based access control'],
              ['bi-bar-chart-line',   'Real-time analytics and reports'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:12, color:'rgba(255,255,255,.72)', fontSize:'.88rem' }}>
                <div style={{ width:30, height:30, borderRadius:8, background:'rgba(6,182,212,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#06b6d4', flexShrink:0 }}>
                  <i className={`bi ${icon}`} style={{ fontSize:'.85rem' }} />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={{ width:500, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 44px', position:'relative', zIndex:1, boxShadow:'-20px 0 60px rgba(0,0,0,.3)', overflowY:'auto' }}>
        <div style={{ width:'100%' }}>

          <div style={{ marginBottom:28 }}>
            <h3 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, color:'#0f2d5c', fontSize:'1.55rem', margin:'0 0 6px' }}>Welcome back</h3>
            <p style={{ color:'#64748b', fontSize:'.85rem', margin:0 }}>Sign in to your CTMS account to continue</p>
          </div>

          {/* ERROR — no timer, no auto-dismiss, stays permanently */}
          {apiErr && (
            <div
              id="loginError"
              name="loginError"
              data-test="login-error"
              style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', borderRadius:8, marginBottom:18, fontSize:'.84rem', background:'#fee2e2', color:'#991b1b', border:'1px solid #fecaca', lineHeight:1.5 }}
            >
              <i className="bi bi-exclamation-circle-fill" style={{ fontSize:'1rem', flexShrink:0, marginTop:1 }} />
              <span id="loginErrorMsg" data-test="login-error-msg" style={{ flex:1 }}>
                {apiErr}
              </span>
              <button
                id="loginErrorCloseBtn"
                data-test="login-error-close"
                onClick={() => setApiErr('')}
                style={{ background:'none', border:'none', color:'#991b1b', cursor:'pointer', fontSize:'1.1rem', lineHeight:1, padding:0, flexShrink:0 }}
              >
                <i className="bi bi-x" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate data-test="login-form">
            <div style={{ marginBottom:16 }}>
              <label className="form-label" htmlFor="email" style={{ fontSize:'.82rem', fontWeight:600, color:'#475569' }}>Email Address</label>
              <div style={{ position:'relative' }}>
                <i className="bi bi-envelope" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'.9rem', pointerEvents:'none' }} />
                <input type="email" id="email" name="email" data-test="email-input"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  style={{ paddingLeft:38, height:44 }}
                  placeholder="admin@ctms.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoComplete="email" />
              </div>
              {errors.email
                ? <div className="invalid-feedback" id="emailError" data-test="email-error" style={{display:'block'}}>{errors.email}</div>
                : <div className="invalid-feedback" id="emailError" data-test="email-error" style={{display:'none'}}></div>
              }
            </div>

            <div style={{ marginBottom:22 }}>
              <label className="form-label" htmlFor="password" style={{ fontSize:'.82rem', fontWeight:600, color:'#475569' }}>Password</label>
              <div style={{ position:'relative' }}>
                <i className="bi bi-lock" style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:'.9rem', pointerEvents:'none' }} />
                <input type="password" id="password" name="password" data-test="password-input"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  style={{ paddingLeft:38, height:44 }}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password" />
              </div>
              {errors.password
                ? <div className="invalid-feedback" id="passwordError" data-test="password-error" style={{display:'block'}}>{errors.password}</div>
                : <div className="invalid-feedback" id="passwordError" data-test="password-error" style={{display:'none'}}></div>
              }
            </div>

            <button type="submit" id="loginBtn" name="loginBtn" data-test="login-btn" disabled={loading}
              style={{ width:'100%', height:46, background:'linear-gradient(135deg,#0f2d5c,#2563eb)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:'.9rem', display:'flex', alignItems:'center', justifyContent:'center', gap:9, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .8 : 1, transition:'all .25s', boxShadow:'0 4px 14px rgba(37,99,235,.35)' }}>
              {loading
                ? <><span className="spinner-border spinner-border-sm" />Signing in...</>
                : <><i className="bi bi-box-arrow-in-right" />Sign In to CTMS</>}
            </button>
          </form>

          <div style={{ marginTop:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ flex:1, height:1, background:'#f1f5f9' }} />
              <span style={{ fontSize:'.72rem', color:'#94a3b8', fontWeight:600, whiteSpace:'nowrap' }}>Demo Accounts - Click to fill</span>
              <div style={{ flex:1, height:1, background:'#f1f5f9' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {DEMO_ACCOUNTS.map(a => (
                <button key={a.role} type="button"
                  id={`demo-${a.role}`} data-test={`demo-${a.role}`}
                  onClick={() => fillDemo(a)}
                  style={{ padding:'9px 10px', border:`1.5px solid ${a.bg==='#fef2f2'?'#fecaca':a.bg==='#eff6ff'?'#bfdbfe':a.bg==='#f0fdf4'?'#bbf7d0':'#ddd6fe'}`, borderRadius:9, background:a.bg, cursor:'pointer', textAlign:'left', transition:'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 4px 12px ${a.color}22` }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <i className={`bi ${a.icon}`} style={{ color:a.color, fontSize:'.82rem' }} />
                    <span style={{ fontWeight:700, fontSize:'.75rem', color:a.color }}>{a.label}</span>
                  </div>
                  <div style={{ fontSize:'.68rem', color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.email}</div>
                  <div style={{ fontSize:'.65rem', color:'#94a3b8', marginTop:2 }}>{a.access}</div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
