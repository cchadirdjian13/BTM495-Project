import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'


export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useAuth()
  const { language, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fmt = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ fontSize:'1.2rem', padding:'0.4rem 0.6rem', position:'relative' }}
        onClick={() => setOpen(o => !o)}
        title={t('notifications')}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <h4>{t('notifications')} {unreadCount > 0 && <span className="gold-text">({unreadCount})</span>}</h4>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={markAllRead}>{t('mark_all_read')}</button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div style={{ padding:'1.5rem', textAlign:'center', color:'var(--muted)', fontSize:'0.85rem' }}>
                {t('no_notifications')}
              </div>
            ) : notifications.map(n => (
              <div
                key={n.notification_id}
                className={`notif-item${!n.is_read ? ' unread' : ''}`}
                onClick={() => !n.is_read && markRead(n.notification_id)}
                style={{ cursor: !n.is_read ? 'pointer' : 'default' }}
              >
                <p>{n.message}</p>
                <div className="notif-time">{fmt(n.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
