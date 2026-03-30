import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { login, register } = useAuth()
  const [mode, setMode]     = useState('login')   // 'login' | 'register'
  const [role, setRole]     = useState('client')
  const [form, setForm]     = useState({ name:'', email:'', password:'', phone:'' })
  const [error, setError]   = useState('')
  const [busy, setBusy]     = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({ ...form, role })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="landing-bg">
      <div className="landing-glow" />

      {/* Left — Branding */}
      <div className="landing-left">
        <p className="tagline">✂ Premium Barber Shop</p>
        <h1>
          Your Best Cut<br />
          <span className="gold-text">Starts Here.</span>
        </h1>
        <p>
          Book appointments with top barbers, track your history,
          and experience a seamless grooming journey — all in one place.
        </p>

        <div style={{ display:'flex', gap:'2rem', marginTop:'2.5rem' }}>
          {[
            { icon:'✂', label:'Expert Barbers' },
            { icon:'📅', label:'Easy Booking' },
            { icon:'⭐', label:'Verified Reviews' },
          ].map(f => (
            <div key={f.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.6rem', marginBottom:'0.3rem' }}>{f.icon}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--muted)', fontWeight:500 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Auth Card */}
      <div className="landing-right">
        <div className="auth-card">
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="subtitle">
            {mode === 'login'
              ? 'Sign in to manage your appointments.'
              : 'Join us and book your first appointment.'}
          </p>

          {/* Login / Register tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab${mode==='login'?' active':''}`} onClick={() => { setMode('login'); setError('') }}>Sign In</button>
            <button className={`auth-tab${mode==='register'?' active':''}`} onClick={() => { setMode('register'); setError('') }}>Register</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                {/* Role selector */}
                <div className="form-group">
                  <label>I am a</label>
                  <div className="role-selector">
                    <button type="button" className={`role-btn${role==='client'?' active':''}`} onClick={() => setRole('client')}>
                      👤 Client
                    </button>
                    <button type="button" className={`role-btn${role==='barber'?' active':''}`} onClick={() => setRole('barber')}>
                      ✂ Barber
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    placeholder="John Doe"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    placeholder="555-0123"
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={busy}
              style={{ marginTop:'0.5rem' }}
            >
              {busy ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="divider" />
          <div className="switch-mode">
            {mode === 'login'
              ? <>Don't have an account? <button onClick={() => { setMode('register'); setError('') }}>Register</button></>
              : <>Already have an account? <button onClick={() => { setMode('login'); setError('') }}>Sign In</button></>
            }
          </div>

          {mode === 'login' && (
            <div style={{ marginTop:'1rem', padding:'0.8rem', background:'var(--surface2)', borderRadius:'var(--radius-sm)', fontSize:'0.78rem', color:'var(--muted)' }}>
              <strong style={{color:'var(--gold)'}}>Demo accounts:</strong><br/>
              Client: alice@email.com / demo1234<br/>
              Barber: james@barbershop.com / demo1234
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
