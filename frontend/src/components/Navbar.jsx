import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()

  if (!user) return null

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 2.5rem', borderBottom: '1px solid var(--border)',
      background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.5rem' }}>✂</span> {t('shop_name')}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button 
          onClick={toggleLanguage} 
          className="btn btn-ghost btn-sm" 
          style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '45px', color: 'var(--gold)' }}
        >
          {language === 'en' ? 'FR' : 'EN'}
        </button>
        <NotificationBell />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--border)', paddingLeft: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            {user.role === 'barber' && user.user_id <= 3 ? (
              <img src={`/images/avatar_${user.user_id}.png`} alt={user.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold)' }} />
            ) : (
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--gold)', border: '1px solid var(--border)' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>{user.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ marginLeft: '1rem' }}>{t('sign_out')}</button>
        </div>
      </div>
    </nav>
  )
}
