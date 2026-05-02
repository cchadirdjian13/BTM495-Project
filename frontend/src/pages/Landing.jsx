import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Scissors, Calendar, Star, User, Eye, EyeOff } from 'lucide-react'


export default function Landing() {
  const { login, register } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()

  const [mode, setMode]     = useState('login')   // 'login' | 'register'
  const [role, setRole]     = useState('client')
  const [form, setForm]     = useState({ name:'', email:'', password:'', phone:'' })
  const [error, setError]   = useState('')
  const [busy, setBusy]     = useState(false)
  const [showPass, setShowPass] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register({ ...form, role, language })
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

      {/* Language Toggle */}
      <div style={{ position: 'fixed', top: '1.5rem', right: '2rem', zIndex: 100 }}>
        <button 
          onClick={toggleLanguage} 
          className="btn btn-ghost btn-sm" 
          style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)', background: 'var(--surface1)', border: '1px solid var(--border)' }}
        >
          {language === 'en' ? 'FR' : 'EN'}
        </button>
      </div>

      {/* Left — Branding */}
      <div className="landing-left">
        <p className="tagline"><Scissors size={13} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '0.35em' }} />{t('shop_name')}</p>
        <h1>
          {t('tagline_start')}<br />
          <span className="gold-text">{t('tagline_end')}</span>
        </h1>
        <p>
          {t('hero_description')}
        </p>

        <div style={{ display:'flex', gap:'2rem', marginTop:'2.5rem' }}>
          {[
            { icon: <Scissors size={24} aria-hidden="true" />, label: t('expert_barbers') },
            { icon: <Calendar size={24} aria-hidden="true" />, label: t('easy_booking') },
            { icon: <Star size={24} aria-hidden="true" />,    label: t('verified_reviews') },
          ].map(f => (
            <div key={f.label} style={{ textAlign:'center' }}>
              <div style={{ color:'var(--gold)', marginBottom:'0.3rem', display:'flex', justifyContent:'center' }}>{f.icon}</div>
              <div className="muted" style={{ fontWeight:500 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Auth Card */}
      <div className="landing-right">
        <div className="auth-card">
          <h2>{mode === 'login' ? t('welcome_back') : t('create_account')}</h2>
          <p className="subtitle">
            {mode === 'login'
              ? t('sign_in_subtitle')
              : t('register_subtitle')}
          </p>

          {/* Login / Register tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab${mode==='login'?' active':''}`} onClick={() => { setMode('login'); setError(''); setShowPass(false) }}>{t('sign_in')}</button>
            <button className={`auth-tab${mode==='register'?' active':''}`} onClick={() => { setMode('register'); setError(''); setShowPass(false) }}>{t('register')}</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                {/* Role selector */}
                <div className="form-group">
                  <label>{t('i_am_a')}</label>
                  <div className="role-selector">
                    <button type="button" className={`role-btn${role==='client'?' active':''}`} onClick={() => setRole('client')}>
                      <User size={15} aria-hidden="true" /> {t('role_client')}
                    </button>
                    <button type="button" className={`role-btn${role==='barber'?' active':''}`} onClick={() => setRole('barber')}>
                      <Scissors size={15} aria-hidden="true" /> {t('role_barber')}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('full_name')}</label>
                  <input
                    placeholder="John Doe"
                    autoComplete="name"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('phone')}</label>
                  <input
                    type="tel"
                    placeholder="555-0123"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={e => update('phone', e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>{t('email')}</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password-input">{t('password')}</label>
              <div className="input-wrapper">
                <input
                  id="password-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass
                    ? <EyeOff size={16} aria-hidden="true" />
                    : <Eye    size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={busy}
              style={{ marginTop:'0.5rem' }}
            >
              {busy ? (language === 'fr' ? 'S’il vous plaît, attendez…' : 'Please wait…') : (mode === 'login' ? t('sign_in_button') : t('create_account_button'))}
            </button>
          </form>

          <div className="divider" />
          <div className="switch-mode">
            {mode === 'login'
              ? <>{t('no_account')} <button onClick={() => { setMode('register'); setError(''); setShowPass(false) }}>{t('register')}</button></>
              : <>{t('has_account')} <button onClick={() => { setMode('login'); setError(''); setShowPass(false) }}>{t('sign_in')}</button></>
            }
          </div>

          {mode === 'login' && (
            <div style={{ marginTop:'1rem', padding:'0.8rem', background:'var(--surface2)', borderRadius:'var(--radius-sm)', fontSize:'0.78rem', color:'var(--muted)' }}>
              <strong style={{color:'var(--gold)'}}>{t('demo_accounts')}:</strong><br/>
              Client: alice@email.com / demo1234<br/>
              Stylist: james@salondimension.com / demo1234
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
