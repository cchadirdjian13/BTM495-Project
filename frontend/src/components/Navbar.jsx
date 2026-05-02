// ABOUTME: Top navigation bar — sticky, responsive, handles lang toggle/sign-out/notifications.
// ABOUTME: Collapses user name+role on mobile; shows icon-only sign-out below 640px.
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Scissors, LogOut } from 'lucide-react'
import NotificationBell from './NotificationBell'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()

  if (!user) return null

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Scissors size={20} aria-hidden="true" />
        {t('shop_name')}
      </div>

      <div className="navbar-actions">
        <button
          onClick={toggleLanguage}
          className="btn btn-ghost btn-sm"
          aria-label={`Switch to ${language === 'en' ? 'French' : 'English'}`}
          style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '45px', color: 'var(--gold)' }}
        >
          {language === 'en' ? 'FR' : 'EN'}
        </button>

        <NotificationBell />

        <div className="navbar-user">
          {user.role === 'barber' && user.user_id <= 3 ? (
            <img
              src={`/images/avatar_${user.user_id}.png`}
              alt={user.name}
              className="navbar-avatar"
            />
          ) : (
            <div className="navbar-avatar-placeholder" aria-hidden="true">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="navbar-user-info">
            <span className="navbar-user-name">{user.name}</span>
            <span className="navbar-user-role">{user.role}</span>
          </div>

          <button
            className="btn btn-ghost btn-sm navbar-signout"
            onClick={logout}
            aria-label={t('sign_out')}
            style={{ marginLeft: '0.5rem' }}
          >
            <span className="navbar-signout-label">{t('sign_out')}</span>
            <LogOut size={16} className="navbar-signout-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  )
}
